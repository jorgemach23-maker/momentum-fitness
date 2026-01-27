import { EXERCISE_SCHEMA_V3 } from '../utils/helpers';

// API Key setup - using the provided key
const API_KEY = "AIzaSyC168hQr_3MAlid9sSwOFAKxim0kCg4F5w";

// Core function to call Gemini API directly from the client
async function callGeminiAPI(payload) {
    const { userQuery, contextType, profile, historyContext, language, extraConstraints, schema, responseKey } = payload;

    // Reconstruct System Prompt on Client Side
    const langInstruction = (language === 'en') ? "RESPOND IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
    const bio = profile.bioage || {};
    const weight = parseFloat(profile.weight) || 70;
    const sq1rm = parseFloat(bio.sq1rm) || 0;
    const squatEst = sq1rm > 0 ? sq1rm : Math.round(weight * (profile.gender === 'Hombre' ? 1.2 : 0.8));

    let systemPrompt = "";

    if (contextType === "BIOAGE_ANALYSIS") {
        systemPrompt = `Eres Especialista Clínico. ${langInstruction}. Calcula edad biológica basada en ${profile.age} años, VO2Max ${bio.vo2max}, Fuerza ${bio.sq1rm}. Si faltan datos, estima con lo disponible.`;
    } else {
        const clinicalAdjustments = [];
        if (sq1rm > (1.5 * weight) && bio.plank > 0 && bio.plank < 45) clinicalAdjustments.push("RIESGO LUMBAR (Fuerza > Estabilidad): Sustituir Sentadilla pesada por variantes unilaterales.");
        const minPushups = profile.gender === 'Hombre' ? 15 : 10;
        if (bio.pushups > 0 && bio.pushups < minPushups) clinicalAdjustments.push("DÉFICIT RESISTENCIA EMPUJE: Priorizar volumen en empuje.");
        
        const clinicalPrompt = clinicalAdjustments.length > 0 ? `\n- Datos Clínicos Adicionales: \n${clinicalAdjustments.map(r => `  - ${r}`).join('\n')}` : "\n- Datos Clínicos Adicionales: Perfil saludable.";

        const historyStr = Array.isArray(historyContext) ? historyContext.join('\n') : (historyContext || "Sin historial.");

        // New scientifically-grounded prompt
        systemPrompt = `Eres "FitCoach AI", un experto en fitness y ciencias del deporte. ${langInstruction}
Tu misión es crear rutinas de entrenamiento seguras, efectivas y basadas en evidencia científica.
Debes basar tus recomendaciones en los principios de entrenamiento de fuerza y acondicionamiento de organizaciones reconocidas como la NSCA (National Strength and Conditioning Association) y el ACSM (American College of Sports Medicine).

**Contexto del Atleta:**
- Perfil: ${profile.gender}, ${profile.age} años, ${weight}kg.
- Objetivo Principal: ${profile.mainGoal}.
- Nivel de Experiencia (Estimado): Basado en el historial y fuerza base.
- Lesiones a considerar: ${profile.injuries || 'Ninguna'}.
- Tiempo por sesión: ${profile.timeAvailable} min.
- Historial de Entrenamiento y Feedback: ${historyStr}
- Restricciones Adicionales: ${extraConstraints || "Ninguna"}
${clinicalPrompt}

**INSTRUCCIONES CLAVE:**
1.  **Metodología Científica:** La rutina debe seguir una progresión lógica. Prioriza ejercicios compuestos multiarticulares y compleméntalos con ejercicios de aislamiento según el objetivo. Incluye calentamiento, parte principal y enfriamiento.
2.  **No Alucinar:** No inventes ejercicios. Usa nombres de ejercicios reales y reconocidos. Si un ejercicio tiene variantes, especifícala (ej: "Sentadilla Búlgara" en vez de solo "Sentadilla").
3.  **Duración Precisa:** La duración total de la sesión debe ser lo más cercana posible a los ${profile.timeAvailable} minutos especificados.

**REGLAS DE FORMATO DE SALIDA:**
- La respuesta DEBE ser un objeto JSON estricto y válido.
- Para superseries, el campo "ejercicio" DEBE usar el formato "A1: [Nombre Ejercicio 1] + A2: [Nombre Ejercicio 2]".
- La carga debe estar en kg y las repeticiones deben ser numéricas.`;
    }

    // Extended Strategy: Prioritize the specific model known to work in the monolith
    const attempts = [
        // This specific model was used in ORIGINAL_MONOLITH.jsx and is likely the one whitelisted/available
        { version: 'v1beta', model: 'gemini-2.5-flash-preview-09-2025' }, 
        // Fallbacks
        { version: 'v1beta', model: 'gemini-1.5-flash' },
        { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
        { version: 'v1beta', model: 'gemini-1.5-pro' },
        { version: 'v1', model: 'gemini-pro' }
    ];
    
    let lastError = null;

    for (const attempt of attempts) {
        const { version, model } = attempt;
        const apiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;

        let requestPayload = {
            contents: [{ parts: [{ text: userQuery }] }],
            generationConfig: {
                temperature: 0.7
            }
        };

        // System instructions and JSON mode are v1beta features.
        if (version === 'v1beta') {
            requestPayload.systemInstruction = { parts: [{ text: systemPrompt }] };
            requestPayload.generationConfig.responseMimeType = "application/json";
            
            // Only attach schema if the model supports it (generally 1.5+ and beta endpoints)
            if (schema) {
                requestPayload.generationConfig.responseSchema = schema;
            }
        } else {
            // For v1 (legacy), append system prompt to user text and DO NOT use responseMimeType/responseSchema
            requestPayload.contents[0].parts[0].text = `${systemPrompt}\n\nUser Request: ${userQuery}\n\nRESPOND STRICTLY IN JSON.`;
        }

        try {
            console.log(`Attempting Client-Side AI call: ${version}/${model}`);
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `Gemini API Error ${response.status} for ${version}/${model}: ${errorText}`;
                console.warn(errorMessage);
                lastError = new Error(errorMessage);
                continue;
            }

            const result = await response.json();
            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) {
                throw new Error("AI returned empty response.");
            }

            let cleanedText = rawText;
            if (cleanedText.includes("```json")) {
                cleanedText = cleanedText.split("```json")[1].split("```")[0];
            } else if (cleanedText.includes("```")) {
                cleanedText = cleanedText.split("```")[1].split("```")[0];
            }

            const parsedData = JSON.parse(cleanedText);
            return responseKey ? parsedData[responseKey] : parsedData;

        } catch (error) {
            console.error(`Error with ${version}/${model}:`, error);
            lastError = error;
        }
    }

    throw lastError || new Error("All AI models failed. Please check API Key permissions.");
}

export async function fetchGeminiWeeklyPlan(profile, historyContext, language) {
    const userQuery = `Genera un nuevo plan semanal de ${profile.daysPerWeek} días.`;
    const routineSchema = {
        type: "OBJECT",
        properties: { "diaEnfoque": { type: "STRING" }, "descripcionBreve": { type: "STRING" }, "duracionEstimada": { type: "STRING" }, "calentamiento": { type: "STRING" }, "rutinaPrincipal": { type: "ARRAY", items: EXERCISE_SCHEMA_V3 }, "enfriamiento": { type: "STRING" }, "consejoPro": { type: "STRING" } },
        required: ["diaEnfoque", "descripcionBreve", "rutinaPrincipal", "enfriamiento", "consejoPro", "duracionEstimada"]
    };
    const schema = { type: "OBJECT", properties: { "planSemanal": { type: "ARRAY", items: routineSchema } } };

    return await callGeminiAPI({
        userQuery,
        contextType: "WEEKLY_PLAN",
        profile,
        historyContext,
        language,
        schema,
        responseKey: "planSemanal"
    });
}

export async function fetchGeminiSessionAdjustment(profile, routine, adjustments, language) {
    const { newFocus, newTime, noEquipment } = adjustments;
    const extraConstraints = `Nuevo Enfoque: ${newFocus}. TIEMPO: ${newTime} min. ${noEquipment ? "Sin Equipo" : "Con Equipo"}.`;
    const tempProfile = { ...profile, timeAvailable: newTime };
    const userQuery = `Ajusta esta rutina: ${JSON.stringify(routine)}.`;
    const routineSchema = { type: "OBJECT", properties: { "diaEnfoque": { type: "STRING" }, "descripcionBreve": { type: "STRING" }, "duracionEstimada": { type: "STRING" }, "calentamiento": { type: "STRING" }, "rutinaPrincipal": { type: "ARRAY", items: EXERCISE_SCHEMA_V3 }, "enfriamiento": { type: "STRING" }, "consejoPro": { type: "STRING" } }, required: ["diaEnfoque", "rutinaPrincipal"] };

    return await callGeminiAPI({
        userQuery,
        contextType: "SESSION_ADJUSTMENT",
        profile: tempProfile,
        historyContext: [],
        language,
        extraConstraints,
        schema: routineSchema
    });
}

export async function fetchGeminiBonusSession(profile, historyContext, language) {
    const routineSchema = { type: "OBJECT", properties: { "diaEnfoque": { type: "STRING", "default": "Bonus: Cuerpo Completo" }, "descripcionBreve": { type: "STRING" }, "duracionEstimada": { type: "STRING" }, "calentamiento": { type: "STRING" }, "rutinaPrincipal": { type: "ARRAY", items: EXERCISE_SCHEMA_V3 }, "enfriamiento": { type: "STRING" }, "consejoPro": { type: "STRING" } }, required: ["diaEnfoque", "rutinaPrincipal"] };

    return await callGeminiAPI({
        userQuery: "Rutina bonus",
        contextType: "BONUS_SESSION",
        profile,
        historyContext,
        language,
        extraConstraints: "Genera rutina Bonus Cuerpo Completo.",
        schema: routineSchema
    });
}

export async function fetchGeminiBioageAnalysis(profile, language) {
    const schema = { type: "OBJECT", properties: { "edadBiologica": { type: "INTEGER" }, "diferencia": { type: "INTEGER" }, "evaluacion": { type: "STRING" } }, required: ["edadBiologica", "evaluacion"] };

    return await callGeminiAPI({
        userQuery: "Analiza mi edad biológica",
        contextType: "BIOAGE_ANALYSIS",
        profile,
        language,
        schema
    });
}
