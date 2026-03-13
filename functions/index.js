const functions = require("firebase-functions");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

// --- FUNCIONES HELPER ---
const buildHistoryContext = (recentRoutines) => {
  if (!recentRoutines || recentRoutines.length === 0) return "No hay historial de entrenamiento.";
  const historySummary = recentRoutines.map(r => {
    const feedback = r.feedback ? `Feedback: [Dificultad: ${r.feedback.difficulty}, Notas: ${r.feedback.notes || 'ninguna'}]` : 'Sin feedback.';
    const exercises = r.routine?.rutinaPrincipal?.map(ex => `${ex.ejercicio} (${ex.series}x${ex.reps_logradas || ex.reps} @ ${ex.carga_lograda || ex.carga_sugerida})`).join('; ') || 'No hay datos de ejercicios.';
    return ` - Sesión [${r.diaEnfoque}]: ${feedback} | Logros: ${exercises}`;
  }).join("\n");
  return `\n**Historial de Entrenamiento y Feedback:**\n${historySummary}`;
};

const getStrengthProfile = (profile) => {
    const sq1rm = parseFloat(profile.bioage?.sq1rm) || 0;
    const pushups = parseFloat(profile.bioage?.pushups) || 0;
    const pullups = parseFloat(profile.bioage?.pullups) || 0;
    const isMale = profile.gender === 'Hombre';
    const weight = parseFloat(profile.weight) || 70;
    const squatEst = sq1rm > 0 ? sq1rm : Math.round(weight * (isMale ? 1.2 : 0.8));
    return `Squat (1RM Est): ${squatEst} kg, Push-ups: ${pushups} reps, Pull-ups: ${pullups} reps`;
};

const getFemaleHealthContext = (profile) => {
    if (profile.gender === 'Mujer' && profile.advancedProfile?.healthMetrics) {
        const metrics = Object.entries(profile.advancedProfile.healthMetrics).map(([key, value]) => `- ${key}: ${value}`).join('\n');
        return `\n**Métricas de Salud Femenina (a considerar):**\n${metrics}`;
    }
    return '';
};

// --- ESQUEMA ESTRICTO PARA LA RESPUESTA DE GEMINI (STRUCTURED OUTPUT) ---
const workoutPlanSchema = {
    type: SchemaType.ARRAY,
    description: "Lista de días de entrenamiento para la semana.",
    items: {
        type: SchemaType.OBJECT,
        properties: {
            diaEnfoque: {
                type: SchemaType.STRING,
                description: "Nombre del día o enfoque (ej. 'Torso Fuerza', 'Pierna Hipertrofia')."
            },
            duracionEstimada: {
                type: SchemaType.STRING,
                description: "Duración estimada de la sesión (ej. '45 min')."
            },
            bloques: {
                type: SchemaType.ARRAY,
                description: "Lista de bloques de la sesión (calentamiento, rutina principal, enfriamiento).",
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        fase_sesion: {
                            type: SchemaType.STRING,
                            description: "Debe ser EXACTAMENTE uno de estos valores: 'warmup', 'main', 'cooldown'."
                        },
                        estructura_visual: {
                            type: SchemaType.STRING,
                            description: "Debe ser EXACTAMENTE 'single' para un ejercicio o 'superset' para superseries."
                        },
                        items: {
                            type: SchemaType.ARRAY,
                            description: "Lista de ejercicios dentro de este bloque. Si estructura_visual es 'superset', debe tener exactamente 2 objetos.",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    ejercicio: {
                                        type: SchemaType.STRING,
                                        description: "Nombre claro del ejercicio."
                                    },
                                    tecnica: {
                                        type: SchemaType.STRING,
                                        description: "Instrucción breve de técnica o foco."
                                    },
                                    series: {
                                        type: SchemaType.INTEGER,
                                        description: "Número de series."
                                    },
                                    reps_target: {
                                        type: SchemaType.INTEGER,
                                        description: "Número máximo de repeticiones objetivo (solo un número entero)."
                                    },
                                    reps_texto: {
                                        type: SchemaType.STRING,
                                        description: "Rango visual de repeticiones (ej. '8-10' o 'AMRAP')."
                                    },
                                    peso_valor: {
                                        type: SchemaType.NUMBER,
                                        description: "Carga sugerida en números. Si es peso corporal, usar 0."
                                    },
                                    peso_unidad: {
                                        type: SchemaType.STRING,
                                        description: "Unidad de la carga: 'kg', 'lbs' o 'BW' (bodyweight)."
                                    },
                                    descanso_segs: {
                                        type: SchemaType.INTEGER,
                                        description: "Tiempo de descanso en segundos DESPUÉS de este ejercicio."
                                    }
                                },
                                required: ["ejercicio", "series", "reps_target", "reps_texto", "peso_valor", "peso_unidad", "descanso_segs"]
                            }
                        }
                    },
                    required: ["fase_sesion", "estructura_visual", "items"]
                }
            }
        },
        required: ["diaEnfoque", "bloques"]
    }
};

// --- CLOUD FUNCTIONS ---

exports.generateGeminiPlan = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');

    const geminiKey = functions.config().gemini ? functions.config().gemini.key : null;
    if (!geminiKey) throw new functions.https.HttpsError('failed-precondition', 'Configuración de IA faltante.');

    const { profile, recentRoutines, lang } = data;
    const genAI = new GoogleGenerativeAI(geminiKey);
    
    // Inyectar el Esquema Estricto en la configuración del modelo
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: workoutPlanSchema
        }
    });

    const langInstruction = lang === 'en' ? "You MUST answer in English." : "DEBES responder en Español.";
    const strengthProfile = getStrengthProfile(profile);
    const historyContext = buildHistoryContext(recentRoutines);
    const femaleHealthContext = getFemaleHealthContext(profile);

    // El prompt ahora se centra solo en la LÓGICA DE ENTRENAMIENTO, 
    // porque la ESTRUCTURA JSON ya está garantizada por el responseSchema.
    const systemPrompt = 
        "Eres 'FitCoach AI', un director de programación de fitness de élite.\n" +
        "Genera un plan de entrenamiento semanal de " + (profile.daysPerWeek || 3) + " días. " + langInstruction + ".\n\n" +
        "CONTEXTO DEL ATLETA:\n" +
        "Perfil: " + profile.gender + ", " + profile.age + " años, " + profile.weight + " kg.\n" +
        "Nivel: " + profile.experienceLevel + ". Fuerza: " + strengthProfile + ".\n" +
        "Objetivo: " + profile.mainGoal + ". Salud: " + (profile.injuries || 'Ninguna') + ". " + femaleHealthContext + "\n" +
        "Logística: " + profile.timeAvailable + " min/sesión.\n" +
        "HISTORIAL: " + historyContext + "\n\n" +
        "LÓGICA DE ENTRENAMIENTO:\n" +
        "1. Prioriza ejercicios compuestos para el objetivo principal.\n" +
        "2. Incluye calentamiento ('warmup') con movilidad, y enfriamiento ('cooldown') con estiramientos estáticos.\n" +
        "3. Calcula los descansos según el objetivo (Fuerza=180s, Hipertrofia=90s, Metabolico=60s).\n" +
        "4. En superseries, el 'descanso_segs' del primer ejercicio debe ser 0.\n" +
        "5. Cargas sugeridas ('peso_valor') deben ser realistas según el perfil de fuerza.\n" +
        "6. Esta prohibido que la duracion de las rutinas incluyendo 'warmup' y 'cooldown' sea mayor el determinado en Logística ('profile.timeAvailable').\n" +
        "7. La estructura final DEBE seguir el esquema JSON proporcionado. No inventes propiedades nuevas.";

    try {
        console.log("Iniciando llamada a Gemini con Structured Output...");
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        let text = response.text();
        
        // Al usar responseMimeType: "application/json", la API ya devuelve el JSON limpio (sin ```json)
        const plan = JSON.parse(text);
        return plan; 
        
        // NOTA: Eliminé processSupersets aquí porque el responseSchema 
        // ya obliga a la IA a separar las superseries en el array 'items' nativamente.

    } catch (error) {
        console.error("Error en generateGeminiPlan:", error);
        throw new functions.https.HttpsError('internal', 'Error al generar el plan: ' + error.message);
    }
});

// El resto del archivo se mantiene igual para analyzeBioage y adjustSession...

exports.analyzeBioage = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    
    const geminiKey = functions.config().gemini ? functions.config().gemini.key : null;
    if (!geminiKey) throw new functions.https.HttpsError('failed-precondition', 'API Key faltante');

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const { profile, lang } = data;
    const langInstruction = lang === 'en' ? "Answer in English." : "Responde en Español.";

    const systemPrompt = "Analiza estos datos y estima la BioAge en un JSON:\n" +
        "Edad: " + profile.age + ", Métricas: " + JSON.stringify(profile.bioage) + ". " + langInstruction + "\n" +
        "Formato: { \"bioage\": 30, \"strengths\": [], \"weaknesses\": [], \"recommendations\": [] }";

    try {
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        let text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (error) {
        console.error("Error en analyzeBioage:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.adjustSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
    
    const geminiKey = functions.config().gemini ? functions.config().gemini.key : null;
    if (!geminiKey) throw new functions.https.HttpsError('failed-precondition', 'API Key faltante.');

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        // También aplicamos el esquema aquí para asegurar consistencia
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: workoutPlanSchema.items // El esquema de un solo día
        }
    });

    const { profile, routine, adjustments, lang } = data;
    const langInstruction = lang === 'en' ? "Answer in English." : "Responde en Español.";

    const systemPrompt = 
        "Eres un entrenador experto. Ajusta esta sesión de entrenamiento según los cambios solicitados.\n" +
        "Perfil: " + JSON.stringify(profile) + "\n" +
        "Sesión Original: " + JSON.stringify(routine) + "\n" +
        "Ajustes Solicitados: " + JSON.stringify(adjustments) + "\n" +
        langInstruction + "\n\n" +
        "INSTRUCCIONES:\n" +
        "- Modifica solo lo necesario (tiempo, equipo, músculos).\n" +
        "- Si pide 'Sin Equipo', cambia a ejercicios de peso corporal (peso_valor: 0, peso_unidad: 'BW').\n" +
        "- La estructura devuelta DEBE cumplir estrictamente con el esquema JSON requerido.";

    try {
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        let text = response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error en adjustSession:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
