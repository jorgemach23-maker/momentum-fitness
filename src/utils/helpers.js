export const TRANSLATIONS = {
  es: {
    lang: 'es',
    online: "Online",
    guest: "Invitado", 
    appTitle: "Momentum AI", 
    routineInProgress: "Rutina en Curso", 
    errorAuth: "Error de autenticación",
    errorSave: "Error al guardar",
    errorHistorySave: "Error al guardar el historial. La sesión no se ha registrado.",
    errorInvalidCreds: "Credenciales inválidas.",
    errorEmailInUse: "El email ya está en uso.",

    // Tabs
    tabTraining: "Entrenamiento", 
    tabHistory: "Historial", 
    tabProfile: "Perfil",
    
    // Auth
    signIn: "Iniciar Sesión",
    signUp: "Registrarse",
    signOut: "Cerrar Sesión",
    signInGuest: "Entrar como Invitado",
    emailPlaceholder: "correo@ejemplo.com",
    passwordPlaceholder: "Contraseña",
    passRequirementLength: "Mínimo 6 caracteres",
    passRequirementUpper: "Contiene una mayúscula",
    passRequirementNumber: "Contiene un número",
    forgotPassword: "¿Olvidaste tu contraseña?",
    resetPassword: "Restablecer Contraseña",
    resetPasswordPrompt: "Introduce tu email para recibir un enlace de recuperación.",
    resetEmailSentTitle: "Correo Enviado",
    resetEmailSentMessage: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
    backToLogin: "Volver a Iniciar Sesión",
    saveAccountPrompt: "Guarda tu Progreso",
    saveAccountMessage: "Crea una cuenta para guardar tus datos y acceder desde cualquier dispositivo.",
    saveAccountButton: "Guardar Cuenta",
    signOutGuestTitle: "¡Atención!",
    signOutGuestMessage: "Estás usando una cuenta de invitado. Si cierras sesión, perderás todo tu progreso. ¿Deseas guardar tu cuenta antes de salir?",
    signOutAndLoseData: "Salir y Perder Datos",
    accountLinkedTitle: "¡Cuenta Guardada!",
    accountLinkedMessage: "Tu progreso ha sido vinculado a tu correo. Ahora tu cuenta es permanente.",

    // Profile Sections
    bioageTitle: "Perfil Avanzado (Bioage)", 
    bioageSubtitle: "Biometría Clínica & Estructural", 
    bioageDesc: "Datos opcionales para aumentar precisión de generación de rutina.", 
    structuralIntegrity: "Integridad Estructural", 
    metabolicHealth: "Salud Metabólica", 
    clinicalAnalysis: "Análisis Bioage", 
    detectedRisks: "Reglas de Ajuste Activadas", 
    healthyStatus: "Perfil equilibrado. Sin contraindicaciones estructurales detectadas.", 
    calcBioAge: "Calcular Edad Biológica", 
    bioAgeResult: "Edad Biológica Estimada", 
    realAge: "Cronológica", 
    bioAgeAnalysis: "Análisis de Longevidad",
    cycleTitle: "Salud Femenina (CycleSync)", 
    cycleSubtitle: "Adaptación al Ciclo Menstrual", 
    lastPeriod: "Fecha Última Menstruación", 
    cycleLength: "Duración Ciclo (días)", 
    phase: "Fase Actual", 
    menstrual: "Menstrual", 
    follicular: "Folicular", 
    ovulation: "Ovulación", 
    luteal: "Lútea", 
    phaseDesc: "Impacto en el Entrenamiento",
    
    // Tooltips
    tt_sq1rm: "Máximo peso para 1 repetición en Sentadilla.", 
    tt_bp1rm: "Máximo peso para 1 repetición en Banca.", 
    tt_pullups: "Máximas repeticiones estrictas.", 
    tt_pushups: "Máximas flexiones estrictas.", 
    tt_plank: "Tiempo máximo manteniendo postura perfecta.", 
    tt_waist: "Circunferencia a nivel del ombligo.", 
    tt_vo2: "Volumen máximo de oxígeno.", 
    tt_rhr: "Pulsaciones nada más despertar.", 
    tt_hrr: "Pulsaciones que bajan 1 min después de esfuerzo máximo.",
    
    // Loading states
    generating: "Generando...", 
    analyzing: "Analizando Biometría...", 
    designing: "Diseñando Terapia...", 
    optimizing: "Optimizando Cargas...", 
    finalizing: "Finalizando Plan...",
    processing: "Procesando...",
    
    // Training Tab
    weeklyProgress: "Progreso Semanal", 
    generalView: "Vista General", 
    weeklyPlan: "Plan Semanal", 
    startRoutine: "COMENZAR", 
    goalMet: "Objetivo Cumplido", 
    progressReg: "Progreso registrado.",
    activeRecovery: "Recuperación Activa", 
    restVital: "El descanso es vital.", 
    regenerateCycle: "Regenerar Ciclo", 
    noPlan: "Sin plan semanal",
    adjustSession: "Ajuste de Sesión", 
    modify: "Modificar:", 
    focusZone: "Zona de Enfoque", 
    timeAvailable: "Tiempo Disponible (min)", 
    modality: "Modalidad", 
    noEquipment: "Entrenamiento sin equipo", 
    recalcParams: "Recalcular Parámetros",
    
    // Active Session
    activeSession: "Sesión Activa", 
    recovery: "Recuperación", 
    notes: "Notas", 
    finishSession: "Finalizar Sesión", 
    easy: "Fácil", 
    good: "Adecuado", 
    hard: "Difícil", 
    hide: "OCULTAR", 
    viewTech: "Ver Técnica", 
    series: "Serie", 
    reps: "Reps", 
    load: "Carga", 
    superset: "Superserie",
    completed: "Completado", 
    noRecords: "No hay registros previos.",
    
    // Profile Tab
    biometrics: "Datos Básicos", 
    gender: "Género", 
    age: "Edad", 
    height: "Altura (cm)", 
    weight: "Peso (kg)", 
    bodyFat: "% Grasa (Opcional)", 
    muscleMass: "% Músculo (Opcional)", 
    customFocus: "Enfoque personalizado", 
    mainGoal: "Objetivo Principal", 
    expLevel: "Nivel Experiencia", 
    daysWeek: "Días/Semana", 
    injuries: "Lesiones / Limitaciones", 
    saveFile: "Guardar Expediente", 
    dataManagement: "Gestión de Datos", 
    export: "Exportar", 
    pasteJson: "Pegar JSON", 
    uploadFile: "Cargar Archivo",
    phNotes: "Reporte de dolor, sensaciones o ajustes necesarios...", 
    phInjuries: "Ej. Menisco rodilla derecha...", 
    male: "Hombre", 
    female: "Mujer",
    goalFat: "Perder Grasa / Metabolismo", 
    goalMuscle: "Hipertrofia / Fuerza", 
    goalStrength: "Fuerza Máxima", 
    goalCardio: "Resistencia Cardio",
    expBeginner: "Principiante (0-6 meses)", 
    expInter: "Intermedio (6m - 2y)", 
    expAdvanced: "Avanzado (+2y)",
    
    // Messages
    msgPlanGen: "¡Nuevo plan terapéutico generado!", 
    msgSessionUpd: "Sesión clínica actualizada.", 
    msgSessionReg: "Sesión completada y registrada.", 
    msgBonusReg: "¡Entreno Bonus registrado!", 
    msgProfileSaved: "Expediente guardado correctamente.", 
    msgImported: "Datos importados.",
    
    // Data Management
    importData: "Importar Datos", 
    exportData: "Exportar Datos",
    copyBackup: "Copia de Seguridad", 
    copied: "Copiado", 
    copyToClip: "Copiar al Portapapeles", 
    importBtn: "Importar",
    
    // General UI
    cancel: "Cancelar", 
    smashSet: "TERMINAR SERIE", 
    nextEx: "SIGUIENTE", 
    prevEx: "ANTERIOR", 
    finishWorkout: "TERMINAR", 
    letsGo: "¡A DARLE!", 
    restTimer: "DESCANSO",
    rateEffort: "¿Cómo sentiste el esfuerzo?", 
    rateA1: "Esfuerzo Ejercicio 1", 
    rateA2: "Esfuerzo Ejercicio 2",
    warmupTitle: "Calentamiento", 
    warmupDesc: "Prepara tu cuerpo", 
    startMain: "EMPEZAR RUTINA",
    cooldownTitle: "Enfriamiento", 
    cooldownDesc: "Vuelta a la calma", 
    finishComplete: "FINALIZAR SESIÓN",
    paused: "PAUSA"
  },
  en: {
    lang: 'en',
    online: "Online",
    guest: "Guest",
    appTitle: "Momentum AI",
    routineInProgress: "Routine in Progress",
    errorAuth: "Authentication error",
    errorSave: "Error saving data",
    errorHistorySave: "Error saving history. The session was not recorded.",
    errorInvalidCreds: "Invalid credentials.",
    errorEmailInUse: "Email is already in use.",

    // Tabs
    tabTraining: "Training",
    tabHistory: "History",
    tabProfile: "Profile",
    
    // Auth
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    signInGuest: "Sign In as Guest",
    emailPlaceholder: "email@example.com",
    passwordPlaceholder: "Password",
    passRequirementLength: "At least 6 characters",
    passRequirementUpper: "Contains an uppercase letter",
    passRequirementNumber: "Contains a number",
    forgotPassword: "Forgot your password?",
    resetPassword: "Reset Password",
    resetPasswordPrompt: "Enter your email to receive a recovery link.",
    resetEmailSentTitle: "Email Sent",
    resetEmailSentMessage: "Check your inbox to reset your password.",
    backToLogin: "Back to Sign In",
    saveAccountPrompt: "Save Your Progress",
    saveAccountMessage: "Create an account to save your data and access it from any device.",
    saveAccountButton: "Save Account",
    signOutGuestTitle: "Warning!",
    signOutGuestMessage: "You are using a guest account. If you sign out, you will lose all your progress. Would you like to save your account before exiting?",
    signOutAndLoseData: "Sign Out & Lose Data",
    accountLinkedTitle: "Account Saved!",
    accountLinkedMessage: "Your progress has been linked to your email. Your account is now permanent.",

    // Profile Sections
    bioageTitle: "Advanced Profile (Bioage)",
    bioageSubtitle: "Clinical & Structural Biometrics",
    bioageDesc: "Optional data to increase routine generation accuracy.",
    structuralIntegrity: "Structural Integrity",
    metabolicHealth: "Metabolic Health",
    clinicalAnalysis: "Bioage Analysis",
    detectedRisks: "Adjustment Rules Activated",
    healthyStatus: "Balanced profile. No structural contraindications detected.",
    calcBioAge: "Calculate Biological Age",
    bioAgeResult: "Estimated Biological Age",
    realAge: "Chronological",
    bioAgeAnalysis: "Longevity Analysis",
    cycleTitle: "Female Health (CycleSync)",
    cycleSubtitle: "Adaptation to Menstrual Cycle",
    lastPeriod: "Last Period Date",
    cycleLength: "Cycle Length (days)",
    phase: "Current Phase",
    menstrual: "Menstrual",
    follicular: "Follicular",
    ovulation: "Ovulation",
    luteal: "Luteal",
    phaseDesc: "Impact on Training",
    
    // Tooltips
    tt_sq1rm: "Maximum weight for 1 repetition in Squat.",
    tt_bp1rm: "Maximum weight for 1 repetition in Bench Press.",
    tt_pullups: "Maximum strict pull-ups.",
    tt_pushups: "Maximum strict push-ups.",
    tt_plank: "Maximum time holding a perfect plank.",
    tt_waist: "Circumference at navel level.",
    tt_vo2: "Maximum volume of oxygen.",
    tt_rhr: "Heart rate upon waking.",
    tt_hrr: "Heart rate drop 1 min after maximum effort.",
    
    // Loading states
    generating: "Generating...",
    analyzing: "Analyzing Biometrics...",
    designing: "Designing Therapy...",
    optimizing: "Optimizing Loads...",
    finalizing: "Finalizing Plan...",
    processing: "Processing...",

    // Training Tab
    weeklyProgress: "Weekly Progress",
    generalView: "General View",
    weeklyPlan: "Weekly Plan",
    startRoutine: "START",
    goalMet: "Goal Achieved",
    progressReg: "Progress registered.",
    activeRecovery: "Active Recovery",
    restVital: "Rest is vital.",
    regenerateCycle: "Regenerate Cycle",
    noPlan: "No weekly plan",
    adjustSession: "Session Adjustment",
    modify: "Modify:",
    focusZone: "Focus Zone",
    timeAvailable: "Time Available (min)",
    modality: "Modality",
    noEquipment: "No-equipment training",
    recalcParams: "Recalculate Parameters",

    // Active Session
    activeSession: "Active Session",
    recovery: "Recovery",
    notes: "Notes",
    finishSession: "Finish Session",
    easy: "Easy",
    good: "Good",
    hard: "Hard",
    hide: "HIDE",
    viewTech: "View Technique",
    series: "Set",
    reps: "Reps",
    load: "Load",
    superset: "Superset",
    completed: "Completed",
    noRecords: "No previous records.",

    // Profile Tab
    biometrics: "Basic Data",
    gender: "Gender",
    age: "Age",
    height: "Height (cm)",
    weight: "Weight (kg)",
    bodyFat: "% Fat (Optional)",
    muscleMass: "% Muscle (Optional)",
    customFocus: "Custom Focus",
    mainGoal: "Main Goal",
    expLevel: "Experience Level",
    daysWeek: "Days/Week",
    injuries: "Injuries / Limitations",
    saveFile: "Save File",
    dataManagement: "Data Management",
    export: "Export",
    pasteJson: "Paste JSON",
    uploadFile: "Upload File",
    phNotes: "Report pain, sensations, or necessary adjustments...",
    phInjuries: "e.g., Right knee meniscus...",
    male: "Male",
    female: "Female",
    goalFat: "Fat Loss / Metabolism",
    goalMuscle: "Hypertrophy / Strength",
    goalStrength: "Max Strength",
    goalCardio: "Cardio Endurance",
    expBeginner: "Beginner (0-6 months)",
    expInter: "Intermediate (6m - 2y)",
    expAdvanced: "Advanced (+2y)",

    // Messages
    msgPlanGen: "New therapeutic plan generated!",
    msgSessionUpd: "Clinical session updated.",
    msgSessionReg: "Session completed and registered.",
    msgBonusReg: "Bonus workout registered!",
    msgProfileSaved: "File saved successfully.",
    msgImported: "Data imported.",

    // Data Management
    importData: "Import Data",
    exportData: "Export Data",
    copyBackup: "Backup Copy",
    copied: "Copied",
    copyToClip: "Copy to Clipboard",
    importBtn: "Import",

    // General UI
    cancel: "Cancelar",
    smashSet: "FINISH SET",
    nextEx: "NEXT",
    prevEx: "PREVIOUS",
    finishWorkout: "FINISH",
    letsGo: "LET'S GO!",
    restTimer: "REST",
    rateEffort: "How did you feel the effort?",
    rateA1: "Effort Exercise 1",
    rateA2: "Effort Exercise 2",
    warmupTitle: "Warm-up",
    warmupDesc: "Prepare your body",
    startMain: "START ROUTINE",
    cooldownTitle: "Cool-down",
    cooldownDesc: "Return to calm",
    finishComplete: "FINISH SESSION",
    paused: "PAUSED"
  }
};

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
    let val = str.replace(/segundos?|segun\w*/gi, 'seg').replace(/minutos?|mins?/gi, 'min');
    if (/min|seg|sec|m\b|s\b/i.test(val)) return val.substring(0, 8); 
    const nums = val.match(/\d+/); 
    return nums ? nums[0] : "--"; 
};

export const formatLoadDisplay = (str) => { 
    if (!str || /PC|Bodyweight/i.test(str)) return "BW"; 
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