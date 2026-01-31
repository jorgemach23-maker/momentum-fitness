import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const MODEL_NAME = "models/gemini-2.5-flash-preview-09-2025";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- HELPERS ---

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
                // Normalizamos a tipo_bloque
                let bloqueType = (ex.tipo_bloque || ex.bloque || "").toLowerCase();
                
                // Detección robusta de superserie (Eliminamos / de la detección para evitar falsos positivos)
                let isSuperset = bloqueType.includes('superserie') || 
                                 /A1.*A2/.test(ex.ejercicio) || 
                                 /[A-Z]2[:\s]/.test(ex.ejercicio) ||
                                 /\s+y\s+/i.test(ex.ejercicio);

                // Aseguramos que tipo_bloque sea consistente
                if (isSuperset) {
                    ex.tipo_bloque = 'superserie';
                    
                    // Si la IA no devolvió los campos separados, los generamos nosotros
                    if (!ex.ejercicioA || !ex.ejercicioB) {
                         let rawParts = [];
                         
                         if (/[A-Z]2[:\s]/i.test(ex.ejercicio)) {
                              const match = ex.ejercicio.match(/[\+\s]*([A-Z]2[:\s].*)/i);
                              if (match) {
                                  const part2 = match[1];
                                  const part1 = ex.ejercicio.replace(match[0], '').trim();
                                  rawParts = [part1, part2];
                              }
                         }
                         
                         // Split clásico por + (Eliminamos / de aquí)
                         if (rawParts.length < 2) rawParts = ex.ejercicio.split(/\s*\+\s*/);
                         
                         // Fallback "y"
                         if (rawParts.length < 2) rawParts = ex.ejercicio.split(/\s+y\s+/i);
                         
                         // Limpieza
                         const clean = (t) => t ? t.replace(/[A-Z][12][:.)\s]*/gi, '').replace(/^\+\s*/, '').trim() : "Ejercicio";
                         
                         ex.ejercicioA = clean(rawParts[0] || "Ejercicio A");
                         ex.ejercicioB = clean(rawParts[1] || "Ejercicio B");
                    }
                }

                const seriesCount = parseInt(ex.series) || 1;
                const componentes = [];

                if (isSuperset) {
                    // Parse reps and loads
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
                            carga_sugerida: ex.carga_sugerida
                        });
                    }
                }

                return { ...ex, componentes };
            })
        };
    });
};

// --- MAIN PLAN GENERATION FUNCTION ---

export const fetchGeminiWeeklyPlan = async (profile, recentRoutines, lang) => {
    if (!profile || !profile.mainGoal) {
        return [{ error: "Perfil de usuario incompleto." }];
    }

    const langInstruction = lang === 'en' ? "You MUST answer in English." : "DEBES responder en Español.";
    const daysPerWeek = profile.daysPerWeek || 3;
    
    const strengthProfile = getStrengthProfile(profile);
    const historyContext = buildHistoryContext(recentRoutines);
    const femaleHealthContext = getFemaleHealthContext(profile);

    const systemPrompt = `
    Eres "FitCoach AI", un director de programación de fitness de élite. ${langInstruction}
    Tu única tarea es devolver un objeto JSON que representa un plan de entrenamiento semanal.

    **Contexto del Atleta:**
    - Perfil: ${profile.gender}, ${profile.age} años, ${profile.weight} kg, Nivel: ${profile.experienceLevel}.
    - Objetivo Principal: ${profile.mainGoal}.
    - Días/Semana: ${daysPerWeek}.
    - Tiempo/Sesión: ${profile.timeAvailable} min.
    - Lesiones: ${profile.injuries || 'Ninguna'}.
    - Perfil de Fuerza (BioAge): ${strengthProfile}.${femaleHealthContext}${historyContext}

    **INSTRUCCIONES DE DISEÑO:**
    1.  **SOBRECARGA PROGRESIVA**: Usa el Historial para ajustar la dificultad. Si el feedback de un ejercicio fue 'Fácil', incrementa la 'carga_sugerida'. Si fue 'Difícil', considera reducirla o mantenerla.
    2.  **CÁLCULO DE DESCANSO**: El 'descanso_segs' es CRÍTICO. Calcula el tiempo de descanso óptimo: más largo para ejercicios compuestos pesados (ej. 90-180s), más corto para aislamiento o superseries (ej. 45-75s).
    3.  **DURACIÓN TOTAL**: La suma de todos los tiempos de ejercicio y descanso debe aproximarse a los ${profile.timeAvailable} minutos de la sesión.

    **REGLAS DE ORO (FORMATO DE SALIDA JSON ESTRICTO):**
    La respuesta DEBE ser un ÚNICO ARRAY JSON, \`[...rutinas]\`. NO incluyas texto, markdown o explicaciones fuera del JSON.
    Cada objeto en el array representa un día de entrenamiento y DEBE seguir esta estructura exacta:

    {
      "diaEnfoque": "<Descripción. EJ: 'Empuje (Pecho/Hombro/Tríceps)'>",
      "rutinaPrincipal": [
        {
          "tipo_bloque": "Calentamiento",
          "ejercicio": "<Nombre Ejercicio Calentamiento>",
          "series": 1,
          "reps": "15",
          "carga_sugerida": "BW",
          "descanso_segs": 0
        },
        {
          "tipo_bloque": "Principal",
          "ejercicio": "<Nombre Ejercicio Fuerza>",
          "series": 3,
          "reps": "10",
          "carga_sugerida": "40",
          "descanso_segs": 90
        },
        {
          "tipo_bloque": "Enfriamiento",
          "ejercicio": "<Nombre Ejercicio Estiramiento>",
          "series": 1,
          "reps": "1",
          "carga_sugerida": "BW",
          "descanso_segs": 0
        }
      ]
    }

    **REGLAS ESPECÍFICAS DE VALIDACIÓN (CRÍTICO):**
    1.  **ETIQUETADO DE BLOQUES:**
        -   Los primeros ejercicios (preparación/movilidad) **DEBEN** tener \`"tipo_bloque": "Calentamiento"\`.
        -   Los últimos ejercicios (vuelta a la calma/estiramiento) **DEBEN** tener \`"tipo_bloque": "Enfriamiento"\`.
        -   El núcleo del entrenamiento es \`"Principal"\` o \`"Superserie"\`.
        -   **PROHIBIDO** usar "General", "Movilidad" o "Activación" en \`tipo_bloque\`. Úsalos solo como parte del nombre del ejercicio.
    2.  **SUPERSERIES:** \`tipo_bloque\` DEBE ser "Superserie". ADEMÁS de concatenar en \`ejercicio\` (formato "A1: X + A2: Y"), **DEBES INCLUIR** los campos \`ejercicioA\` y \`ejercicioB\` con los nombres limpios.
    3.  **CARGA:** Para superseries, \`carga_sugerida\` debe ser "A1: X, A2: Y".
    4.  **NUNCA** incluyas un campo de descripción o técnica.

    **FIN DE INSTRUCCIONES.**
    `;

    try {
        const result = await model.generateContent([systemPrompt]);
        const cleanedText = result.response.text().replace(/^```json\s*|```$/g, '');
        const rawPlan = JSON.parse(cleanedText);
        return processSupersets(rawPlan);
    } catch (error) {
        console.error("Error al generar/parsear plan semanal:", error);
        try {
            const jsonMatch = error.message.match(/(\[[\s\S]*\])/);
            if (jsonMatch && jsonMatch[1]) return processSupersets(JSON.parse(jsonMatch[1]));
        } catch (e) { console.error("Fallo definitivo al parsear JSON de la respuesta:", e); }
        return [{ diaEnfoque: "Error de Generación", rutinaPrincipal: [{ tipo_bloque: "Principal", ejercicio: "No se pudo generar el plan. Intenta de nuevo.", series: 1, reps: "1", carga_sugerida: "0", descanso_segs: 0 }] }];
    }
};

// --- OTHER FUNCTIONS (BioAge, etc.) ---

export const fetchGeminiBioageAnalysis = async (profile, lang) => {
    if (!profile) return null;
    const langInstruction = lang === 'en' ? "You MUST answer in English." : "DEBES responder en Español.";
    const strengthProfile = getStrengthProfile(profile);
    const systemPrompt = `
    Eres un experto en fitness. ${langInstruction} Calcula la "Bio-Edad" y da un análisis JSON.
    - Datos: Edad: ${profile.age}, Género: ${profile.gender}, ${strengthProfile}.
    - FORMATO JSON: { "bioage": <número>, "strengths": ["<Fortaleza>"], "weaknesses": ["<Debilidad>"], "recommendations": ["<Recomendación>"] }`;
    try {
        const result = await model.generateContent([systemPrompt]);
        return JSON.parse(result.response.text().replace(/^```json\s*|```$/g, ''));
    } catch (error) {
        console.error("Error en fetchGeminiBioageAnalysis:", error);
        return { error: "No se pudo generar el análisis de BioAge." };
    }
};

export const fetchGeminiSessionAdjustment = async (routine, feedback, lang) => {
    console.warn("fetchGeminiSessionAdjustment no está implementado.");
    return routine;
};

export const generateRoutine = async (profile, recentRoutines, day, lang) => {
    console.warn("Llamada a función obsoleta: generateRoutine.");
    const weeklyPlan = await fetchGeminiWeeklyPlan(profile, recentRoutines, lang);
    return weeklyPlan[0] || { error: "Fallo en el fallback de generateRoutine." };
};
