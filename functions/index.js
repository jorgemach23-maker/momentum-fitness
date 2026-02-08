const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- CONFIGURACIÓN DE GEMINI (MÉTODO COMPATIBLE) ---
const geminiKey = functions.config().gemini.key;
const genAI = new GoogleGenerativeAI(geminiKey);

const MODEL_NAME = "models/gemini-2.5-flash-preview-09-2025";

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

// --- POST-PROCESSING ---
const processSupersets = (plan) => {
    if (!Array.isArray(plan)) return plan;
    
    return plan.map(day => {
        if (!day.rutinaPrincipal) return day;
        
        return {
            ...day,
            rutinaPrincipal: day.rutinaPrincipal.map(ex => {
                let bloqueType = (ex.tipo_bloque || ex.bloque || "").toLowerCase();
                let isSuperset = bloqueType.includes('superserie') || /A1.*A2/.test(ex.ejercicio) || /[A-Z]2[:\s]/.test(ex.ejercicio) || /\s+y\s+/i.test(ex.ejercicio);

                if (isSuperset) {
                    ex.tipo_bloque = 'superserie';
                    if (!ex.ejercicioA || !ex.ejercicioB) {
                         let rawParts = ex.ejercicio.split(/\s*\+\s*/);
                         const clean = (t) => t ? t.replace(/[A-Z][12][:.)\s]*/gi, '').trim() : "Ejercicio";
                         ex.ejercicioA = clean(rawParts[0] || "Ejercicio A");
                         ex.ejercicioB = clean(rawParts[1] || "Ejercicio B");
                    }
                }

                const seriesCount = parseInt(ex.series) || 1;
                const componentes = [];

                if (isSuperset) {
                    const parseVal = (str) => {
                        if (!str) return { a: "?", b: "?" };
                        const s = String(str);
                        const matchA = s.match(/A1:?\s*([^,]+)/i);
                        const matchB = s.match(/A2:?\s*([^,]+)/i);
                        if (!matchA && !matchB) {
                             const parts = s.split(/[,+]/);
                             return { a: parts[0]?.trim() || s, b: parts[1]?.trim() || s };
                        }
                        return { a: matchA ? matchA[1].trim() : s, b: matchB ? matchB[1].trim() : s };
                    };
                    const repsObj = parseVal(ex.reps);
                    const loadObj = parseVal(ex.carga_sugerida);
                    for (let i = 1; i <= seriesCount; i++) {
                        componentes.push({
                            numero_serie: i,
                            repeticiones_ejercicioA: repsObj.a,
                            repeticiones_ejercicioB: repsObj.b,
                            carga_sugeridaA: loadObj.a,
                            carga_sugeridaB: loadObj.b
                        });
                    }
                } else {
                    for (let i = 1; i <= seriesCount; i++) {
                        componentes.push({
                            numero_serie: i,
                            repeticiones_ejercicio: ex.reps,
                            carga_sugeridaA: ex.carga_sugerida
                        });
                    }
                }
                return { ...ex, componentes };
            })
        };
    });
};

// --- CLOUD FUNCTION PRINCIPAL ---
exports.generateGeminiPlan = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'La función debe ser llamada por un usuario autenticado.');
    }
    if (!geminiKey) {
        console.error("Error: La API Key de Gemini no está configurada.");
        throw new functions.https.HttpsError('internal', 'La configuración del servidor de IA está incompleta.');
    }

    const { profile, recentRoutines, lang } = data;
    if (!profile || !profile.mainGoal) {
        throw new functions.https.HttpsError('invalid-argument', 'El perfil de usuario está incompleto.');
    }

    const langInstruction = lang === 'en' ? "You MUST answer in English." : "DEBES responder en Español.";
    const daysPerWeek = profile.daysPerWeek || 3;
    const strengthProfile = getStrengthProfile(profile);
    const historyContext = buildHistoryContext(recentRoutines);
    const femaleHealthContext = getFemaleHealthContext(profile);

    const systemPrompt = `
    Eres "FitCoach AI", director de programación de fitness. Generas planes de entrenamiento semanales 100% personalizados y científicos ${langInstruction}.
Tu objetivo es devolver un JSON estructurado para una App con tablas editables.

**CONTEXTO DEL ATLETA:**
1.  **Perfil:** ${profile.gender}, ${profile.age} años, ${profile.weight} kg.
2.  **Nivel & BioEdad:** Nivel ${profile.experienceLevel}. Perfil de Fuerza: ${strengthProfile}.
3.  **Objetivo:** ${profile.mainGoal}.
4.  **Salud:** ${profile.injuries || 'Ninguna'}. ${femaleHealthContext}
    * *REGLA:* Si hay lesiones, modifica los ejercicios para no impactar la zona.
5.  **Logística:** ${profile.timeAvailable} min/sesión.
6.  **HISTORIAL:** ${historyContext}

**INSTRUCCIONES DE LÓGICA DE ENTRENAMIENTO:**

1.  **CÁLCULO DINÁMICO DE DESCANSOS (CRÍTICO):**
    * No uses tiempos fijos. Calcula el descanso óptimo (`descanso_segs`) basándote en:
        * **Objetivo:** Fuerza (descansos largos 3-5min), Hipertrofia (1-2min), Metabólico (<1min).
        * **Tipo de Ejercicio:** Compuestos pesados requieren +50% de descanso que aislamiento.
        * **Nivel del Usuario:** Principiantes recuperan más rápido (menor intensidad absoluta).
    * *Ejemplo:* Un usuario avanzado haciendo Sentadilla pesada para Fuerza necesita 180-240s. El mismo usuario haciendo elevaciones laterales necesita 60s.

2.  **MANEJO DE REPETICIONES (RANGOS VS TARGET):**
    * Científicamente solemos usar rangos (ej: 8-10 reps).
    * PERO, para la UI editable, necesitamos un número concreto en \`reps_target\`.
    * **Regla:** En \`reps_target\`, pon siempre el **LÍMITE SUPERIOR** del rango o el número exacto a buscar.
    * En \`reps_texto\`, puedes poner el rango explicativo.

**REGLAS DE FORMATO JSON:**

Estructura de BLOQUES con \`items\`.

**CAMPOS POR ITEM (Strict Typing):**
* **fase_sesion:** "warmup" | "main" | "cooldown". Limita el uso a estas 3 palabras EXACTAS
* **estructura_visual:** "single" | "superset" | "circuit". Limita el uso a estas 3 palabras EXACTAS
* **ejercicio:** Nombre limpio.
* **tecnica:** String con detalles (ej: "Tempo 3-0-1", "Pausa 1s") o null.
* **reps_target (Int | Null):** Número entero ÚNICO para el input numérico (Ej: si piensas 10-12, pon 12). Null si es por tiempo/fallo.
* **reps_texto (String):** Lo que lee el usuario (Ej: "10-12", "AMRAP", "30 seg"). Asegura que si se solicita maximas repeticiones, siempre sea "AMRAP"
* **peso_valor (Float):** Número puro. 0 si es BW.
* **peso_unidad (String):** "kg", "lbs", "BW". Asegura que si el ejercicio es con peso corporal, se muestre "BW"
* **descanso_segs (Int):** Tiempo calculado dinámicamente en segundos.

**EJEMPLO DE SALIDA:**

[
  {
    "diaNombre": "Pierna Hipertrofia",
    "bloques": [
      {
        "fase_sesion": "main",
        "estructura_visual": "single",
        "items": [
          {
            "ejercicio": "Prensa de Piernas",
            "tecnica": "Pies posición alta",
            "series": 3,
            "reps_target": 12, 
            "reps_texto": "10-12", 
            "peso_valor": 120,
            "peso_unidad": "kg",
            "descanso_segs": 120
          }
        ]
      },
      {
        "fase_sesion": "main",
        "estructura_visual": "superset",
        "items": [
          {
            "ejercicio": "Zancadas Caminando",
            "tecnica": null,
            "series": 3,
            "reps_target": 20,
            "reps_texto": "20 pasos",
            "peso_valor": 12,
            "peso_unidad": "kg",
            "descanso_segs": 0
          },
          {
            "ejercicio": "Curl Femoral Sentado",
            "tecnica": "Aguantar contracción",
            "series": 3,
            "reps_target": 15,
            "reps_texto": "12-15",
            "peso_valor": 35,
            "peso_unidad": "kg",
            "descanso_segs": 90
          }
        ]
      }
    ]
  }
]
`;

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        
        let text = response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            text = text.replace(/^```json\s*|```$/g, '');
        } else {
            text = jsonMatch[0];
        }
        
        const plan = JSON.parse(text);
        const processedPlan = processSupersets(plan);
        
        return processedPlan;

    } catch (error) {
        console.error("Error detallado al generar plan con Gemini:", error);
        throw new functions.https.HttpsError('internal', 'No se pudo generar el plan de entrenamiento.');
    }
});

exports.analyzeBioage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'La función debe ser llamada por un usuario autenticado.');
    }
    if (!geminiKey) {
        console.error("Error: La API Key de Gemini no está configurada.");
        throw new functions.https.HttpsError('internal', 'La configuración del servidor de IA está incompleta.');
    }

    const { profile, lang } = data;
    if (!profile || !profile.bioage) {
        throw new functions.https.HttpsError('invalid-argument', 'El perfil de usuario o los datos de Bioage están incompletos.');
    }

    const langInstruction = lang === 'en' ? "You MUST answer in English." : "DEBES responder en Español.";

    const systemPrompt = `
    Eres un fisiólogo del ejercicio y científico de datos. ${langInstruction}
    Tu tarea es analizar los datos biométricos de un usuario para estimar su edad biológica ("BioAge") y proporcionar un breve análisis.

    **Datos del Usuario:**
    - Edad Cronológica: ${profile.age} años
    - Género: ${profile.gender}
    - Peso: ${profile.weight} kg
    - Altura: ${profile.height} cm
    - % Grasa Corporal: ${profile.bodyFat || 'No disponible'}
    - % Masa Muscular: ${profile.muscleMass || 'No disponible'}
    
    **Métricas de Rendimiento (Bioage):**
    - Squat 1RM: ${profile.bioage.sq1rm || 'No disponible'} kg
    - Plank: ${profile.bioage.plank || 'No disponible'} segundos
    - Dominadas (Pull-ups): ${profile.bioage.pullups || 'No disponible'} reps
    - Flexiones (Push-ups): ${profile.bioage.pushups || 'No disponible'} reps
    - Cintura: ${profile.bioage.waist || 'No disponible'} cm
    - VO2 Max: ${profile.bioage.vo2max || 'No disponible'} ml/kg/min
    - Frecuencia Cardíaca en Reposo (RHR): ${profile.bioage.rhr || 'No disponible'} bpm
    - Recuperación de Frecuencia Cardíaca (HRR): ${profile.bioage.hrr || 'No disponible'} bpm (descenso en 1 min)

    **INSTRUCCIONES:**
    1.  **Estima la Edad Biológica (BioAge):** Basándote en una comparación holística de los datos proporcionados contra benchmarks de poblaciones saludables, estima la edad biológica del usuario. Sé realista. Un atleta de 30 años podría tener una BioAge de 25, no de 15.
    2.  **Identifica Fortalezas y Debilidades:** Analiza las métricas para encontrar 1-2 fortalezas y 1-2 debilidades clave.
    3.  **Da Recomendaciones:** Proporciona 1-2 recomendaciones accionables muy breves.

    **FORMATO DE SALIDA (JSON ESTRICTO):**
    La respuesta DEBE ser un ÚNICO objeto JSON. NO incluyas texto, markdown o explicaciones fuera del JSON. La estructura debe ser:

    {
      "bioage": <Número entero. EJ: 28>,
      "strengths": ["<Breve descripción de una fortaleza>", "<Otra fortaleza>"],
      "weaknesses": ["<Breve descripción de una debilidad>", "<Otra debilidad>"],
      "recommendations": ["<Recomendación accionable muy corta>", "<Otra recomendación>"]
    }

    **FIN DE INSTRUCCIONES.**
    `;

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        
        let text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            text = text.replace(/^```json\s*|```$/g, '');
        } else {
            text = jsonMatch[0];
        }
        
        return JSON.parse(text);

    } catch (error) {
        console.error("Error detallado al analizar BioAge con Gemini:", error);
        throw new functions.https.HttpsError('internal', 'No se pudo analizar la edad biológica.');
    }
});
