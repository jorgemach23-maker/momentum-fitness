import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, addDoc, getDoc, collection, onSnapshot, 
  serverTimestamp, setLogLevel, Timestamp, query, where, getDocs, writeBatch, orderBy, limit 
} from 'firebase/firestore'; 
import { 
  LucideDumbbell, LucideClipboardList, LucideUser, LucideLoader2, LucideSparkles, 
  LucideArrowLeft, LucideDatabase, LucideMessageSquareText, LucideCheckCircle, 
  LucideTarget, LucideUpload, LucideDownload, LucideX, LucideCopy, LucideClipboard,
  LucideMoon, LucideCalendarDays, LucideClock, LucideRefreshCw, LucideCheck, LucideAlertTriangle,
  LucideBicepsFlexed, LucideStar, LucideRuler, LucideWeight, LucideActivity, LucideFlame,
  LucidePlay, LucideSave, LucideSettings, LucideLogOut, LucideChevronRight, LucideInfo,
  LucideLayers, LucideLink, LucidePlus, LucideTimer, LucideToggleLeft, LucideToggleRight,
  LucideLanguages, LucideChevronDown, LucideChevronUp, LucideHeartPulse, LucideShieldAlert,
  LucideBrainCircuit, LucideStethoscope, LucideScanEye, LucideFileJson, LucideLink2, LucideDna,
  LucideHeart, LucideHourglass, LucideArrowRight
} from 'lucide-react'; 

// --- Configuración de Firebase (INTEGRADA) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyDTcSIPkEt2dtyAmlcC1xFVuZ68e8y1SKM",
  authDomain: "momentum-fitness-ai.firebaseapp.com",
  projectId: "momentum-fitness-ai",
  storageBucket: "momentum-fitness-ai.firebasestorage.app",
  messagingSenderId: "335276198384",
  appId: "1:335276198384:web:ac58a4771d605892203535",
  measurementId: "G-9DJX8R1NX8"
};

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'momentum-fitness-ai';
const appId = rawAppId.replace(/\//g, '_').replace(/\./g, '_'); 

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Error al inicializar Firebase:", e);
}

// --- DICCIONARIO DE TRADUCCIONES ---
const TRANSLATIONS = {
  es: {
    online: "Online", appTitle: "Momentum AI", routineInProgress: "Rutina en curso", errorAuth: "Error de autenticación", errorSave: "Error al guardar",
    tabTraining: "Entrenamiento", tabHistory: "Historial", tabProfile: "Perfil",
    bioageTitle: "Perfil Avanzado (Bioage)", bioageSubtitle: "Biometría Clínica & Estructural", bioageDesc: "Datos opcionales para aumentar precisión de generación de rutina.", structuralIntegrity: "Integridad Estructural", metabolicHealth: "Salud Metabólica", clinicalAnalysis: "Análisis Bioage", detectedRisks: "Reglas de Ajuste Activadas", healthyStatus: "Perfil equilibrado. Sin contraindicaciones estructurales detectadas.", calcBioAge: "Calcular Edad Biológica", bioAgeResult: "Edad Biológica Estimada", realAge: "Cronológica", bioAgeAnalysis: "Análisis de Longevidad",
    cycleTitle: "Salud Femenina (CycleSync)", cycleSubtitle: "Adaptación al Ciclo Menstrual", lastPeriod: "Fecha Última Menstruación", cycleLength: "Duración Ciclo (días)", phase: "Fase Actual", menstrual: "Menstrual", follicular: "Folicular", ovulation: "Ovulación", luteal: "Luteal", phaseDesc: "Impacto en el Entrenamiento",
    tt_sq1rm: "Máximo peso para 1 repetición en Sentadilla.", tt_bp1rm: "Máximo peso para 1 repetición en Banca.", tt_pullups: "Máximas repeticiones estrictas.", tt_pushups: "Máximas flexiones estrictas.", tt_plank: "Tiempo máximo manteniendo postura perfecta.", tt_waist: "Circunferencia a nivel del ombligo.", tt_vo2: "Volumen máximo de oxígeno.", tt_rhr: "Pulsaciones nada más despertar.", tt_hrr: "Pulsaciones que bajan 1 min después de esfuerzo máximo.",
    generating: "Generando...", analyzing: "Analizando Biometría...", designing: "Diseñando Terapia...", optimizing: "Optimizando Cargas...", finalizing: "Finalizando Plan...",
    weeklyProgress: "Progreso Semanal", generalView: "Vista General", weeklyPlan: "Plan Semanal", startRoutine: "COMENZAR", goalMet: "Objetivo Cumplido", progressReg: "Progreso registrado.",
    activeRecovery: "Recuperación Activa", restVital: "El descanso es vital.", regenerateCycle: "Regenerar Ciclo", noPlan: "Sin plan semanal",
    adjustSession: "Ajuste de Sesión", modify: "Modificar:", focusZone: "Zona de Enfoque", timeAvailable: "Tiempo Disponible (min)", modality: "Modalidad", noEquipment: "Entrenamiento sin equipo", recalcParams: "Recalcular Parámetros", processing: "Procesando...",
    activeSession: "Sesión Activa", recovery: "Recuperación", notes: "Notas", finishSession: "Finalizar Sesión", easy: "Fácil", good: "Adecuado", hard: "Difícil", hide: "OCULTAR", viewTech: "Ver Técnica", series: "Serie", reps: "Reps", load: "Carga", superset: "Superserie",
    completed: "Completado", noRecords: "No hay registros previos.",
    biometrics: "Datos Básicos", gender: "Género", age: "Edad", height: "Altura (cm)", weight: "Peso (kg)", bodyFat: "% Grasa (Opcional)", muscleMass: "% Músculo (Opcional)", customFocus: "Enfoque personalizado", mainGoal: "Objetivo Principal", expLevel: "Nivel Experiencia", daysWeek: "Días/Semana", injuries: "Lesiones / Limitaciones", saveFile: "Guardar Expediente", dataManagement: "Gestión de Datos", export: "Exportar", pasteJson: "Pegar JSON", uploadFile: "Cargar Archivo",
    phNotes: "Reporte de dolor, sensaciones o ajustes necesarios...", phInjuries: "Ej. Menisco rodilla derecha...", male: "Hombre", female: "Mujer",
    goalFat: "Perder Grasa / Metabolismo", goalMuscle: "Hipertrofia / Fuerza", goalStrength: "Fuerza Máxima", goalCardio: "Resistencia Cardio",
    expBeginner: "Principiante (0-6 meses)", expInter: "Intermedio (6m - 2y)", expAdvanced: "Avanzado (+2y)",
    msgPlanGen: "¡Nuevo plan terapéutico generado!", msgSessionUpd: "Sesión clínica actualizada.", msgSessionReg: "Sesión completada y registrada.", msgBonusReg: "¡Entreno Bonus registrado!", msgProfileSaved: "Expediente guardado correctamente.", msgImported: "Datos importados.",
    importData: "Importar Datos", copyBackup: "Copia de Seguridad", copied: "Copiado", copyToClip: "Copiar al Portapapeles", importBtn: "Importar",
    cancel: "Cancelar"
  }
};

// --- Estilos Globales ---
const MinimalScrollbarStyles = () => (
  <style>{`
    body { background-color: #0f172a; color: #f8fafc; }
    .minimal-scrollbar { scrollbar-width: thin; scrollbar-color: #334155 #0f172a; }
    .minimal-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
    .minimal-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-radius: 8px; }
    .minimal-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 8px; border: 2px solid #0f172a; }
    .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .gemini-loader-circle { width: 28px; height: 28px; position: relative; animation: spin-slow 2s linear infinite; }
    .gemini-loader-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #2dd4bf; }
    .gemini-loader-path {
      width: 28px; height: 28px; border-radius: 50%; padding: 2px;
      background: conic-gradient(from 0deg, #2dd4bf, #8b5cf6, #2dd4bf);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      animation: spin-slow 2s linear infinite;
    }
    .tooltip { visibility: hidden; opacity: 0; transition: opacity 0.3s; }
    .has-tooltip:hover .tooltip { visibility: visible; opacity: 1; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

const Icon = ({ name, className = "" }) => {
  if (name === 'youtube') {
    return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </svg>
    );
  }

  const icons = {
    dumbbell: LucideDumbbell, list: LucideClipboardList, user: LucideUser, loader: LucideLoader2,
    sparkles: LucideSparkles, arrowLeft: LucideArrowLeft, database: LucideDatabase, feedback: LucideMessageSquareText,
    check: LucideCheckCircle, checkSimple: LucideCheck, target: LucideTarget, upload: LucideUpload,
    download: LucideDownload, close: LucideX, copy: LucideCopy, clipboard: LucideClipboard,
    moon: LucideMoon, calendar: LucideCalendarDays, clock: LucideClock, refresh: LucideRefreshCw,
    alert: LucideAlertTriangle, star: LucideStar, biceps: LucideBicepsFlexed,
    ruler: LucideRuler, weight: LucideWeight, activity: LucideActivity, flame: LucideFlame,
    play: LucidePlay, save: LucideSave, settings: LucideSettings, logout: LucideLogOut, 
    chevronRight: LucideChevronRight, info: LucideInfo, layers: LucideLayers, link: LucideLink,
    plus: LucidePlus, timer: LucideTimer, toggleOn: LucideToggleRight, toggleOff: LucideToggleLeft,
    lang: LucideLanguages, chevronDown: LucideChevronDown, chevronUp: LucideChevronUp,
    heartPulse: LucideHeartPulse, shieldAlert: LucideShieldAlert, brain: LucideBrainCircuit,
    stethoscope: LucideStethoscope, scanEye: LucideScanEye, fileJson: LucideFileJson, link2: LucideLink2,
    dna: LucideDna, flower: LucideHeart, calendarHeart: LucideCalendarDays, hourglass: LucideHourglass, coffee: LucideClock,
    arrowRight: LucideArrowRight
  };
  const LucideIcon = icons[name];
  if (!LucideIcon) return null; 
  return <LucideIcon className={`${className}`} strokeWidth={2} />;
};

const SplashScreen = ({ show }) => (
  <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-1000 pointer-events-none ${show ? 'opacity-100' : 'opacity-0'}`}>
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
      <Icon name="dumbbell" className="w-12 h-12 text-teal-400 relative z-10" />
    </div>
    <h1 className="text-xl font-black text-white tracking-tight">Momentum <span className="text-teal-400">AI</span></h1>
  </div>
);

const GeminiLoader = ({ progressText }) => (
  <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-full border border-teal-500/20 shadow-xl shadow-teal-900/10 backdrop-blur-md transition-all scale-90 origin-right">
    <div className="gemini-loader-circle">
      <div className="gemini-loader-path"></div>
      <Icon name="sparkles" className="gemini-loader-icon w-3 h-3" />
    </div>
    <span className="text-xs font-medium bg-gradient-to-r from-teal-300 to-violet-300 bg-clip-text text-transparent animate-pulse">{progressText}</span>
  </div>
);

// --- LÓGICA DE NEGOCIO (DESCANSOS ROBUSTOS 2.0) ---
const calculateSmartRest = (profile, exercise) => {
    let restTime = 60; 
    const goal = profile.mainGoal || '';
    
    // 1. Base por Objetivo
    if (goal.includes('Fuerza')) restTime = 180; 
    else if (goal.includes('Hipertrofia')) restTime = 90;
    else if (goal.includes('Grasa') || goal.includes('Cardio')) restTime = 45;

    // 2. Ajuste por Superserie: 
    if (exercise?.tipo_bloque === 'superserie') {
        if (goal.includes('Fuerza')) restTime = 180;
        else restTime = 60; // 60s mínimo para recuperación metabólica tras serie doble
    }

    // 3. Ajuste por Bioage (Solo si no es superserie)
    if (exercise?.tipo_bloque !== 'superserie') {
        const hrr = parseFloat(profile.bioage?.hrr) || 0;
        const vo2 = parseFloat(profile.bioage?.vo2max) || 0;
        if (hrr > 30 && vo2 > 45) restTime -= 15;
    }

    return Math.max(30, restTime);
};

const analyzeBioage = (profile) => {
  const adjustments = [];
  const bio = profile.bioage || {};
  const weight = parseFloat(profile.weight) || 70;
  const height = parseFloat(profile.height) || 175;
  const sq1rm = parseFloat(bio.sq1rm) || 0;
  const plank = parseFloat(bio.plank) || 0;
  const pullups = parseFloat(bio.pullups) || 0;
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

const calculateCyclePhase = (lastPeriod, cycleLength = 28) => {
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

const buildHistoryContext = (recentRoutines) => {
  if (!recentRoutines || recentRoutines.length === 0) return "No hay historial reciente.";
  return recentRoutines.map(r => {
    const feedbackSummary = r.feedback ? `Feedback: ${Object.values(r.feedback).join(', ')}` : `Feedback: ${r.notes || 'N/A'}`;
    const exercises = r.routine?.rutinaPrincipal?.map(e => `${e.ejercicio}`).slice(0, 2).join(", ");
    return `- ${r.diaEnfoque}: ${feedbackSummary}. Ejs: ${exercises}`;
  }).join("\n");
};

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

const createSystemPrompt = (profile, clinicalAdjustments, contextType, historyContext, langInstruction, extraConstraints = "") => {
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

async function fetchGeminiWeeklyPlan(profile, historyContext, language) {
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

async function fetchGeminiSessionAdjustment(profile, currentFocus, newFocus, newTime, historyContext, noEquipment, language) {
    const langInstruction = language === 'en' ? "RESPOND IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
    const clinicalAdjustments = analyzeBioage(profile);
    const extraConstraints = `Nuevo Enfoque: ${newFocus}. TIEMPO: ${newTime} min. ${noEquipment ? "Sin Equipo" : "Con Equipo"}.`;
    const tempProfile = { ...profile, timeAvailable: newTime };
    const systemPrompt = createSystemPrompt(tempProfile, clinicalAdjustments, "SESSION_ADJUSTMENT", historyContext, langInstruction, extraConstraints);
    const userQuery = `Genera una rutina ${newFocus} de ${newTime} min.`;
    const routineSchema = { type: "OBJECT", properties: { "diaEnfoque": { type: "STRING" }, "descripcionBreve": { type: "STRING" }, "duracionEstimada": { type: "STRING" }, "calentamiento": { type: "STRING" }, "rutinaPrincipal": { type: "ARRAY", items: EXERCISE_SCHEMA_V3 }, "enfriamiento": { type: "STRING" }, "consejoPro": { type: "STRING" } } };
    return await callGeminiAPI(userQuery, systemPrompt, routineSchema, null);
}

async function fetchGeminiBonusSession(profile, historyContext, language) {
    const langInstruction = language === 'en' ? "RESPOND IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
    const clinicalAdjustments = analyzeBioage(profile);
    const systemPrompt = createSystemPrompt(profile, clinicalAdjustments, "BONUS_SESSION", historyContext, langInstruction, "Genera rutina Bonus Cuerpo Completo.");
    const routineSchema = { type: "OBJECT", properties: { "diaEnfoque": { type: "STRING", "default": "Bonus: Cuerpo Completo" }, "descripcionBreve": { type: "STRING" }, "duracionEstimada": { type: "STRING" }, "calentamiento": { type: "STRING" }, "rutinaPrincipal": { type: "ARRAY", items: EXERCISE_SCHEMA_V3 }, "enfriamiento": { type: "STRING" }, "consejoPro": { type: "STRING" } }, required: ["diaEnfoque", "rutinaPrincipal"] };
    return await callGeminiAPI("Rutina bonus", systemPrompt, routineSchema, null);
}

async function fetchGeminiBioageAnalysis(profile, language) {
  const bio = profile.bioage || {};
  const langInstruction = language === 'en' ? "RESPOND IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
  const systemPrompt = `Eres Especialista Clínico. ${langInstruction}. Calcula edad biológica basada en ${profile.age} años, VO2Max ${bio.vo2max}, Fuerza ${bio.sq1rm}. Si faltan datos, estima con lo disponible.`;
  const schema = { type: "OBJECT", properties: { "edadBiologica": { type: "INTEGER" }, "diferencia": { type: "INTEGER" }, "evaluacion": { type: "STRING" } }, required: ["edadBiologica", "evaluacion"] };
  return await callGeminiAPI("Analiza mi edad biológica", systemPrompt, schema, null);
}

async function callGeminiAPI(userQuery, systemPrompt, schema, responseKey) {
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.7 } };
    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`Error API: ${response.status}`);
      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Respuesta vacía de IA");
      const parsedData = JSON.parse(rawText);
      return responseKey ? parsedData[responseKey] : parsedData;
    } catch (error) { console.error("Gemini Error:", error); throw error; }
}

const distributeWeek = (routinesList, totalDays) => {
  let week = Array(7).fill(null);
  if (!routinesList || routinesList.length === 0) return week;
  const patterns = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  const pattern = patterns[Math.min(totalDays, 7)] || patterns[3];
  routinesList.forEach((routine, idx) => { if (idx < pattern.length) week[pattern[idx]] = routine; else { const emptyIdx = week.indexOf(null); if (emptyIdx !== -1) week[emptyIdx] = routine; } });
  return week;
};

const formatDuration = (totalSeconds) => { const m = Math.floor(totalSeconds / 60); const s = totalSeconds % 60; return `${m}:${s.toString().padStart(2, '0')}`; };
const cleanExerciseTitle = (title) => { 
    if (!title) return ""; 
    let cleaned = title;
    let prev;
    // Bucle para eliminar múltiples capas de prefijos (ej: "1. A1. Nombre")
    do {
        prev = cleaned;
        cleaned = cleaned.replace(/^(?:Superserie:?|Serie\s?\w+|[A-Z]+\d+[:.)-]?|[A-Z][:.)-]|\d+[:.)-])\s*/i, '').replace(/^[A-Z]\d+\s+/, '').trim();
    } while (cleaned !== prev && cleaned.length > 0);
    
    return cleaned;
};
const formatRoutineTitle = (title) => {
    if (!title) return "Entrenamiento";
    // Elimina nombres de días comunes y separadores
    let clean = title.replace(/^(?:Lunes|Martes|Miércoles|Miercoles|Jueves|Viernes|Sábado|Sabado|Domingo)(?:\s*[:,-])?\s*/i, '');
    // NUEVO: Eliminar patrones como "Día 1:", "Dia 1 -", etc. para evitar duplicados
    clean = clean.replace(/^(?:Día|Dia)\s*\d+\s*[:,-]?\s*/i, '');
    return clean.trim() || "Entrenamiento";
};
const formatRepsDisplay = (str) => { 
    if (!str) return "--"; 
    // Reemplazo proactivo de "segundos" o "segun" por "seg" antes de cortar
    let val = str.replace(/segundos?|segun\w*/gi, 'seg').replace(/minutos?|mins?/gi, 'min');
    
    if (/min|seg|sec|m\b|s\b/i.test(val)) return val.substring(0, 8); 
    const nums = val.match(/\d+/); 
    return nums ? nums[0].slice(0, 2) : "--"; 
};
const formatLoadDisplay = (str) => { if (!str || /PC|Bodyweight/i.test(str)) return "-"; if (str.includes('%') || /Nvl/i.test(str)) return str.substring(0, 6); const nums = str.match(/[\d.]+/); return nums ? `${nums[0].substring(0, 4)} kg` : "-"; };

// --- Componentes UI Primitivos ---
const Card = ({ children, className = "", onClick }) => <div onClick={onClick} className={`bg-slate-800/40 border border-slate-700/50 rounded-2xl shadow-sm backdrop-blur-xl transition-all duration-300 ${className}`}>{children}</div>;

const InputField = ({ label, icon, type = "text", name, value, onChange, placeholder, options, isTextArea = false }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className={`absolute left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-400 transition-colors duration-300 ${isTextArea ? 'top-4' : 'inset-y-0'}`}><Icon name={icon} className="w-5 h-5" /></div>
      {options ? (
        <select name={name} value={value} onChange={onChange} className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none appearance-none cursor-pointer hover:bg-slate-800/50">
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : isTextArea ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows="3" className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none min-h-[100px] resize-y" />
      ) : (
        <input type={type} name={name} value={value === 0 ? '' : value} onChange={onChange} placeholder={placeholder} className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none" />
      )}
    </div>
  </div>
);

const BioageInput = ({ label, name, value, onChange, unit, tooltip, isBio = true }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center ml-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label></div>
    <div className="relative group">
       <input type="number" name={isBio ? `bio_${name}` : name} value={value === 0 ? '' : value} onChange={onChange} className="w-full bg-slate-950/30 border border-slate-700/70 text-slate-200 rounded-lg py-3 pl-3 pr-10 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none" placeholder="0" />
       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 pointer-events-none">{unit}</span>
    </div>
  </div>
);

const BioageProfileSection = ({ profile, onChange, lang, onAnalyzeBioage, bioageLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = TRANSLATIONS[lang];
  const bio = profile.bioage || {};
  const handleBioChange = (e) => { const field = e.target.name.replace('bio_', ''); onChange({ target: { name: 'bioage', value: { ...bio, [field]: e.target.value } } }); };
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80 overflow-hidden shadow-lg transition-all duration-300">
       <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20"><Icon name="scanEye" className="w-5 h-5" /></div><div className="text-left"><h3 className="text-sm font-bold text-slate-100">{t.bioageTitle}</h3></div></div>
          <Icon name={isOpen ? "chevronUp" : "chevronDown"} className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
       </button>
       {isOpen && (
          <div className="p-5 pt-0 animate-fadeIn border-t border-slate-700/50">
             <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4"><BioageInput name="sq1rm" value={bio.sq1rm} onChange={handleBioChange} unit="kg" label="Squat 1RM" /><BioageInput name="plank" value={bio.plank} onChange={handleBioChange} unit="seg" label="Plank" /></div>
                <div className="grid grid-cols-2 gap-4"><BioageInput name="pullups" value={bio.pullups} onChange={handleBioChange} unit="reps" label="Dominadas" /><BioageInput name="pushups" value={bio.pushups} onChange={handleBioChange} unit="reps" label="Flexiones" /></div>
                <div className="grid grid-cols-2 gap-3"><BioageInput name="waist" value={bio.waist} onChange={handleBioChange} unit="cm" label="Cintura" /><BioageInput name="vo2max" value={bio.vo2max} onChange={handleBioChange} unit="ml" label="VO2 Max" /></div>
                <div className="grid grid-cols-2 gap-3"><BioageInput name="rhr" value={bio.rhr} onChange={handleBioChange} unit="bpm" label="FC Reposo" /><BioageInput name="hrr" value={bio.hrr} onChange={handleBioChange} unit="bpm" label="Recuperación" /></div>
                <button onClick={() => onAnalyzeBioage(profile)} disabled={bioageLoading} className="w-full py-3 rounded-xl bg-slate-800 border border-teal-500/30 text-teal-400 hover:bg-slate-700/80 transition-all font-bold text-xs flex items-center justify-center gap-2">{bioageLoading ? <Icon name="loader" className="w-4 h-4 animate-spin"/> : <Icon name="brain" className="w-4 h-4"/>} {bioageLoading ? t.processing : t.calcBioAge}</button>
                
                {/* --- NUEVA SECCIÓN DE VISUALIZACIÓN DE RESULTADOS --- */}
                {profile.bioageEstimation && (
                  <div className="mt-4 p-4 bg-violet-900/20 border border-violet-500/30 rounded-xl animate-fadeIn">
                    <div className="flex justify-between items-center mb-2">
                       <div>
                          <div className="text-[10px] uppercase text-violet-400 font-bold">{t.realAge}</div>
                          <div className="text-xl font-mono text-slate-300">{profile.age} <span className="text-xs">años</span></div>
                       </div>
                       <Icon name="arrowRight" className="text-violet-500/50 w-6 h-6"/>
                       <div className="text-right">
                          <div className="text-[10px] uppercase text-teal-400 font-bold">{t.bioAgeResult}</div>
                          <div className="text-3xl font-black text-teal-300 drop-shadow-sm">{profile.bioageEstimation.edadBiologica} <span className="text-base font-normal text-teal-500/80">años</span></div>
                       </div>
                    </div>
                    {profile.bioageEstimation.evaluacion && (
                        <div className="text-xs text-slate-300 italic border-t border-violet-500/20 pt-2 mt-2 leading-relaxed">
                        "{profile.bioageEstimation.evaluacion}"
                        </div>
                    )}
                  </div>
                )}
             </div>
          </div>
       )}
    </div>
  );
};

const CycleSyncSection = ({ profile, onChange, lang }) => {
    if (profile.gender !== 'Mujer') return null;
    const t = TRANSLATIONS[lang];
    const cycle = profile.menstrualCycle || { lastPeriod: '', cycleLength: 28 };
    const currentPhase = calculateCyclePhase(cycle.lastPeriod, cycle.cycleLength);
    const handleCycleChange = (e) => onChange({ target: { name: 'menstrualCycle', value: { ...cycle, [e.target.name]: e.target.value } } });
    return (
        <Card className="p-6 border-pink-500/20 bg-gradient-to-br from-slate-900 to-pink-900/10">
            <h3 className="text-sm font-bold text-pink-300 uppercase tracking-wider mb-2 flex items-center gap-2"><Icon name="flower" className="w-4 h-4 text-pink-400"/> {t.cycleTitle}</h3>
            <div className="grid grid-cols-2 gap-4 mb-5">
                <input type="date" name="lastPeriod" value={cycle.lastPeriod} onChange={handleCycleChange} className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-lg py-3 px-3 text-xs outline-none" />
                <input type="number" name="cycleLength" value={cycle.cycleLength} onChange={handleCycleChange} className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-lg py-3 px-3 text-xs outline-none" />
            </div>
            {currentPhase && <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4"><h4 className="text-lg font-bold text-pink-100">{currentPhase.label}</h4><p className="text-xs text-pink-200/80">{currentPhase.desc}</p></div>}
        </Card>
    );
};

// --- COMPONENTES NUEVOS DE DISEÑO (Dashboard Action) ---

const WeeklyProgressBar = ({ weekDistribution, completionLog, todayIndex }) => (
  <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-6 backdrop-blur-sm">
      <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tu Racha</span><span className="text-xs text-slate-300 font-medium">Semana {weekDistribution.length > 0 ? 'Activa' : 'Off'}</span></div>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
           const isCompleted = completionLog.has(dayIdx);
           const isToday = dayIdx === todayIndex;
           let bgClass = "bg-slate-700/50";
           let borderClass = "border-transparent";
           if (isCompleted) bgClass = "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]";
           else if (isToday) { bgClass = "bg-slate-800"; borderClass = "border-teal-500 animate-pulse"; }
           return <div key={dayIdx} className={`w-3 h-3 rounded-full border ${borderClass} ${bgClass} transition-all duration-500`}></div>;
        })}
      </div>
  </div>
);

const ExerciseListPreview = ({ exercises, limit }) => {
  const visibleEx = limit ? exercises.slice(0, limit) : exercises;
  const remaining = limit ? Math.max(0, exercises.length - limit) : 0;
  
  return (
    <div className="space-y-2 mt-2">
       {visibleEx.map((ex, i) => {
         // LÓGICA DE VISUALIZACIÓN DE SUPERSERIES REDISEÑADA
         const isSuperset = ex.tipo_bloque === 'superserie';
         let content = null;

         if (isSuperset) {
             // Intentar separar A1 y A2
             const separators = ['+', '\n', ' y ', ' / '];
             let parts = [ex.ejercicio];
             for (const sep of separators) {
                 if (ex.ejercicio.includes(sep)) {
                     parts = ex.ejercicio.split(sep);
                     break;
                 }
             }

             if (parts.length < 2) {
                 // Fallback si no se puede separar limpiamente pero es superserie
                 parts = [ex.ejercicio, "Ver detalles"];
             }

             const name1 = cleanExerciseTitle(parts[0]);
             // Limpieza secundaria para el segundo elemento "A2 Nombre"
             let name2 = cleanExerciseTitle(parts[1]);
             name2 = name2.replace(/^[A-Z]\d+[\s.-]*/, ''); 

             content = (
                 <div className="flex flex-col w-full gap-1">
                     <div className="flex justify-between items-baseline">
                         <div className="flex items-center gap-1.5 overflow-hidden">
                             <span className="text-[9px] font-black text-cyan-400 bg-cyan-900/30 px-1 rounded border border-cyan-500/20 whitespace-nowrap">A1</span>
                             <p className="text-xs font-medium text-slate-200 truncate">{name1}</p>
                         </div>
                     </div>
                     <div className="flex justify-between items-baseline">
                         <div className="flex items-center gap-1.5 overflow-hidden">
                             <span className="text-[9px] font-black text-blue-400 bg-blue-900/30 px-1 rounded border border-blue-500/20 whitespace-nowrap">A2</span>
                             <p className="text-xs font-medium text-slate-200 truncate">{name2}</p>
                         </div>
                     </div>
                 </div>
             );

         } else {
             // EJERCICIO NORMAL
             const rawName = cleanExerciseTitle(ex.ejercicio);
             let equipBadge = "General";
             if(rawName.match(/barra/i)) equipBadge = "Barra"; else if(rawName.match(/mancuerna/i)) equipBadge = "Mancuernas"; else if(rawName.match(/polea|cable/i)) equipBadge = "Polea"; else if(rawName.match(/máquina|maquina/i)) equipBadge = "Máquina"; else if(rawName.match(/corporal|bodyweight/i)) equipBadge = "Body";

             content = (
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <p className="text-xs font-medium text-slate-200 truncate pr-2">{rawName}</p>
                        <span className="text-[8px] font-bold text-slate-500 uppercase bg-slate-800 px-1 py-0.5 rounded border border-slate-700 whitespace-nowrap">{equipBadge}</span>
                    </div>
                </div>
             );
         }

         return (
           <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${isSuperset ? 'bg-slate-900/60 border-cyan-900/30' : 'bg-slate-900/40 border-slate-700/30'}`}>
              <span className={`shrink-0 flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold mt-0.5 ${isSuperset ? 'bg-cyan-900/20 text-cyan-500' : 'bg-teal-900/30 text-teal-400'}`}>{i + 1}</span>
              {content}
           </div>
         );
       })}
       {remaining > 0 && <div className="text-center pt-1"><span className="text-[10px] text-slate-500 font-medium">+ {remaining} ejercicios...</span></div>}
    </div>
  );
};

const HeroRoutineCard = ({ routine, onView, onAdjust }) => {
  if (!routine) return <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-700 rounded-2xl">Todo listo por hoy.</div>;
  const data = routine.routine || {};
  
  // LOGIC IN VIEW: Formateo y eliminación de "Lunes" etc.
  let displayTitle = formatRoutineTitle(data.diaEnfoque || data.descripcionBreve);
  // Si tenemos el día de la semana, lo usamos como prefijo
  if (routine.weekDay) {
      displayTitle = `Día ${routine.weekDay}: ${displayTitle}`;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700/50 shadow-xl transition-all animate-fadeIn">
       <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
       <div className="p-4 relative z-10">
          <div className="flex justify-between items-start mb-3">
             <div className="flex-1 mr-2">
                <div className="flex items-center gap-2 mb-1"><span className="inline-block px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[9px] font-black uppercase tracking-wider border border-teal-500/20">Sugerencia</span><span className="text-[10px] text-slate-500 font-mono">{data.duracionEstimada}</span></div>
                <h2 className="text-lg font-bold text-white leading-tight line-clamp-2">{displayTitle}</h2>
             </div>
             <button onClick={(e) => { e.stopPropagation(); onAdjust(); }} className="p-2 rounded-full bg-slate-700/50 text-slate-400 hover:text-white transition-all shrink-0"><Icon name="settings" className="w-4 h-4" /></button>
          </div>
          <div className="mb-12"><ExerciseListPreview exercises={data.rutinaPrincipal || []} /></div>
       </div>
       <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent flex justify-end items-center z-20">
           <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onView(routine); }} className="group flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-full font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95 cursor-pointer z-50"><span className="text-xs tracking-wide">INICIAR</span><div className="w-8 h-8 bg-slate-900/20 rounded-full flex items-center justify-center group-hover:bg-slate-900/30 transition-colors"><Icon name="play" className="w-3.5 h-3.5 fill-current" /></div></button>
       </div>
    </div>
  );
};

const RoutineLibraryList = ({ routines, onView, onAdjust }) => {
  const [expandedId, setExpandedId] = useState(null);
  if (!routines || routines.length === 0) return <div className="text-center py-8 text-xs text-slate-500">No hay opciones alternativas pendientes.</div>;
  return (
    <div className="space-y-2 pb-20">
       {routines.map((r) => {
         const isExpanded = expandedId === r.id;
         const data = r.routine || {};
         // LOGIC IN VIEW: Formateo y eliminación de "Lunes" etc.
         let displayTitle = formatRoutineTitle(data.diaEnfoque || data.descripcionBreve);
         if (r.weekDay) {
            displayTitle = `Día ${r.weekDay}: ${displayTitle}`;
         }

         return (
           <div key={r.id} className={`rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-slate-800 border-teal-500/30 shadow-md' : 'bg-slate-800/40 border-slate-700/50'}`}>
              <div className="w-full flex items-center justify-between p-3 text-left">
                 <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-teal-500 text-slate-900' : 'bg-slate-900 text-slate-500'}`}><Icon name="dumbbell" className="w-4 h-4" /></div>
                    <div><h4 className={`text-xs font-bold ${isExpanded ? 'text-white' : 'text-slate-300'}`}>{displayTitle}</h4><p className="text-[9px] text-slate-500 font-mono flex items-center gap-2"><span>{data.duracionEstimada}</span>{r.status === 'completed' && <span className="text-emerald-500">• Completado</span>}</p></div>
                 </button>
                 <div className="flex items-center gap-2">
                     {/* BOTÓN AJUSTE INCORPORADO */}
                     <button onClick={(e) => { e.stopPropagation(); onAdjust(r); }} className="p-2 rounded-full bg-slate-700/30 text-slate-500 hover:text-white hover:bg-slate-700 transition-all"><Icon name="settings" className="w-4 h-4" /></button>
                     <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className={`transition-transform duration-300 p-1 ${isExpanded ? 'rotate-180 text-teal-500' : 'text-slate-600'}`}><Icon name="chevronDown" className="w-4 h-4" /></button>
                 </div>
              </div>
              <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                 <div className="p-3 pt-0 border-t border-slate-700/50">
                    <div className="mt-2 mb-4"><ExerciseListPreview exercises={data.rutinaPrincipal || []} limit={3} /></div>
                    <div className="flex justify-end"><button onClick={(e) => { e.stopPropagation(); onView(r); }} className="group flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold shadow-md transition-all active:scale-95"><span className="text-xs tracking-wide">INICIAR SESIÓN</span><div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center"><Icon name="play" className="w-3.5 h-3.5 fill-current" /></div></button></div>
                 </div>
              </div>
           </div>
         );
       })}
    </div>
  );
};

const AdjustSessionView = ({ nextRoutine, profile, onProfileChange, onAdjustNextSession, loading, progressText, lang }) => {
    const t = TRANSLATIONS[lang];
    const [selectedMuscles, setSelectedMuscles] = useState([]);
    const [noEquipment, setNoEquipment] = useState(false); 
    const [isZoneOpen, setIsZoneOpen] = useState(false);
    const toggleMuscle = (m) => setSelectedMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
    useEffect(() => { if (selectedMuscles.length > 0) onProfileChange({ target: { name: 'muscleFocus', value: selectedMuscles.join(', ') } }); }, [selectedMuscles, onProfileChange]);
    const muscleOptions = [ { category: "Grupos", items: ["Tren Superior", "Tren Inferior", "Core", "Full Body"] }, { category: "Músculos", items: ["Glúteos", "Cuádriceps", "Pecho", "Espalda", "Brazos"] } ];
    return (
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6 border-b border-slate-700/50 pb-4"><div><h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Icon name="settings" className="w-5 h-5 text-slate-400"/> {nextRoutine.diaEnfoque}</h3></div>{loading && <GeminiLoader progressText={progressText} />}</div>
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-6 items-center"><InputField label={t.timeAvailable} icon="clock" type="number" name="timeAvailable" value={profile.timeAvailable} onChange={onProfileChange} /><div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t.modality}</label><button onClick={() => setNoEquipment(!noEquipment)} className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between transition-all ${noEquipment ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-900/50 border-slate-700 text-slate-400'}`}><span className="text-sm font-semibold">{t.noEquipment}</span><Icon name={noEquipment ? "toggleOn" : "toggleOff"} className={`w-6 h-6 ${noEquipment ? "text-indigo-400" : "text-slate-600"}`} /></button></div></div>
           <div className="border border-slate-700 rounded-xl overflow-hidden"><button onClick={() => setIsZoneOpen(!isZoneOpen)} className="w-full p-4 flex items-center justify-between bg-slate-900/50 hover:bg-slate-800 transition-colors"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.focusZone}</span><Icon name={isZoneOpen ? "chevronUp" : "chevronDown"} className="w-4 h-4 text-slate-500" /></button>{isZoneOpen && (<div className="p-4 bg-slate-900/30 animate-fadeIn border-t border-slate-700/50"><div className="flex flex-wrap gap-2.5">{muscleOptions.flatMap(g => g.items).map(muscle => { const isSelected = selectedMuscles.includes(muscle); return (<button key={muscle} onClick={() => toggleMuscle(muscle)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 border hover:scale-105 active:scale-95 ${isSelected ? 'bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-900/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>{muscle}</button>); })}</div></div>)}</div>
           <button onClick={() => onAdjustNextSession(nextRoutine, profile, noEquipment)} disabled={loading} className="w-full py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2 shadow-lg">{loading ? t.processing : <><Icon name="refresh" className="w-5 h-5" /> {t.recalcParams}</>}</button>
        </div>
      </Card>
    );
};

const RoutineDisplay = ({ routine, onBack, routineId, onRoutineFeedback, successMessage, lang, onExerciseComplete }) => {
    const t = TRANSLATIONS[lang];
    const [exerciseFeedback, setExerciseFeedback] = useState({});
    const [notes, setNotes] = useState("");
    const [exerciseDesc, setExerciseDesc] = useState({});
    const [completedSets, setCompletedSets] = useState({});

    if (!routine) return null;

    // --- NUEVA LÓGICA DE APERTURA DE DEMO (SMART DEEP-LINKING) ---
    const openDemo = (exerciseName) => {
       if (!exerciseName) return;
       // Limpieza para búsqueda: Quitar "A1:", paréntesis y caracteres raros
       const cleanName = exerciseName.replace(/^[A-Z]\d+[:.]\s*/, '').replace(/\(.*\)/, '').trim();
       const query = encodeURIComponent(`${cleanName} tecnica ejercicio gym`);
       window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    };

    const handleExerciseFeedback = (index, difficulty) => {
        setExerciseFeedback(prev => ({ ...prev, [index]: difficulty }));
    };

    const handleFeedbackSubmit = () => onRoutineFeedback(routineId, { difficulty: exerciseFeedback, sets: completedSets }, notes, null);
    
    const toggleSetCompletion = (exIndex, setIndex, exercise) => {
        const key = `${exIndex}-${setIndex}`;
        setCompletedSets(prev => {
            const newState = !prev[key];
            if (newState && onExerciseComplete) onExerciseComplete(exercise);
            return {...prev, [key]: newState};
        });
    };

    const FeedbackButton = ({ label, value, index, current, iconName }) => {
      const isSelected = current === value;
      const styles = { facil: 'bg-emerald-600/20 border-emerald-500 text-emerald-400', media: 'bg-amber-600/20 border-amber-500 text-amber-400', dificil: 'bg-red-600/20 border-red-500 text-red-400', default: 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700' };
      return (
        <button onClick={() => handleExerciseFeedback(index, value)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-xs font-bold transition-all duration-300 ${isSelected ? styles[value] : styles.default}`}><Icon name={iconName} className="w-4 h-4" /> {label}</button>
      );
    };
    
    return (
      <div className="animate-fadeIn pb-24 px-2">
        <div className="snap-start scroll-mt-24 relative rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl mb-8">
           <div className="absolute top-0 right-0 p-8 opacity-5"><Icon name="activity" className="w-40 h-40" /></div>
           <div className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-3">
                 <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 text-[10px] font-bold uppercase tracking-wider border border-teal-500/20">{t.activeSession}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2 tracking-tight">{routine.diaEnfoque}</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-lg">{routine.consejoPro}</p>
              <div className="flex gap-4">
                 <div className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 flex items-center gap-2 text-xs text-slate-300">
                    <Icon name="clock" className="w-3.5 h-3.5 text-teal-400" /> {routine.duracionEstimada}
                 </div>
                 <div className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 flex items-center gap-2 text-xs text-slate-300">
                    <Icon name="flame" className="w-3.5 h-3.5 text-orange-400" /> {routine.calentamiento}
                 </div>
              </div>
           </div>
        </div>
  
        <div className="space-y-6">
          {routine.rutinaPrincipal?.map((ex, i) => {
            const isSuperset = ex.tipo_bloque === 'superserie';
            const setsData = ex.componentes || [];
            const blockLetter = String.fromCharCode(65 + i);

            let titleA = "Ejercicio 1", titleB = "Ejercicio 2";
            if (isSuperset) {
                const separators = ['+', '/', '\n', ' y '];
                let parts = null;
                for (const sep of separators) {
                    if (ex.ejercicio.includes(sep)) {
                        parts = ex.ejercicio.split(sep);
                        break;
                    }
                }
                
                if (parts && parts.length >= 2) {
                    titleA = parts[0]?.trim();
                    titleB = parts[1]?.trim();
                } else {
                    titleA = ex.ejercicio;
                    titleB = "Parte 2 (Ver detalle)";
                }
                titleA = cleanExerciseTitle(titleA);
                titleB = cleanExerciseTitle(titleB);
            } else {
                titleA = ex.ejercicio;
            }

            // AJUSTE DINÁMICO DE TAMAÑO DE FUENTE
            const getTitleClass = (txt) => {
                if (txt.length > 35) return "text-sm leading-tight";
                if (txt.length > 25) return "text-base leading-tight";
                return "text-lg";
            };
  
            return (
               // AÑADIDO: snap-start y scroll-mt-24 para que el snap respete el header
               <Card key={i} className="snap-start scroll-mt-24 overflow-hidden bg-slate-900 border-slate-800 shadow-xl">
                  <div className="p-5">
                     {isSuperset ? (
                        <div className="mb-6 relative">
                           <div className="flex items-center gap-2 mb-4">
                              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-bold uppercase border border-cyan-500/20">Superserie</span>
                              <span className="text-[10px] text-slate-500">Sin descanso entre ejercicios</span>
                           </div>
                           
                           {/* HEADER EJERCICIO 1 (A1/B1...) + BOTÓN DEMO */}
                           <div className="flex justify-between items-center bg-cyan-900/10 p-3 rounded-lg border border-cyan-500/30 mb-8 relative z-10 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                              <h3 className={`${getTitleClass(titleA)} font-black text-cyan-100 flex items-center`}>
                                <span className="text-cyan-400 mr-2 drop-shadow-sm flex-shrink-0">{blockLetter}1:</span>
                                <span>{titleA}</span>
                              </h3>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); openDemo(titleA); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20" title="Ver video">
                                    <Icon name="youtube" className="w-3.5 h-3.5 fill-current" />
                                    <span className="text-[10px] font-bold">VIDEO</span>
                                </button>
                                <button onClick={() => setExerciseDesc(p => ({...p, [i]: !p[i]}))} className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-full text-[10px] font-bold border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
                                    <Icon name="info" className="w-3 h-3"/>
                                </button>
                              </div>
                           </div>

                           {/* Conector Visual */}
                           <div className="absolute left-8 top-[85px] h-8 w-full border-l-2 border-b-2 border-slate-700/50 rounded-bl-2xl z-0 pointer-events-none"></div>
                           
                           {/* HEADER EJERCICIO 2 (A2/B2...) + BOTÓN DEMO */}
                           <div className="flex justify-between items-center bg-blue-950/60 p-3 rounded-lg border border-blue-800/60 relative z-10 mt-4 shadow-inner">
                              <h3 className={`${getTitleClass(titleB)} font-black text-blue-100 flex items-center`}>
                                <span className="text-blue-400 mr-2 flex-shrink-0">{blockLetter}2:</span>
                                <span>{titleB}</span>
                              </h3>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); openDemo(titleB); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20" title="Ver video">
                                    <Icon name="youtube" className="w-3.5 h-3.5 fill-current" />
                                    <span className="text-[10px] font-bold">VIDEO</span>
                                </button>
                                <button onClick={() => setExerciseDesc(p => ({...p, [i]: !p[i]}))} className="flex items-center gap-1 bg-blue-500/10 text-blue-300 px-2 py-1 rounded-full text-[10px] font-bold border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                 <Icon name="info" className="w-3 h-3"/>
                                </button>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="mb-6">
                           <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                              <h3 className={`${getTitleClass(cleanExerciseTitle(titleA))} font-black text-slate-200 flex items-center`}>
                                 <span className="text-slate-500 mr-2 flex-shrink-0">{blockLetter}:</span>
                                 <span>{cleanExerciseTitle(titleA)}</span>
                              </h3>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); openDemo(titleA); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20" title="Ver video">
                                    <Icon name="youtube" className="w-3.5 h-3.5 fill-current" />
                                    <span className="text-[10px] font-bold">VIDEO</span>
                                </button>
                                <button onClick={() => setExerciseDesc(p => ({...p, [i]: !p[i]}))} className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                 <Icon name="info" className="w-3 h-3"/>
                                </button>
                              </div>
                           </div>
                        </div>
                     )}

                     {exerciseDesc[i] && (
                        <div className="mb-6 p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed border-l-2 border-cyan-500 animate-fadeIn whitespace-pre-wrap">
                           {ex.tecnica_general}
                        </div>
                     )}

                     <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                        {isSuperset ? (
                           <>
                              {/* GRID HEADER SUPERSERIE */}
                              <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_40px] gap-2 mb-3 px-1 text-[9px] font-bold uppercase tracking-wider text-center">
                                 <div className="text-slate-500">#</div>
                                 <div className="text-cyan-400">Reps 1</div>
                                 <div className="text-cyan-400">Carga 1</div>
                                 <div className="text-blue-400">Reps 2</div>
                                 <div className="text-blue-400">Carga 2</div>
                                 <div><Icon name="check" className="w-3 h-3 mx-auto text-slate-500"/></div>
                              </div>
                              <div className="space-y-2">
                                 {setsData.map((set, setIdx) => {
                                    const isDone = completedSets[`${i}-${setIdx}`];
                                    return (
                                       <div key={setIdx} className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_40px] gap-2 items-center">
                                          <div className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-800">
                                             {set.numero_serie || setIdx + 1}
                                          </div>
                                          {/* COLUMNAS 1 - AZUL ELÉCTRICO */}
                                          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded h-10 flex items-center justify-center text-xs font-sans text-cyan-200">
                                            {formatRepsDisplay(set.repeticiones_ejercicioA)}
                                          </div>
                                          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded h-10 flex items-center justify-center text-xs font-sans font-semibold text-cyan-300">
                                            {formatLoadDisplay(set.carga_sugeridaA)}
                                          </div>
                                          {/* COLUMNAS 2 - AZUL OSCURO */}
                                          <div className="bg-blue-900/30 border border-blue-800/40 rounded h-10 flex items-center justify-center text-xs font-sans text-blue-200">
                                            {formatRepsDisplay(set.repeticiones_ejercicioB)}
                                          </div>
                                          <div className="bg-blue-900/30 border border-blue-800/40 rounded h-10 flex items-center justify-center text-xs font-sans font-semibold text-blue-300">
                                            {formatLoadDisplay(set.carga_sugeridaB)}
                                          </div>
                                          <button 
                                             onClick={() => toggleSetCompletion(i, setIdx, ex)}
                                             className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 border ${
                                                isDone 
                                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                : 'bg-transparent border-slate-600 text-transparent hover:border-slate-500'
                                             }`}
                                          >
                                             <Icon name="check" className="w-5 h-5" />
                                          </button>
                                       </div>
                                    );
                                 })}
                              </div>
                           </>
                        ) : (
                           <>
                              {/* NORMAL GRID */}
                              <div className="grid grid-cols-[30px_1fr_1fr_40px] gap-2 mb-3 px-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                 <div>#</div>
                                 <div>Reps</div>
                                 <div>Carga</div>
                                 <div><Icon name="check" className="w-3 h-3 mx-auto"/></div>
                              </div>
                              <div className="space-y-2">
                                 {setsData.map((set, setIdx) => {
                                    const isDone = completedSets[`${i}-${setIdx}`];
                                    return (
                                       <div key={setIdx} className="grid grid-cols-[30px_1fr_1fr_40px] gap-2 items-center">
                                          <div className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-800">
                                             {set.numero_serie || setIdx + 1}
                                          </div>
                                          <div className="bg-slate-700/50 border border-slate-600 rounded h-10 flex items-center justify-center text-xs font-sans text-slate-200">
                                            {formatRepsDisplay(set.repeticiones_ejercicio)}
                                          </div>
                                          <div className="bg-slate-700/50 border border-slate-600 rounded h-10 flex items-center justify-center text-xs font-sans font-semibold text-emerald-400">
                                            {formatLoadDisplay(set.carga_sugerida)}
                                          </div>
                                          <button 
                                             onClick={() => toggleSetCompletion(i, setIdx, ex)}
                                             className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 border ${
                                                isDone 
                                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                : 'bg-transparent border-slate-600 text-transparent hover:border-slate-500'
                                             }`}
                                          >
                                             <Icon name="check" className="w-5 h-5" />
                                          </button>
                                       </div>
                                    );
                                 })}
                              </div>
                           </>
                        )}
                     </div>
                     {/* BOTONES DE FEEDBACK RESTAURADOS */}
                     <div className="flex gap-3 mt-6 pt-0">
                        <FeedbackButton label={t.easy} value="facil" index={i} current={exerciseFeedback[i]} iconName="biceps" />
                        <FeedbackButton label={t.good} value="media" index={i} current={exerciseFeedback[i]} iconName="checkSimple" />
                        <FeedbackButton label={t.hard} value="dificil" index={i} current={exerciseFeedback[i]} iconName="flame" />
                     </div>
                  </div>
               </Card>
            );
          })}
        </div>
        <div className="snap-start mt-10 p-6 bg-slate-800/80 border-t border-slate-700 -mx-4 md:mx-0 md:rounded-2xl backdrop-blur-md">
           <h3 className="text-slate-100 font-bold mb-4 flex items-center gap-2"><Icon name="clipboard" className="w-5 h-5 text-slate-400"/> {t.notes}</h3>
           <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none min-h-[100px] mb-5 placeholder:text-slate-600 transition-all" placeholder={t.phNotes}></textarea>
           <button onClick={handleFeedbackSubmit} className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-900/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-lg"><Icon name="check" className="w-6 h-6" /> {t.finishSession}</button>
        </div>
      </div>
    );
};

const LogradosTabContent = ({ history, profile, onViewRoutine, lang }) => {
  const t = TRANSLATIONS[lang];
  // Solo mostrar las archivadas en historial para evitar duplicados visuales
  const archivedRoutines = history.filter(r => r.status === 'archived_history').sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return (
    <div className="animate-fadeIn pb-20">
      <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2"><Icon name="list" className="w-5 h-5 text-teal-400"/> {t.history}</h2>
      {archivedRoutines.length > 0 ? (
        <div className="space-y-4">
           {archivedRoutines.map(r => (
             <Card key={r.id} className="p-5 flex items-center justify-between group hover:bg-slate-800 transition-colors cursor-pointer" onClick={()=>onViewRoutine(r)}>
                <div>
                   <div className="flex items-center gap-2 mb-2"><span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">{r.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</span><span className="flex items-center gap-1 text-[10px] text-teal-400 font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> {t.completed}</span></div>
                   <h4 className="text-base font-bold text-slate-200 group-hover:text-teal-300 transition-colors">{r.diaEnfoque}</h4>
                </div>
                <div className="p-3 rounded-full bg-slate-900 text-slate-500 border border-slate-700 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-500 transition-all"><Icon name="chevronRight" className="w-5 h-5" /></div>
             </Card>
           ))}
        </div>
      ) : (
        <div className="text-center py-16 opacity-50 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700"><Icon name="database" className="w-12 h-12 mx-auto mb-4 text-slate-600"/><p className="text-slate-500 font-medium">{t.noRecords}</p></div>
      )}
    </div>
  );
};

const UserProfileTab = ({ profile, onProfileChange, onProfileSave, onGenerateBackup, onImportFromFile, onShowImportModal, profileSuccess, profileError, lang, onAnalyzeBioage, bioageLoading }) => {
  const t = TRANSLATIONS[lang];
  return (
    <div className="animate-fadeIn pb-20 space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); onProfileSave(profile); }} className="space-y-8">
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2 pb-2 border-b border-slate-700/50"><Icon name="user" className="w-4 h-4 text-teal-400"/> {t.biometrics}</h3>
          <div className="grid grid-cols-2 gap-6">
            <InputField label={t.gender} icon="user" type="select" name="gender" value={profile.gender} onChange={onProfileChange} options={[{value:'Hombre',label:t.male},{value:'Mujer',label:t.female}]} />
            <InputField label={t.age} icon="calendar" type="number" name="age" value={profile.age} onChange={onProfileChange} />
            <InputField label={t.height} icon="ruler" type="number" name="height" value={profile.height} onChange={onProfileChange} />
            <InputField label={t.weight} icon="weight" type="number" name="weight" value={profile.weight} onChange={onProfileChange} />
          </div>
          {/* RESTAURADO: Inputs de composición corporal */}
          <div className="mt-6 pt-6 border-t border-slate-700/50 grid grid-cols-2 gap-6">
             <BioageInput name="bodyFat" value={profile.bodyFat} onChange={onProfileChange} unit="%" label={t.bodyFat} tooltip="Opcional: Grasa" isBio={false} />
             <BioageInput name="muscleMass" value={profile.muscleMass} onChange={onProfileChange} unit="%" label={t.muscleMass} tooltip="Opcional: Músculo" isBio={false} />
          </div>
        </Card>
        <CycleSyncSection profile={profile} onChange={onProfileChange} lang={lang} />
        <BioageProfileSection profile={profile} onChange={onProfileChange} lang={lang} onAnalyzeBioage={onAnalyzeBioage} bioageLoading={bioageLoading} />
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2 pb-2 border-b border-slate-700/50"><Icon name="target" className="w-4 h-4 text-violet-400"/> {t.customFocus}</h3>
          <div className="space-y-6">
             <InputField label={t.mainGoal} icon="star" type="select" name="mainGoal" value={profile.mainGoal} onChange={onProfileChange} options={[{value: 'Perder grasa corporal', label: t.goalFat},{value: 'Crecimiento muscular (Hipertrofia)', label: t.goalMuscle},{value: 'Incremento de fuerza', label: t.goalStrength},{value: 'Mejora de rendimiento cardiovascular', label: t.goalCardio}]} />
             <InputField label={t.expLevel} icon="activity" type="select" name="experienceLevel" value={profile.experienceLevel} onChange={onProfileChange} options={[{value: 'Principiante', label: t.expBeginner},{value: 'Intermedio', label: t.expInter},{value: 'Avanzado', label: t.expAdvanced}]} />
             <div className="grid grid-cols-2 gap-6"><InputField label={t.daysWeek} icon="calendar" type="number" name="daysPerWeek" value={profile.daysPerWeek} onChange={onProfileChange} /><InputField label={t.timeAvailable} icon="clock" type="number" name="timeAvailable" value={profile.timeAvailable} onChange={onProfileChange} /></div>
             <InputField label={t.injuries} icon="alert" type="text" name="injuries" value={profile.injuries} onChange={onProfileChange} placeholder={t.phInjuries} isTextArea={true} />
          </div>
        </Card>
        <div className="flex items-center gap-4"><button type="submit" className="flex-1 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-900/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2"><Icon name="save" className="w-5 h-5" /> {t.saveFile}</button></div>
        {profileSuccess && <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-medium text-center shadow-sm">{profileSuccess}</div>}
        {profileError && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium text-center shadow-sm">{profileError}</div>}
      </form>
    </div>
  );
};

// --- TRAINING TAB PRINCIPAL ACTUALIZADO ---
function TrainingTab({ profile, onProfileChange, onGeneratePlan, onAdjustNextSession, loading, successMessage, errorMessage, history, onViewRoutine, generationProgress, lang, onAnalyzeBioage, bioageLoading }) {
  const t = TRANSLATIONS[lang];
  const [progressText, setProgressText] = useState(t.generating);
  const [activeTab, setActiveTab] = useState('recommended'); 
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustingRoutine, setAdjustingRoutine] = useState(null); // Estado para saber qué rutina se está ajustando

  const currentPlanId = profile.currentPlanId;
  const todayIndex = (new Date().getDay() + 6) % 7;
  
  const currentWeekRoutines = history
      .filter(r => r.planId === currentPlanId && r.status !== 'archived_history') // Filtramos historial para evitar duplicados antiguos
      .sort((a, b) => a.weekDay - b.weekDay);
      
  const completionLog = new Map();
  history.forEach(r => { 
      if (r.planId === currentPlanId && r.status === 'completed' && r.completedOnDay !== undefined) {
          completionLog.set(r.completedOnDay, r); 
      }
  });

  // Lógica Recomendada: Primera rutina PENDIENTE
  const recommendedRoutine = currentWeekRoutines.find(r => r.status === 'pending');
  
  // Lógica Biblioteca: Todo lo que NO sea la recomendada (incluye completadas, para verlas)
  const libraryRoutines = currentWeekRoutines.filter(r => r.id !== recommendedRoutine?.id);
  
  const weekDistribution = distributeWeek(currentWeekRoutines, parseInt(profile.daysPerWeek, 10) || 3);
  useEffect(() => { if (generationProgress < 30) setProgressText(t.analyzing); else if (generationProgress < 60) setProgressText(t.designing); else if (generationProgress < 90) setProgressText(t.optimizing); else setProgressText(t.finalizing); }, [generationProgress, lang]);

  // Handler para abrir modal de ajuste con una rutina específica
  const handleOpenAdjustment = (routine) => {
      setAdjustingRoutine(routine);
      setShowAdjustment(true);
  };

  return (
    <div className="animate-fadeIn pb-24">
      <div className="space-y-2 mb-4">
        {successMessage && <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-xl flex items-center shadow-lg backdrop-blur-md"><Icon name="check" className="mr-3 w-5 h-5" /> {successMessage}</div>}
        {errorMessage && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-center shadow-lg backdrop-blur-md"><Icon name="alert" className="mr-3 w-5 h-5" /> {errorMessage}</div>}
      </div>
      
      <WeeklyProgressBar weekDistribution={weekDistribution} completionLog={completionLog} todayIndex={todayIndex} />
      
      <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-1 px-2">
         <div className="flex gap-6">
             <button onClick={() => setActiveTab('recommended')} className={`pb-2 text-xs font-bold transition-all relative uppercase tracking-wider ${activeTab === 'recommended' ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}>Recomendado{activeTab === 'recommended' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>}</button>
             <button onClick={() => setActiveTab('library')} className={`pb-2 text-xs font-bold transition-all relative uppercase tracking-wider ${activeTab === 'library' ? 'text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>Más Opciones{activeTab === 'library' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-200 rounded-t-full"></div>}</button>
         </div>
         {/* BOTÓN REGENERAR COLOCADO AQUÍ */}
         <button onClick={() => onGeneratePlan(profile)} className="pb-2 text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition-colors"><Icon name="refresh" className="w-3 h-3" /> {t.regenerateCycle}</button>
      </div>
      
      <div className="min-h-[250px]">
         {loading ? ( <div className="flex flex-col items-center justify-center py-10"><GeminiLoader progressText={progressText} /></div> ) : (
             <>
               {activeTab === 'recommended' && (
                  <>
                    {recommendedRoutine ? (
                        <div className="animate-fadeIn">
                             <HeroRoutineCard 
                                routine={recommendedRoutine} 
                                onView={onViewRoutine} 
                                onAdjust={() => handleOpenAdjustment(recommendedRoutine)} 
                             />
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20"><div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20"><Icon name="check" className="w-8 h-8 text-emerald-500" /></div><h3 className="text-lg font-bold text-white mb-1">¡Semana Completada!</h3><p className="text-slate-500 text-xs mb-5 max-w-[200px] mx-auto">No hay rutinas pendientes. ¡Gran trabajo!</p></div>
                    )}
                  </>
               )}
               {activeTab === 'library' && ( <div className="animate-fadeIn"><RoutineLibraryList routines={libraryRoutines} onView={onViewRoutine} onAdjust={handleOpenAdjustment} />{libraryRoutines.length === 0 && recommendedRoutine && (<div className="text-center py-10 opacity-50"><p className="text-xs text-slate-500">Solo queda la rutina recomendada.</p></div>)}</div> )}
             </>
         )}
         
         {/* MODAL GLOBAL DE AJUSTE (Se usa tanto para recomendado como para librería) */}
         {showAdjustment && adjustingRoutine && (
             <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fadeIn">
                 <div className="w-full max-w-md relative">
                     <button onClick={()=>setShowAdjustment(false)} className="absolute -top-10 right-0 text-slate-400 hover:text-white"><Icon name="close" className="w-8 h-8"/></button>
                     <AdjustSessionView nextRoutine={adjustingRoutine} profile={profile} onProfileChange={onProfileChange} onAdjustNextSession={(r, p, ne) => { onAdjustNextSession(r, p, ne); setShowAdjustment(false); }} loading={loading} progressText={progressText} lang={lang} />
                 </div>
             </div>
         )}

         {currentWeekRoutines.length === 0 && !loading && ( <div className="p-6 text-center border border-dashed border-slate-700 rounded-2xl mt-4"><Icon name="sparkles" className="w-8 h-8 text-teal-500 mx-auto mb-3" /><p className="text-slate-400 text-xs mb-4">{t.noPlan}</p><button onClick={() => onGeneratePlan(profile)} className="w-full py-3 rounded-lg bg-teal-600 text-white font-bold text-xs shadow-lg shadow-teal-900/20 hover:bg-teal-500">{t.startRoutine}</button></div> )}
      </div>
    </div>
  );
}

// --- MODALES EXTRA ---
const BackupModal = ({ jsonString, onClose, onCopy, copySuccess, lang }) => { const t = TRANSLATIONS[lang]; return <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn"><Card className="w-full max-w-lg p-6 border-slate-600 bg-slate-900"><div className="flex justify-between items-center mb-4"><h3 className="text-slate-100 font-bold text-lg">{t.copyBackup}</h3><button onClick={onClose}><Icon name="close" className="text-slate-400 hover:text-white"/></button></div><textarea readOnly value={jsonString} className="w-full h-48 bg-slate-950 text-slate-400 text-xs p-4 rounded-xl border border-slate-700 mb-5 minimal-scrollbar font-mono focus:outline-none focus:border-teal-500"/><div className="flex justify-end gap-3"><button onClick={onCopy} className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-lg ${copySuccess?'bg-emerald-600 text-white':'bg-teal-600 text-white hover:bg-teal-500'}`}>{copySuccess ? <><Icon name="check" className="inline w-4 h-4 mr-1"/> {t.copied}</> : <><Icon name="copy" className="inline w-4 h-4 mr-1"/> {t.copyToClip}</>}</button></div></Card></div>; };
const ImportTextModal = ({ onClose, onImport, importError, lang }) => { const t = TRANSLATIONS[lang]; const [txt, setTxt] = useState(""); return <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn"><Card className="w-full max-w-lg p-6 border-slate-600 bg-slate-900"><div className="flex justify-between items-center mb-4"><h3 className="text-slate-100 font-bold text-lg">{t.importData}</h3><button onClick={onClose}><Icon name="close" className="text-slate-400 hover:text-white"/></button></div><textarea value={txt} onChange={e=>setTxt(e.target.value)} className="w-full h-48 bg-slate-950 text-slate-200 text-xs p-4 rounded-xl border border-slate-700 mb-5 minimal-scrollbar font-mono focus:ring-2 focus:ring-teal-500 outline-none" placeholder='Pegar contenido JSON aquí...'/><div className="flex justify-end gap-3"><button onClick={()=>onImport(txt)} className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-bold text-sm hover:bg-teal-500 shadow-lg">{t.importBtn}</button></div>{importError && <p className="text-red-400 text-xs mt-3 bg-red-900/20 p-2 rounded border border-red-900/50">{importError}</p>}</Card></div>; };

// --- APP PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('main'); 
  const [language, setLanguage] = useState('es'); 
  const [currentRoutine, setCurrentRoutine] = useState(null);
  const [selectedHistoryRoutineId, setSelectedHistoryRoutineId] = useState(null);
  const [routineHistory, setRoutineHistory] = useState([]);
  const [profile, setProfile] = useState({ gender: 'Hombre', age: 0, height: 0, weight: 0, bodyFat: 0, muscleMass: 0, daysPerWeek: 3, mainGoal: 'Perder grasa corporal', experienceLevel: 'Intermedio', injuries: '', muscleFocus: 'recomendado', timeAvailable: 45, currentPlanId: null, bioage: { sq1rm: '', bp1rm: '', plank: '', pullups: '', pushups: '', waist: '', vo2max: '', rhr: '', hrr: '' }, bioageEstimation: null, menstrualCycle: { lastPeriod: '', cycleLength: 28 } });
  const [loading, setLoading] = useState(false);
  const [bioageLoading, setBioageLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [backupJson, setBackupJson] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTextError, setImportTextError] = useState(null);
  const [activeTab, setActiveTab] = useState('training');
  const t = TRANSLATIONS[language];
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const headerRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = (e) => setScrolled(e.currentTarget.scrollTop > 10);
  const profileDocRef = (userId && db) ? doc(db, 'artifacts', appId, 'users', userId, 'profile', 'userProfile') : null;
  const routinesColRef = (userId && db) ? collection(db, 'artifacts', appId, 'users', userId, 'routines') : null;
  const toggleLanguage = () => setLanguage(prev => prev === 'es' ? 'en' : 'es');

  useEffect(() => { const timer = setTimeout(() => setShowSplash(false), 2000); return () => clearTimeout(timer); }, []);
  useEffect(() => { let isMounted = true; if (!auth) return; const unsubscribeAuth = onAuthStateChanged(auth, async (user) => { if (!isMounted) return; if (user) setUserId(user.uid); else { try { const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; if (token) await signInWithCustomToken(auth, token); else await signInAnonymously(auth); } catch (e) { console.error(e); if(isMounted) setError(typeof e.message === 'string' ? e.message : t.errorAuth); } } if(isMounted) setIsAuthReady(true); }); return () => { isMounted = false; unsubscribeAuth(); }; }, []);
  useEffect(() => { let isMounted = true; if (!isAuthReady || !userId || !profileDocRef || !routinesColRef || !db) return; const getProfile = async () => { try { const docSnap = await getDoc(profileDocRef); if (!isMounted) return; if (docSnap.exists()) { const data = docSnap.data(); setProfile(prev => ({ ...prev, ...data, bioage: data.bioage || { sq1rm: '', bp1rm: '', plank: '', pullups: '', pushups: '', waist: '', vo2max: '', rhr: '', hrr: '' }, bioageEstimation: data.bioageEstimation || null, menstrualCycle: data.menstrualCycle || { lastPeriod: '', cycleLength: 28 } })); } else await setDoc(profileDocRef, profile); } catch (e) { console.error(e); } }; getProfile(); const unsubscribeHistory = onSnapshot(routinesColRef, (snapshot) => { if (!isMounted) return; const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setRoutineHistory(historyData); }, (err) => { console.error(err); }); return () => { isMounted = false; unsubscribeHistory(); }; }, [isAuthReady, userId]);
  useEffect(() => { let interval; if (isSessionActive) { interval = setInterval(() => { setSessionSeconds(prev => prev + 1); }, 1000); } return () => clearInterval(interval); }, [isSessionActive]);
  useEffect(() => { let interval; if (restSeconds > 0) { interval = setInterval(() => { setRestSeconds(prev => prev - 1); }, 1000); } return () => clearInterval(interval); }, [restSeconds]);
  useEffect(() => { if (successMessage || profileSuccess || error || profileError) { const timer = setTimeout(() => { setSuccessMessage(null); setProfileSuccess(null); setError(null); setProfileError(null); }, 3000); return () => clearTimeout(timer); } }, [successMessage, profileSuccess, error, profileError]);

  const handleProfileChange = (e) => { const { name, value, type } = e.target; if (name === 'bioage') { setProfile(prev => ({ ...prev, bioage: value })); return; } if (name === 'menstrualCycle') { setProfile(prev => ({ ...prev, menstrualCycle: value })); return; } let processedValue = value; if (name === 'daysPerWeek' && value !== '') processedValue = Math.max(1, Math.min(7, parseInt(value, 10))); else if (type === 'number') processedValue = (value === '' ? '' : parseFloat(value)); setProfile(prev => ({ ...prev, [name]: processedValue })); };
  const handleProfileSave = useCallback(async (updatedProfile) => { if (!profileDocRef) return; try { await setDoc(profileDocRef, updatedProfile, { merge: true }); setProfileSuccess(t.msgProfileSaved); } catch (e) { setProfileError(t.errorSave); } }, [profileDocRef, language]);
  const handleAnalyzeBioage = async (currentProfile) => { setBioageLoading(true); setError(null); try { const result = await fetchGeminiBioageAnalysis(currentProfile, language); const updatedProfile = { ...currentProfile, bioageEstimation: result }; setProfile(updatedProfile); if (profileDocRef) await setDoc(profileDocRef, { bioageEstimation: result }, { merge: true }); } catch (err) { console.error(err); setProfileError("Error al calcular BioAge."); } finally { setBioageLoading(false); } };
  const handleGenerateWeeklyPlan = useCallback(async (profileData) => { setLoading(true); setError(null); setSuccessMessage(null); setGenerationProgress(0); if (!routinesColRef || !db) { setError("DB no lista"); setLoading(false); return; } try { const completedHistory = routineHistory.filter(r => r.status === 'completed').sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).slice(0, 10); const newPlanRoutines = await fetchGeminiWeeklyPlan(profileData, buildHistoryContext(completedHistory), language); setGenerationProgress(100); const newPlanId = `plan_${Date.now()}`; const batch = writeBatch(db); const pendingQuery = query(routinesColRef, where("status", "==", "pending")); const pendingSnapshot = await getDocs(pendingQuery); pendingSnapshot.forEach(doc => batch.delete(doc.ref)); newPlanRoutines.forEach((routine, index) => { const newRoutineRef = doc(routinesColRef); batch.set(newRoutineRef, { routine: routine, diaEnfoque: routine.diaEnfoque || `Día ${index + 1}`, createdAt: serverTimestamp(), status: 'pending', weekDay: index + 1, planId: newPlanId }); }); if(profileDocRef) batch.update(profileDocRef, { currentPlanId: newPlanId }); setProfile(prev => ({ ...prev, currentPlanId: newPlanId })); await batch.commit(); setSuccessMessage(t.msgPlanGen); } catch (e) { console.error(e); setError(e.message); } finally { setTimeout(() => { setLoading(false); setGenerationProgress(0); }, 500); } }, [routinesColRef, db, routineHistory, profileDocRef, language]);
  const handleAdjustNextSession = useCallback(async (routineToAdjust, currentProfile, noEquipment) => { setLoading(true); setError(null); if (!db) return; try { const completedHistory = routineHistory.filter(r => r.status === 'completed').slice(0, 5); const newRoutineData = await fetchGeminiSessionAdjustment(currentProfile, routineToAdjust.diaEnfoque, currentProfile.muscleFocus, currentProfile.timeAvailable, buildHistoryContext(completedHistory), noEquipment, language); const routineRef = doc(db, 'artifacts', appId, 'users', userId, 'routines', routineToAdjust.id); await setDoc(routineRef, { routine: newRoutineData, diaEnfoque: newRoutineData.diaEnfoque, descripcionBreve: newRoutineData.descripcionBreve }, { merge: true }); setSuccessMessage(t.msgSessionUpd); } catch (e) { console.error(e); setError(e.message); } finally { setTimeout(() => { setLoading(false); }, 500); } }, [db, appId, userId, routineHistory, language]);
  const handleViewHistoryRoutine = (item) => { setCurrentRoutine(item.routine); setSelectedHistoryRoutineId(item.id); setSuccessMessage(null); setError(null); setView('routine'); setSessionSeconds(0); setIsSessionActive(true); setRestSeconds(0); };
  const triggerRest = (exerciseContext) => { const smartTime = calculateSmartRest(profile, exerciseContext); setRestSeconds(smartTime); };
  const handleRoutineFeedback = useCallback(async (routineId, feedbackData, notes, exerciseView) => { setIsSessionActive(false); if (!userId || routineId === 'bonus_01') { setSuccessMessage(t.msgBonusReg); setTimeout(() => { setView('main'); setActiveTab('training'); }, 1000); return; } if (!db) return; const routineDocRef = doc(db, 'artifacts', appId, 'users', userId, 'routines', routineId); const historyColRef = collection(db, 'artifacts', appId, 'users', userId, 'routines'); const historyDocRef = doc(historyColRef); try { const docSnap = await getDoc(routineDocRef); const currentData = docSnap.exists() ? docSnap.data() : {}; const completionData = { feedback: feedbackData, notes: notes, exerciseView: exerciseView, status: 'completed', completedOnDay: (new Date().getDay() + 6) % 7, completedAt: serverTimestamp() }; const batch = writeBatch(db); batch.update(routineDocRef, completionData); batch.set(routineDocRef, completionData, {merge:true}); batch.set(historyDocRef, { ...currentData, ...completionData, status: 'archived_history', originalRoutineId: routineId }); await batch.commit(); setSuccessMessage(t.msgSessionReg); setTimeout(() => { setView('main'); setActiveTab('training'); }, 1000); } catch (e) { console.error(e); setError(t.errorSave); } }, [userId, appId, db, language]);
  const handleGenerateBackup = () => { setProfileSuccess(null); setProfileError(null); try { if (!profile || !routineHistory) return; const cleanHistory = routineHistory.map(({ id, ...rest }) => rest); setBackupJson(JSON.stringify({ profile, routineHistory: cleanHistory }, null, 2)); } catch (e) { setProfileError(e.message); } };
  const handleCloseBackupModal = () => { setBackupJson(null); setCopySuccess(false); };
  const handleCopyToClipboard = () => { if (!backupJson) return; navigator.clipboard.writeText(backupJson).then(() => setCopySuccess(true)); };
  const handleImportFromFile = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { try { await processImportLogic(ev.target.result); setProfileSuccess(t.msgImported); } catch (err) { setProfileError(err.message); } e.target.value = null; }; reader.readAsText(file); };
  const handleShowImportModal = () => { setImportTextError(null); setIsImportModalOpen(true); };
  const handleImportFromText = async (json) => { setImportTextError(null); setProfileSuccess(null); setProfileError(null); try { await processImportLogic(json); setIsImportModalOpen(false); setProfileSuccess(t.msgImported); } catch (err) { setImportTextError(err.message); } };
  const processImportLogic = async (json) => { if(!db || !profileDocRef) return; const data = JSON.parse(json); if (!data.profile || !data.routineHistory) throw new Error("JSON inválido"); const newProfile = { ...profile, ...data.profile }; await setDoc(profileDocRef, newProfile, { merge: true }); setProfile(newProfile); const batch = writeBatch(db); data.routineHistory.forEach(item => { let converted = { ...item }; if (item.createdAt?.seconds) converted.createdAt = new Timestamp(item.createdAt.seconds, item.createdAt.nanoseconds||0); else converted.createdAt = serverTimestamp(); batch.set(doc(routinesColRef), converted); }); await batch.commit(); };
  const handleBackToMain = () => { const prevHist = activeTab === 'history'; setView('main'); setCurrentRoutine(null); setSelectedHistoryRoutineId(null); if(!prevHist) setSuccessMessage(null); setActiveTab(prevHist ? 'history' : 'training'); setIsSessionActive(false); setSessionSeconds(0); setRestSeconds(0); };

  if (!db && !error) return <div className="h-screen flex items-center justify-center bg-slate-900 text-slate-400 animate-pulse">Iniciando base de datos...</div>;

  return (
    <>
      <MinimalScrollbarStyles />
      <SplashScreen show={showSplash} />
      <div className="h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col overflow-hidden font-sans bg-slate-900 text-slate-100 selection:bg-teal-500/30">
        {backupJson && <BackupModal jsonString={backupJson} onClose={handleCloseBackupModal} onCopy={handleCopyToClipboard} copySuccess={copySuccess} lang={language} />}
        {isImportModalOpen && <ImportTextModal onClose={() => setIsImportModalOpen(false)} onImport={handleImportFromText} importError={importTextError} lang={language} />}
        <header ref={headerRef} className={`w-full z-40 fixed top-0 left-0 border-b transition-all duration-300 ${scrolled ? 'bg-slate-900/90 backdrop-blur-xl border-slate-700/50 py-2 shadow-md' : 'bg-transparent border-transparent py-3'}`}>
          <div className="max-w-md mx-auto px-6 flex items-center justify-between">
            <h1 className={`font-bold text-slate-100 flex items-center transition-all ${scrolled ? 'text-sm' : 'text-base'}`}>{view === 'routine' ? (<button onClick={handleBackToMain} className="mr-3 text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800"><Icon name="arrowLeft" className="w-6 h-6" /></button>) : <div className="bg-teal-500/10 p-1.5 rounded-lg mr-2"><Icon name="dumbbell" className="text-teal-400 w-4 h-4" /></div>}<span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{view === 'routine' ? t.routineInProgress : t.appTitle}</span></h1>
            <div className="flex items-center gap-2 text-xs">{view === 'routine' ? (<div className="w-8"></div>) : (<div className="flex items-center gap-2 scale-90 origin-right"><button onClick={toggleLanguage} className="flex items-center px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all font-bold font-mono tracking-tighter"><span className={language === 'es' ? 'text-teal-400' : ''}>ES</span><span className="mx-1 opacity-30">|</span><span className={language === 'en' ? 'text-teal-400' : ''}>EN</span></button>{userId ? <span className="flex items-center px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 font-semibold shadow-inner"><Icon name="activity" className="w-3.5 h-3.5 mr-2" />{t.online}</span> : <Icon name="loader" className="w-4 h-4 animate-spin text-slate-500"/>}</div>)}</div>
          </div>
        </header>
        {/* MODIFICADO: className para habilitar snap-scroll solo en vista rutina */}
        <main 
          className={`flex-1 overflow-y-auto overflow-x-hidden minimal-scrollbar pt-16 ${view === 'routine' ? 'snap-y snap-proximity' : ''}`} 
          onScroll={handleScroll}
        >
          <div className="max-w-md mx-auto px-4 md:px-0 pb-32">
            {view === 'main' && (
              <>
                {activeTab === 'training' && (<TrainingTab profile={profile} onProfileChange={handleProfileChange} onGeneratePlan={handleGenerateWeeklyPlan} onAdjustNextSession={handleAdjustNextSession} loading={loading} successMessage={successMessage} errorMessage={error} history={routineHistory} onViewRoutine={handleViewHistoryRoutine} generationProgress={generationProgress} lang={language} onAnalyzeBioage={handleAnalyzeBioage} bioageLoading={bioageLoading} />)}
                {activeTab === 'history' && <LogradosTabContent history={routineHistory} profile={profile} onViewRoutine={handleViewHistoryRoutine} lang={language} />}
                {activeTab === 'profile' && (<UserProfileTab profile={profile} onProfileChange={handleProfileChange} onProfileSave={handleProfileSave} onGenerateBackup={handleGenerateBackup} onImportFromFile={handleImportFromFile} onShowImportModal={handleShowImportModal} profileSuccess={profileSuccess} profileError={profileError} lang={language} onAnalyzeBioage={handleAnalyzeBioage} bioageLoading={bioageLoading} />)}
              </>
            )}
            {view === 'routine' && (<RoutineDisplay routine={currentRoutine} onBack={handleBackToMain} routineId={selectedHistoryRoutineId} onRoutineFeedback={handleRoutineFeedback} successMessage={successMessage} lang={language} onExerciseComplete={triggerRest} />)}
          </div>
        </main>
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
             {view === 'main' ? (
                 <nav className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-full px-6 py-3 flex gap-8 pointer-events-auto">
                  {['training', 'history', 'profile'].map(tab => {
                    const isActive = activeTab === tab;
                    const icons = { training: 'target', history: 'list', profile: 'user' };
                    return (<button key={tab} onClick={() => setActiveTab(tab)} className={`relative p-3 rounded-full transition-all duration-300 group ${isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 -translate-y-2 scale-110' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}><Icon name={icons[tab]} className="w-6 h-6" /></button>);
                  })}
                 </nav>
             ) : (
                 <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-full px-6 py-3 flex gap-6 items-center pointer-events-auto animate-fadeIn">
                     <div className={`flex items-center gap-2 font-mono font-bold text-xl ${restSeconds > 0 ? 'text-orange-400' : 'text-slate-500 opacity-60'}`}><Icon name="coffee" className={`w-4 h-4 ${restSeconds > 0 ? 'animate-pulse' : ''}`} /><span>{restSeconds > 0 ? formatDuration(restSeconds) : '--:--'}</span></div>
                     <div className="w-px h-6 bg-slate-600/50"></div>
                     <div className="flex items-center gap-2 font-mono font-bold text-xl text-teal-400"><Icon name="timer" className="w-4 h-4" /><span>{formatDuration(sessionSeconds)}</span></div>
                 </div>
             )}
        </div>
      </div>
    </>
  );
}