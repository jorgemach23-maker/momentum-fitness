const functions = require("firebase-functions");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

// --- FUNCIONES HELPER ---

// NUEVO HELPER: Calcula la edad a partir de la fecha de nacimiento (YYYY-MM-DD)
const calculateAgeFromBirthdate = (birthdateString) => {
    if (!birthdateString) return null;
    const birthDate = new Date(birthdateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age > 0 ? age : null; // Devolver null si es inválido
};

// HELPER MODIFICADO: Ahora extrae y asegura la edad correcta antes de procesar
const getEffectiveAge = (profile) => {
    const calculatedAge = calculateAgeFromBirthdate(profile.birthdate);
    // Preferir edad calculada, fallback a profile.age, fallback a 30 por defecto
    return calculatedAge || profile.age || 30; 
};

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

const getLangInstruction = (lang) => {
    switch (lang) {
        case 'en': return "You MUST answer in English. ";
        case 'de': return "Sie MÜSSEN auf Deutsch antworten. ";
        case 'es': 
        default: return "DEBES responder en Español. ";
    }
};

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
                            description: "Debe ser 'single' para un ejercicio normal, o 'superset' para superseries."
                        },
                        items: {
                            type: SchemaType.ARRAY,
                            description: "Lista de ejercicios en este bloque. IMPORTANTE: Si estructura_visual es 'superset', DEBE contener EXACTAMENTE 2 objetos aquí.",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    ejercicio: { type: SchemaType.STRING, description: "Nombre claro del ejercicio." },
                                    tecnica: { type: SchemaType.STRING, description: "Instrucción breve de técnica." },
                                    series: { type: SchemaType.INTEGER, description: "Número de series." },
                                    reps_target: { type: SchemaType.INTEGER, description: "Número máximo de repeticiones objetivo." },
                                    reps_texto: { type: SchemaType.STRING, description: "Rango visual (ej. '8-10')." },
                                    peso_valor: { type: SchemaType.NUMBER, description: "Carga en números (0 si es corporal)." },
                                    peso_unidad: { type: SchemaType.STRING, description: "Unidad ('kg', 'lbs' o 'BW')." },
                                    descanso_segs: { type: SchemaType.INTEGER, description: "Descanso DESPUÉS del ejercicio. En superseries, el primero es 0." }
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

exports.generateGeminiPlan = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado.');
    const geminiKey = functions.config().gemini ? functions.config().gemini.key : null;
    if (!geminiKey) throw new functions.https.HttpsError('failed-precondition', 'Configuración de IA faltante.');

    const { profile, recentRoutines, lang } = data;
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: workoutPlanSchema
        }
    });

    const langInstruction = getLangInstruction(lang);
    const strengthProfile = getStrengthProfile(profile);
    const historyContext = buildHistoryContext(recentRoutines);
    const femaleHealthContext = getFemaleHealthContext(profile);
    
    // CALCULAMOS LA EDAD REAL AQUÍ (Backend)
    const effectiveAge = getEffectiveAge(profile);

    const systemPrompt = 
        "Eres 'FitCoach AI', un director de programación de fitness de élite.\n" +
        "Genera un plan de entrenamiento de " + (profile.daysPerWeek || 3) + " días. " + langInstruction + ".\n\n" +
        "CONTEXTO DEL ATLETA:\n" +
        "Perfil: " + profile.gender + ", " + effectiveAge + " años, " + profile.weight + " kg. Nivel: " + profile.experienceLevel + ".\n" +
        "Objetivo: " + profile.mainGoal + ". Salud: " + (profile.injuries || 'Ninguna') + ".\n" +
        "Logística: " + profile.timeAvailable + " min/sesión.\n" +
        "HISTORIAL: " + historyContext + "\n\n" +
        "LÓGICA DE ENTRENAMIENTO:\n" +
        "1. Prioriza ejercicios compuestos.\n" +
        "2. Incluye siempre 'warmup' y 'cooldown'.\n" +
        "3. REGLA: Si usas 'superset', el array 'items' DEBE tener exactamente 2 ejercicios.\n" +
        "4. En superseries, el 'descanso_segs' del primer ejercicio debe ser 0.\n" +
        "5. Cargas sugeridas deben ser realistas.\n" +
        "6. La duración no debe exceder " + profile.timeAvailable + " min.";

    try {
        console.log(`Iniciando llamada a Gemini. Edad calculada usada: ${effectiveAge} años.`);
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error("Error en generateGeminiPlan:", error);
        throw new functions.https.HttpsError('internal', 'Error al generar el plan: ' + error.message);
    }
});

exports.analyzeBioage = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    const geminiKey = functions.config().gemini ? functions.config().gemini.key : null;
    if (!geminiKey) throw new functions.https.HttpsError('failed-precondition', 'API Key faltante');
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const { profile, lang } = data;
    const langInstruction = getLangInstruction(lang);
    
    // CALCULAMOS LA EDAD REAL AQUÍ (Backend)
    const effectiveAge = getEffectiveAge(profile);

    const systemPrompt = "Analiza estos datos y estima la BioAge en un JSON:\n" +
        "Edad Cronológica Real: " + effectiveAge + " años, Métricas: " + JSON.stringify(profile.bioage) + ". " + langInstruction + "\n" +
        "Formato: { \"bioage\": 30, \"strengths\": [], \"weaknesses\": [], \"recommendations\": [] }";

    try {
        console.log(`Iniciando análisis BioAge. Edad calculada usada: ${effectiveAge} años.`);
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
        generationConfig: { responseMimeType: "application/json", responseSchema: workoutPlanSchema.items }
    });

    const { profile, routine, adjustments, lang } = data;
    const langInstruction = getLangInstruction(lang);

    const systemPrompt = 
        "Eres un entrenador experto. Ajusta esta sesión de entrenamiento según los cambios solicitados.\n" +
        "Perfil: " + JSON.stringify(profile) + "\n" +
        "Sesión Original: " + JSON.stringify(routine) + "\n" +
        "Ajustes Solicitados: " + JSON.stringify(adjustments) + "\n" +
        langInstruction + "\n\n" +
        "INSTRUCCIONES:\n" +
        "- Mantén superseries si existen.\n" +
        "- Si pide 'Sin Equipo', cambia a ejercicios de peso corporal (peso_valor: 0, peso_unidad: 'BW').\n" +
        "- Respeta estrictamente el esquema JSON.";

    try {
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error("Error en adjustSession:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
