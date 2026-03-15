import es from '../../locales/es.json';
import en from '../../locales/en.json';
import de from '../../locales/de.json'; // Añadimos el alemán

export const TRANSLATIONS = { es, en, de }; // Incluimos el alemán en el objeto exportado

// --- ADAPTADOR UNIVERSAL (RESPETA SUPERSERIES) ---
export const normalizeRoutine = (data) => {
    if (!data) return { rutinaPrincipal: [], diaEnfoque: "Entrenamiento" };

    const routine = data.routine || data;
    const title = routine.diaEnfoque || routine.diaNombre || routine.dia || routine.title || "Entrenamiento";
    let exercises = [];
    
    if (routine.bloques && Array.isArray(routine.bloques) && routine.bloques.length > 0) {
        routine.bloques.forEach(bloque => {
            const isSuperset = bloque.estructura_visual === 'superset' || (bloque.fase_sesion && bloque.fase_sesion.includes('super'));
            
            if (isSuperset && bloque.items && Array.isArray(bloque.items) && bloque.items.length >= 2) {
                exercises.push({
                    ...bloque,
                    fase_sesion: bloque.fase_sesion || 'main',
                    ejercicio: `${bloque.items[0].ejercicio || 'Ej 1'} + ${bloque.items[1].ejercicio || 'Ej 2'}`,
                    items: bloque.items.map(item => ({
                        ...item,
                        fase_sesion: bloque.fase_sesion || 'main'
                    }))
                });
            } else if (bloque.items && Array.isArray(bloque.items) && bloque.items.length > 0) {
                bloque.items.forEach(item => {
                    exercises.push({
                        ...item,
                        fase_sesion: bloque.fase_sesion || item.fase_sesion || 'main',
                        estructura_visual: 'single'
                    });
                });
            } else if (bloque.ejercicio || bloque.nombre) {
                exercises.push({
                    ...bloque,
                    fase_sesion: bloque.fase_sesion || 'main',
                    estructura_visual: 'single'
                });
            }
        });
    } 
    else if (routine.rutinaPrincipal && Array.isArray(routine.rutinaPrincipal) && routine.rutinaPrincipal.length > 0) {
        exercises = routine.rutinaPrincipal;
    }
    else {
        for (const key in routine) {
            if (Array.isArray(routine[key]) && routine[key].length > 0 && typeof routine[key][0] === 'object') {
                const arr = routine[key];
                arr.forEach(item => {
                    if (item.ejercicio || item.nombre) {
                        exercises.push({ ...item, ejercicio: item.ejercicio || item.nombre || "Ejercicio" });
                    } else if (item.items && Array.isArray(item.items)) {
                        item.items.forEach(sub => exercises.push({ ...sub, fase_sesion: item.fase_sesion || 'main' }));
                    }
                });
                if (exercises.length > 0) break;
            }
        }
    }

    const finalExercises = exercises.map(ex => {
        const rawPhase = (ex.fase_sesion || ex.fase || ex.tipo_bloque || ex.bloque || 'main').toLowerCase();
        let safePhase = 'main';
        if (rawPhase.includes('warm') || rawPhase.includes('calen')) safePhase = 'warmup';
        if (rawPhase.includes('cool') || rawPhase.includes('enfria') || rawPhase.includes('calma')) safePhase = 'cooldown';

        if (ex.estructura_visual === 'superset' && ex.items && ex.items.length > 0) {
            return {
                ...ex,
                fase_sesion: safePhase,
                ejercicio: ex.ejercicio || "Superserie",
                items: ex.items.map(subItem => ({
                    ...subItem,
                    ejercicio: subItem.ejercicio || subItem.nombre || "Ejercicio",
                    reps_target: subItem.reps_target ?? subItem.repeticiones ?? subItem.reps ?? 0,
                    peso_valor: subItem.peso_valor ?? subItem.carga ?? subItem.peso ?? 0,
                    descanso_segs: subItem.descanso_segs || 0
                }))
            };
        }

        return {
            ...ex,
            ejercicio: ex.ejercicio || ex.nombre_ejercicio || ex.nombre || ex.name || ex.exercise || "Desconocido",
            fase_sesion: safePhase,
            reps_target: ex.reps_target ?? ex.repeticiones ?? ex.reps ?? 0,
            reps_texto: ex.reps_texto || String(ex.reps_target || ex.repeticiones || ex.reps || "--"),
            peso_valor: ex.peso_valor ?? ex.carga ?? ex.peso ?? 0,
            peso_unidad: ex.peso_unidad ?? ex.unidad ?? 'kg',
            tecnica: ex.tecnica || ex.instrucciones || null,
            descanso_segs: ex.descanso_segs || ex.descanso || 60,
            series: ex.series || 3
        };
    });

    return {
        ...routine,
        diaEnfoque: title,
        rutinaPrincipal: finalExercises
    };
};

export const isWarmup = (exercise) => {
    if (!exercise) return false;
    const b = (exercise.fase_sesion || exercise.tipo_bloque || exercise.bloque || "").toLowerCase();
    const name = (exercise.ejercicio || "").toLowerCase();
    return b === 'warmup' || b === 'calentamiento' || name.includes('calentamiento') || name.includes('warm up');
};

export const isCooldown = (exercise) => {
    if (!exercise) return false;
    const b = (exercise.fase_sesion || exercise.tipo_bloque || exercise.bloque || "").toLowerCase();
    const name = (exercise.ejercicio || "").toLowerCase();
    return b === 'cooldown' || b === 'enfriamiento' || b === 'vuelta a la calma' || name.includes('enfriamiento');
};

export const isWarmupOrCooldown = (exercise) => {
    return isWarmup(exercise) || isCooldown(exercise);
};

export const calculateSmartRest = (profile, exercise) => {
    let restTime = 60; 
    const goal = profile?.mainGoal || '';
    if (goal.includes('Fuerza') || goal.includes('Strength')) restTime = 180; 
    else if (goal.includes('Hipertrofia') || goal.includes('Hypertrophy')) restTime = 90;
    else if (goal.includes('Grasa') || goal.includes('Cardio') || goal.includes('Fat')) restTime = 45;
    
    const tipo = (exercise?.fase_sesion || exercise?.tipo_bloque || "").toLowerCase();

    if (tipo === 'superserie') {
        if (goal.includes('Fuerza') || goal.includes('Strength')) restTime = 180;
        else restTime = 60; 
    }
    
    if (tipo !== 'superserie') {
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

export const formatRepsDisplay = (input, subIndex = 0) => { 
    if (!input) return "--"; 
    if (typeof input === 'object' && input.items && Array.isArray(input.items)) {
        if (input.items[subIndex]) return formatRepsDisplay(input.items[subIndex]);
    }
    if (typeof input === 'object' && input !== null) {
        if (input.reps_texto) return String(input.reps_texto);
        if (input.reps_textoA && subIndex === 0) return String(input.reps_textoA);
        if (input.reps_textoB && subIndex === 1) return String(input.reps_textoB);
        const val = input.reps_target ?? input.repeticiones_ejercicio ?? input.reps ?? input.repeticiones ?? "--";
        if (typeof val === 'object') return "--";
        return formatRepsDisplay(val);
    }
    const str = String(input);
    if (str.length < 20 && !/\d/.test(str)) return str;
    let val = str.replace(/segundos?|segun\w*/gi, 'seg').replace(/minutos?|mins?/gi, 'min');
    if (/AMRAP/i.test(val)) return "AMRAP";
    if (/^\d+-\d+$/.test(val)) return val;
    if (/min|seg|sec|m\b|s\b/i.test(val)) return val.substring(0, 10); 
    const nums = val.match(/\d+/); 
    return nums ? nums[0] : "--"; 
};

export const formatLoadDisplay = (val) => { 
    if (val === undefined || val === null) return "0 kg";
    if (val === 0) return "BW";
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