const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require('firebase-functions/params');
const { VertexAI } = require('@google-cloud/vertexai');

admin.initializeApp();

// Helper functions for prompt generation (Server-side logic)
const EXERCISE_SCHEMA_V3 = {
  type: "OBJECT",
  properties: {
    "tipo_bloque": { type: "STRING", enum: ["normal", "superserie"] },
    "ejercicio": { type: "STRING" },
    "tecnica_general": { type: "STRING" },
    "componentes": { type: "ARRAY", items: { type: "OBJECT", properties: { "numero_serie": { type: "INTEGER" }, "repeticiones_ejercicio": { type: "STRING" }, "carga_sugerida": { type: "STRING" }, "repeticiones_ejercicioA": { type: "STRING" }, "carga_sugeridaA": { type: "STRING" }, "repeticiones_ejercicioB": { type: "STRING" }, "carga_sugeridaB": { type: "STRING" }, "completado": { type: "BOOLEAN", "default": false } }, required: ["numero_serie"] } }
  },
  required: ["tipo_bloque", "ejercicio", "componentes", "tecnica_general"]
};

// Simplified version of analyzeBioage for server-side
const analyzeBioage = (profile) => {
  const adjustments = [];
  const bio = profile.bioage || {};
  const weight = parseFloat(profile.weight) || 70;
  const height = parseFloat(profile.height) || 175;
  const sq1rm = parseFloat(bio.sq1rm) || 0;
  const plank = parseFloat(bio.plank) || 0;
  const pushups = parseFloat(bio.pushups) || 0;
  const waist = parseFloat(bio.waist) || 0;
  const vo2max = parseFloat(bio.vo2max) || 45; 
  const rhr = parseFloat(bio.rhr) || 60;
  
  if (sq1rm > (1.5 * weight) && plank > 0 && plank < 45) adjustments.push("RIESGO LUMBAR (Fuerza > Estabilidad): Sustituir Sentadilla pesada por variantes unilaterales.");
  const minPushups = profile.gender === 'Hombre' ? 15 : 10;
  if (pushups > 0 && pushups < minPushups) adjustments.push("DÉFICIT RESISTENCIA EMPUJE: Priorizar volumen en empuje.");
  const whtr = (waist > 0 && height > 0) ? (waist / height) : 0;
  if (whtr > 0.55) adjustments.push("RIESGO METABÓLICO (ICA > 0.55): Prioridad Gasto Calórico.");
  if ((vo2max < 38 && vo2max > 0) || (rhr > 80)) adjustments.push("CAPACIDAD AERÓBICA BAJA: Aumentar descansos.");
  
  return adjustments;
};

const createSystemPrompt = (profile, clinicalAdjustments, contextType, historyContext, langInstruction, extraConstraints = "") => {
  // Manejo especial para análisis de edad biológica
  if (contextType === "BIOAGE_ANALYSIS") {
      const bio = profile.bioage || {};
      return `Eres Especialista Clínico. ${langInstruction}. Calcula edad biológica basada en ${profile.age} años, VO2Max ${bio.vo2max}, Fuerza ${bio.sq1rm}. Si faltan datos, estima con lo disponible.`;
  }

  const clinicalPrompt = clinicalAdjustments.length > 0 ? `\n[CLINICAL]:\n${clinicalAdjustments.map(r => `- ${r}`).join('\n')}` : "\n[Clinical]: Healthy.";
  const sq1rm = parseFloat(profile.bioage?.sq1rm) || 0;
  const isMale = profile.gender === 'Hombre';
  const weight = parseFloat(profile.weight) || 70;
  const squatEst = sq1rm > 0 ? sq1rm : Math.round(weight * (isMale ? 1.2 : 0.8));

  return `Eres "FitCoach AI". ${langInstruction}
  Atleta: ${profile.gender}, ${profile.age} años, ${weight}kg.
  Lesiones: ${profile.injuries || 'Ninguna'}.
  Fuerza Base (Est): Squat ${squatEst} kg.
  Meta: ${profile.mainGoal}.
  Tiempo Disponible: ${profile.timeAvailable} min.
  ${clinicalPrompt}
  Historial: ${historyContext}
  ${extraConstraints}
  INSTRUCCIÓN: La duración total debe ser cercana a ${profile.timeAvailable} minutos.
  REGLAS: 
  1. Nombres descriptivos y completos (ej: "Sentadilla (Goblet)" en vez de "Sentadilla").
  2. SUPERSERIES: Campo "ejercicio" DEBE usar formato "A1: [Nombre] + A2: [Nombre]".
  3. Carga en kg, Reps numéricas. JSON Estricto.`;
};

exports.generateWorkoutPlan = onCall({ 
    region: "us-central1",
    maxInstances: 10,
}, async (request) => {
    
    // 1. Authentication
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required.");
    }

    // 2. Input Validation
    const { userQuery, contextType, profile, historyContext, language, extraConstraints, schema } = request.data;

    if (!profile || typeof profile !== 'object') {
        throw new HttpsError("invalid-argument", "Profile data is required.");
    }

    if (!contextType || typeof contextType !== 'string') {
        throw new HttpsError("invalid-argument", "Context type is required.");
    }

    // 3. Construct System Prompt (Server-side)
    const langInstruction = (language === 'en') ? "RESPOND IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
    const clinicalAdjustments = analyzeBioage(profile);
    
    const systemPrompt = createSystemPrompt(
        profile, 
        clinicalAdjustments, 
        contextType, 
        historyContext || [], 
        langInstruction, 
        extraConstraints || ""
    );

    try {
        // Initialize Vertex AI
        // Use 'us-central1' as it is the most common region for Vertex AI
        const vertex_ai = new VertexAI({
            project: process.env.GCLOUD_PROJECT || 'momentum-fitness-ai',
            location: 'us-central1' 
        });

        // Use 'gemini-1.5-flash-001' 
        const model = vertex_ai.preview.getGenerativeModel({
            model: 'gemini-1.5-flash-001', 
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userQuery }] }]
        });

        const response = await result.response;
        
        if (!response.candidates || response.candidates.length === 0) {
             throw new HttpsError("internal", "AI returned no candidates.");
        }

        const text = response.candidates[0].content.parts[0].text;

        if (!text) {
            throw new HttpsError("internal", "AI returned empty response.");
        }

        let cleanedText = text;
        if (cleanedText.includes("```json")) {
            cleanedText = cleanedText.split("```json")[1].split("```")[0];
        } else if (cleanedText.includes("```")) {
            cleanedText = cleanedText.split("```")[1].split("```")[0];
        }

        return JSON.parse(cleanedText);

    } catch (error) {
        // Log the full error structure for debugging
        console.error("Detailed Vertex AI Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
        if (error instanceof HttpsError) throw error;
        
        throw new HttpsError("internal", "AI processing failed via Vertex AI.");
    }
});
