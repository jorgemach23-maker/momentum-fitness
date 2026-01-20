import { analyzeBioage, createSystemPrompt, EXERCISE_SCHEMA_V3 } from '../utils/helpers';
import { functions } from './firebase'; // Importa la instancia de functions
import { httpsCallable } from 'firebase/functions';

async function callGeminiAPI(userQuery, systemPrompt, schema, responseKey) {
    try {
        const callGemini = httpsCallable(functions, 'callGeminiAPI');
        const result = await callGemini({
            userQuery,
            systemPrompt,
            schema,
            responseKey
        });

        // El resultado de una función httpsCallable viene en result.data
        return result.data;

    } catch (error) {
        console.error("Error en callGeminiAPI (Cloud Function):", error);
        throw new Error("Error al comunicarse con el servidor de IA.");
    }
}

export async function fetchGeminiWeeklyPlan(profile, historyContext, language) {
  const langInstruction = language === 'en' ? "RESPOND IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
  const clinicalAdjustments = analyzeBioage(profile);
  const systemPrompt = createSystemPrompt(profile, clinicalAdjustments, "WEEKLY_PLAN", historyContext, langInstruction);
  const userQuery = `Genera un nuevo plan semanal de ${profile.daysPerWeek} días.`;
  const routineSchema = {
    type: "OBJECT",
    properties: { "diaEnfoque": { type: "STRING" }, "descripcionBreve": { type: "STRING" }, "duracionEstimada": { type: "STRING" }, "calentamiento": { type: "STRING" }, "rutinaPrincipal": { type: "ARRAY", items: EXERCISE_SCHEMA_V3 }, "enfriamiento": { type: "STRING" }, "consejoPro": { type: "STRING" } },
    required: ["diaEnfoque", "descripcionBreve", "rutinaPrincipal", "enfriamiento", "consejoPro", "duracionEstimada"]
  };
  const schema = { type: "OBJECT", properties: { "planSemanal": { type: "ARRAY", items: routineSchema } } };
  return await callGeminiAPI(userQuery, systemPrompt, schema, "planSemanal");
}

export async function fetchGeminiSessionAdjustment(profile, routine, adjustments, language) {
    const langInstruction = language === 'en' ? "RESPOND IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
    const clinicalAdjustments = analyzeBioage(profile);
    const { newFocus, newTime, noEquipment } = adjustments;
    const extraConstraints = `Nuevo Enfoque: ${newFocus}. TIEMPO: ${newTime} min. ${noEquipment ? "Sin Equipo" : "Con Equipo"}.`;
    const tempProfile = { ...profile, timeAvailable: newTime };
    const systemPrompt = createSystemPrompt(tempProfile, clinicalAdjustments, "SESSION_ADJUSTMENT", [], langInstruction, extraConstraints);
    const userQuery = `Ajusta esta rutina: ${JSON.stringify(routine)}.`;
    const routineSchema = { type: "OBJECT", properties: { "diaEnfoque": { type: "STRING" }, "descripcionBreve": { type: "STRING" }, "duracionEstimada": { type: "STRING" }, "calentamiento": { type: "STRING" }, "rutinaPrincipal": { type: "ARRAY", items: EXERCISE_SCHEMA_V3 }, "enfriamiento": { type: "STRING" }, "consejoPro": { type: "STRING" } }, required: ["diaEnfoque", "rutinaPrincipal"]};
    return await callGeminiAPI(userQuery, systemPrompt, routineSchema, null);
}

export async function fetchGeminiBonusSession(profile, historyContext, language) {
    const langInstruction = language === 'en' ? "RESPOND IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
    const clinicalAdjustments = analyzeBioage(profile);
    const systemPrompt = createSystemPrompt(profile, clinicalAdjustments, "BONUS_SESSION", historyContext, langInstruction, "Genera rutina Bonus Cuerpo Completo.");
    const routineSchema = { type: "OBJECT", properties: { "diaEnfoque": { type: "STRING", "default": "Bonus: Cuerpo Completo" }, "descripcionBreve": { type: "STRING" }, "duracionEstimada": { type: "STRING" }, "calentamiento": { type: "STRING" }, "rutinaPrincipal": { type: "ARRAY", items: EXERCISE_SCHEMA_V3 }, "enfriamiento": { type: "STRING" }, "consejoPro": { type: "STRING" } }, required: ["diaEnfoque", "rutinaPrincipal"] };
    return await callGeminiAPI("Rutina bonus", systemPrompt, routineSchema, null);
}

export async function fetchGeminiBioageAnalysis(profile, language) {
  const bio = profile.bioage || {};
  const langInstruction = language === 'en' ? "RESPOND IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
  const systemPrompt = `Eres Especialista Clínico. ${langInstruction}. Calcula edad biológica basada en ${profile.age} años, VO2Max ${bio.vo2max}, Fuerza ${bio.sq1rm}. Si faltan datos, estima con lo disponible.`;
  const schema = { type: "OBJECT", properties: { "edadBiologica": { type: "INTEGER" }, "diferencia": { type: "INTEGER" }, "evaluacion": { type: "STRING" } }, required: ["edadBiologica", "evaluacion"] };
  return await callGeminiAPI("Analiza mi edad biológica", systemPrompt, schema, null);
}
