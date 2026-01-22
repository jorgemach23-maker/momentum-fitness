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
        
        const clinicalPrompt = clinicalAdjustments.length > 0 ? `\n[CLINICAL]:\n${clinicalAdjustments.map(r => `- ${r}`).join('\n')}` : "\n[Clinical]: Healthy.";

        const historyStr = Array.isArray(historyContext) ? historyContext.join('\n') : (historyContext || "No history.");

        systemPrompt = `Eres "FitCoach AI". ${langInstruction}
        Atleta: ${profile.gender}, ${profile.age} años, ${weight}kg.
        Lesiones: ${profile.injuries || 'Ninguna'}.
        Fuerza Base (Est): Squat ${squatEst} kg.
        Meta: ${profile.mainGoal}.
        Tiempo Disponible: ${profile.timeAvailable} min.
        ${clinicalPrompt}
        Historial: ${historyStr}
        ${extraConstraints || ""}
        INSTRUCCIÓN: La duración total debe ser cercana a ${profile.timeAvailable} minutos.
        REGLAS: 
        1. Nombres descriptivos y completos (ej: "Sentadilla (Goblet)" en vez de "Sentadilla").
        2. SUPERSERIES: Campo "ejercicio" DEBE usar formato "A1: [Nombre] + A2: [Nombre]".
        3. Carga en kg, Reps numéricas. JSON Estricto.`;
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
