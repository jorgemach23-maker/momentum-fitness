import es from '../../locales/es.json';
import en from '../../locales/en.json';

// Patched to load translations from JSON files, ensuring updates are reflected.
export const TRANSLATIONS = { es, en };

export const calculateSmartRest = (profile, exercise) => {
    let restTime = 60; 
    const goal = profile?.mainGoal || '';
    if (goal.includes('Fuerza') || goal.includes('Strength')) restTime = 180; 
    else if (goal.includes('Hipertrofia') || goal.includes('Hypertrophy')) restTime = 90;
    else if (goal.includes('Grasa') || goal.includes('Cardio') || goal.includes('Fat')) restTime = 45;
    
    if (exercise?.tipo_bloque === 'superserie') {
        if (goal.includes('Fuerza') || goal.includes('Strength')) restTime = 180;
        else restTime = 60; 
    }
    
    if (exercise?.tipo_bloque !== 'superserie') {
        const hrr = parseFloat(profile?.bioage?.hrr) || 0;
        const vo2 = parseFloat(profile?.bioage?.vo2max) || 0;
        if (hrr > 30 && vo2 > 45) restTime -= 15;
    }
    return Math.max(30, restTime);
};

export const analyzeBioage = (profile) => {
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

export const calculateCyclePhase = (lastPeriod, cycleLength = 28) => {
    if (!lastPeriod) return null;
    const lastDate = new Date(lastPeriod);
    if (isNaN(lastDate.getTime())) return null;
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = diffDays % cycleLength || cycleLength;
    if (currentDay >= 1 && currentDay <= 5) return { phase: 'menstrual', day: currentDay, label: 'Menstrual', desc: 'Energía baja. Recuperación.' };
    if (currentDay >= 6 && currentDay <= 13) return { phase: 'follicular', day: currentDay, label: 'Folicular', desc: 'Energía alta. Fuerza.' };
    if (currentDay >= 14 && currentDay <= 16) return { phase: 'ovulation', day: currentDay, label: 'Ovulación', desc: 'Pico de Fuerza.' };
    return { phase: 'luteal', day: currentDay, label: 'Lútea', desc: 'Energía moderada.' };
};

export const buildHistoryContext = (recentRoutines) => {
  if (!recentRoutines || recentRoutines.length === 0) return "No hay historial reciente.";
  return recentRoutines.map(r => {
    let feedbackSummary = "Sin feedback detallado";
    if (r.feedback && r.feedback.difficulty) {
        const entries = Object.entries(r.feedback.difficulty);
        if (entries.length > 0) {
            feedbackSummary = entries.map(([key, val]) => `Ex ${key}: ${val}`).join(', ');
        }
    } else if (r.notes) {
        feedbackSummary = `Notas: ${r.notes}`;
    }
    const exercises = r.routine?.rutinaPrincipal?.map(e => `${e.ejercicio}`).slice(0, 2).join(", ");
    return `- ${r.diaEnfoque}: ${feedbackSummary}. Ejs: ${exercises}`;
  }).join("\n");
};

export const formatDuration = (totalSeconds) => { 
    const m = Math.floor(totalSeconds / 60); 
    const s = totalSeconds % 60; 
    return `${m}:${s.toString().padStart(2, '0')}`; 
};

export const cleanExerciseTitle = (title) => { 
    if (!title) return ""; 
    let cleaned = title;
    let prev;
    const prefixRegex = /^(?:Superserie:?|Serie\s?\w+|[A-Z]\d+[:.)-]?|[A-Z][:.)-]|\d+[:.)-])\s*/i;
    do {
        prev = cleaned;
        cleaned = cleaned.replace(prefixRegex, '').replace(/^[A-Z]\d+\s+/, '').trim();
    } while (cleaned !== prev && cleaned.length > 0);
    return cleaned;
};

export const formatRoutineTitle = (title) => {
    if (!title) return "Entrenamiento";
    let clean = title.replace(/^(?:Lunes|Martes|Miércoles|Miercoles|Jueves|Viernes|Sábado|Sabado|Domingo)(?:\s*[:,-])?\s*/i, '');
    clean = clean.replace(/^(?:Día|Dia)\s*\d+\s*[:,-]?\s*/i, '');
    return clean.trim() || "Entrenamiento";
};

export const formatRepsDisplay = (str) => { 
    if (!str) return "--"; 
    let val = String(str).replace(/segundos?|segun\w*/gi, 'seg').replace(/minutos?|mins?/gi, 'min');
    if (/min|seg|sec|m\b|s\b/i.test(val)) return val.substring(0, 8); 
    const nums = val.match(/\d+/); 
    return nums ? nums[0] : "--"; 
};

export const formatLoadDisplay = (val) => { 
    if (val === undefined || val === null) return "--";
    if (typeof val === 'number') return `${val} kg`;
    const str = String(val);
    if (/BW|PC|Bodyweight/i.test(str)) return "BW"; 
    if (str.includes('%') || /Nvl/i.test(str)) return str.substring(0, 6); 
    const nums = str.match(/[\d.]+/); 
    return nums ? `${nums[0]} kg` : "BW"; 
};

export const distributeWeek = (routinesList, totalDays) => {
  let week = Array(7).fill(null);
  if (!routinesList || routinesList.length === 0) return week;
  const patterns = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  const pattern = patterns[Math.min(totalDays, 7)] || patterns[3];
  routinesList.forEach((routine, idx) => { if (idx < pattern.length) week[pattern[idx]] = routine; else { const emptyIdx = week.indexOf(null); if (emptyIdx !== -1) week[emptyIdx] = routine; } });
  return week;
};

export const EXERCISE_SCHEMA_V3 = {
  type: "OBJECT",
  properties: {
    "tipo_bloque": { type: "STRING", enum: ["normal", "superserie"] },
    "ejercicio": { type: "STRING" },
    "tecnica_general": { type: "STRING" },
    "componentes": { type: "ARRAY", items: { type: "OBJECT", properties: { "numero_serie": { type: "INTEGER" }, "repeticiones_ejercicio": { type: "STRING" }, "carga_sugerida": { type: "STRING" }, "repeticiones_ejercicioA": { type: "STRING" }, "carga_sugeridaA": { type: "STRING" }, "repeticiones_ejercicioB": { type: "STRING" }, "carga_sugeridaB": { type: "STRING" }, "completado": { type: "BOOLEAN", "default": false } }, required: ["numero_serie"] } }
  },
  required: ["tipo_bloque", "ejercicio", "componentes", "tecnica_general"]
};

export const createSystemPrompt = (profile, clinicalAdjustments, contextType, historyContext, langInstruction, extraConstraints = "") => {
  const clinicalPrompt = clinicalAdjustments.length > 0 ? `\n[CLINICAL]:\n${clinicalAdjustments.map(r => `- ${r}`).join('\n')}` : "\n[Clinical]: Healthy.";
  const sq1rm = parseFloat(profile.bioage?.sq1rm) || 0;
  const pushups = parseFloat(profile.bioage?.pushups) || 0;
  const pullups = parseFloat(profile.bioage?.pullups) || 0;
  const isMale = profile.gender === 'Hombre';
  const weight = parseFloat(profile.weight) || 70;
  const squatEst = sq1rm > 0 ? sq1rm : Math.round(weight * (isMale ? 1.2 : 0.8));

  // Build a more detailed strength profile string
  let strengthProfile = `Squat (1RM Est): ${squatEst} kg`;
  if (pushups > 0) {
    strengthProfile += `, Push-ups: ${pushups} reps`;
  }
  if (pullups > 0) {
    strengthProfile += `, Pull-ups: ${pullups} reps`;
  }


  return `Eres "FitCoach AI". ${langInstruction}\n  Atleta: ${profile.gender}, ${profile.age} años, ${weight}kg.\n  Lesiones: ${profile.injuries || 'Ninguna'}.\n  Perfil de Fuerza: ${strengthProfile}.\n  Meta: ${profile.mainGoal}.\n  Tiempo Disponible: ${profile.timeAvailable} min.\n  ${clinicalPrompt}\n  Historial: ${historyContext}\n  ${extraConstraints}\n  INSTRUCCIÓN: La duración total debe ser cercana a ${profile.timeAvailable} minutos.\n  REGLAS: \n  1. Nombres descriptivos y completos (ej: "Sentadilla (Goblet)" en vez de "Sentadilla").\n  2. SUPERSERIES: Campo "ejercicio" DEBE usar formato "A1: [Nombre] + A2: [Nombre]".\n  3. Carga en kg, Reps numéricas. Para ejercicios sin peso, usar \"BW\" (Peso Corporal). JSON Estricto.\n  4. La carga ('carga_sugerida') DEBE ser desafiante y basarse en el Perfil de Fuerza. Evita pesos triviales (ej: 2kg) para atletas fuertes.`;
};