import React, { useState } from 'react';
// Importación explícita de componentes UI
import { Icon } from '../../ui/Icon.jsx';
// Importación de helpers
import { 
    TRANSLATIONS, 
    cleanExerciseTitle, 
    formatRepsDisplay, 
    formatLoadDisplay,
    formatDuration
} from '../../../utils/helpers.js';

export const ActiveSession = ({ 
    routine, 
    onBack, 
    routineId, 
    onRoutineFeedback, 
    lang, 
    onExerciseComplete, 
    restSeconds, 
    setRestSeconds, 
    setIsSessionActive, 
    isSessionActive,
    sessionSeconds 
}) => {
    // Si lang no viene definido, usamos 'es' por defecto
    const currentLang = lang || 'es';
    const t = TRANSLATIONS?.[currentLang] || TRANSLATIONS?.['es'] || {};
    
    const [phase, setPhase] = useState('warmup'); // 'warmup' | 'workout' | 'cooldown'
    const [idx, setIdx] = useState(0);
    const [notes, setNotes] = useState("");
    const [completedSets, setCompletedSets] = useState({});
    const [particles, setParticles] = useState([]);
    const [exerciseFeedback, setExerciseFeedback] = useState({});
    const [showDesc, setShowDesc] = useState(false);
    
    // Si estamos en descanso activo, mostrar overlay
    const isResting = restSeconds > 0;

    if (!routine) return null;

    const exercises = routine.rutinaPrincipal || [];
    const totalExercises = exercises.length;
    
    // Configurar ejercicio activo basado en fase
    const activeExercise = phase === 'workout' ? exercises[idx] : null;
    const isSuperset = activeExercise?.tipo_bloque === 'superserie';
    
    // Barra de progreso relativa al total
    const progressPercent = phase === 'warmup' ? 0 : phase === 'cooldown' ? 100 : ((idx + 1) / totalExercises) * 100;

    // --- MANEJO DE VIDEOS ---
    const openDemo = (exerciseName) => {
       if (!exerciseName) return;
       const cleanName = exerciseName.replace(/^(?:A[1-2]:?|B[1-2]:?|Superserie:?|Serie\s?\w+)\s*/i, '').replace(/\(.*\)/, '').trim();
       const query = encodeURIComponent(`${cleanName} tecnica ejercicio`);
       window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
    };

    // --- MANEJO DE COMPLETADO ---
    const triggerConfetti = (e) => {
        const rect = e.target.getBoundingClientRect();
        const newParticles = Array.from({ length: 12 }).map((_, i) => ({
            id: Date.now() + i,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            tx: (Math.random() - 0.5) * 200,
            ty: (Math.random() - 0.5) * 200
        }));
        setParticles(prev => [...prev, ...newParticles]);
        setTimeout(() => setParticles([]), 1000);
    };

    const toggleSetCompletion = (exIndex, setIndex, exercise, e) => {
        const key = `${exIndex}-${setIndex}`;
        const isNowDone = !completedSets[key];
        setCompletedSets(prev => ({...prev, [key]: isNowDone}));
        if (isNowDone) {
            triggerConfetti(e);
            if (onExerciseComplete) onExerciseComplete(exercise);
            setRestSeconds(60); // Iniciar descanso automático
        }
    };

    const handleNext = () => {
        if (phase === 'warmup') {
            setPhase('workout');
            return;
        }
        if (phase === 'cooldown') {
            if (onRoutineFeedback) {
                onRoutineFeedback(routineId, { sets: completedSets, difficulty: exerciseFeedback }, notes, "hybrid_mode");
            } else {
                console.warn("onRoutineFeedback no está definido");
                if (onBack) onBack();
            }
            return;
        }
        
        if (idx < totalExercises - 1) {
            setIdx(prev => prev + 1);
            setShowDesc(false);
        } else {
            setPhase('cooldown');
        }
    };

    const handlePrev = () => {
        if (phase === 'cooldown') {
            setPhase('workout');
        } else if (phase === 'workout') {
            if (idx > 0) {
                setIdx(prev => prev - 1);
            } else {
                setPhase('warmup');
            }
        }
    };
    
    // --- MANEJO DE FEEDBACK GRANULAR ---
    const handleRateDifficulty = (subIndex, rating) => {
        const key = `${idx}_${subIndex}`;
        setExerciseFeedback(prev => ({...prev, [key]: rating}));
    };
    
    // --- LÓGICA DE "LO SIGUIENTE" (UP NEXT) ---
    const getNextContext = () => {
        if (phase !== 'workout') return null;
        if (!activeExercise) return null;
        
        const currentSets = activeExercise.componentes || [];
        for (let i = 0; i < currentSets.length; i++) {
             if (!completedSets[`${idx}-${i}`]) {
                 return { type: 'set', label: `Serie ${i + 1}`, detail: 'Mismo ejercicio', isNextEx: false };
             }
        }
        if (idx < totalExercises - 1) {
             const nextEx = exercises[idx + 1];
             if (nextEx.tipo_bloque === 'superserie') {
                 const parts = nextEx.ejercicio.split('+');
                 const name1 = cleanExerciseTitle(parts[0] || 'Ejercicio 1');
                 const name2 = cleanExerciseTitle(parts[1] || 'Ejercicio 2');
                 return { 
                     type: 'superset', 
                     label: `${name1} + ${name2}`, 
                     names: [name1, name2],
                     detail: 'Superserie: Prepara equipos', 
                     isNextEx: true 
                 };
             } else {
                 const cleanName = cleanExerciseTitle(nextEx.ejercicio); 
                 return { type: 'exercise', label: cleanName, names: [cleanName], detail: 'Prepara el equipo', isNextEx: true };
             }
        }
        return { type: 'finish', label: t.cooldownTitle || "Enfriamiento", detail: 'Ya casi acabas', isNextEx: true };
    };

    const nextContext = getNextContext();

    // Parseo de Superseries
    let partA = null, partB = null;
    if (activeExercise) {
        if (isSuperset) {
            const separators = ['+', '/', '\n', ' y '];
            let parts = null;
            for (const sep of separators) {
                if (activeExercise.ejercicio.includes(sep)) {
                    parts = activeExercise.ejercicio.split(sep);
                    break;
                }
            }
            partA = cleanExerciseTitle(parts ? parts[0] : activeExercise.ejercicio);
            partB = cleanExerciseTitle(parts ? parts[1] : "Parte 2");
        } else {
            partA = cleanExerciseTitle(activeExercise.ejercicio);
        }
    }

    const FeedbackButtons = ({ subIndex }) => {
        const currentRating = exerciseFeedback[`${idx}_${subIndex}`];
        const buttons = [
            { val: 'easy', icon: 'zap', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
            { val: 'good', icon: 'check', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
            { val: 'hard', icon: 'flame', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' }
        ];
        return (
            <div className="flex gap-2 w-full">
                {buttons.map(btn => {
                    const active = currentRating === btn.val;
                    return (
                        <button key={btn.val} onClick={() => handleRateDifficulty(subIndex, btn.val)} className={`flex-1 py-2 rounded-lg border flex items-center justify-center transition-all ${active ? `${btn.bg} ${btn.border} ${btn.color} ring-1 ring-inset ring-white/20` : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:bg-slate-700'}`}><Icon name={btn.icon} className="w-4 h-4" /></button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="relative animate-fadeIn min-h-[calc(100vh-140px)] flex flex-col">
            {particles.map(p => (
                <div key={p.id} className="particle bg-teal-400" style={{ left: p.x, top: p.y, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` }} />
            ))}

            <div className="mb-4 pt-2">
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">
                     <span>{phase === 'warmup' ? t.warmupTitle : phase === 'cooldown' ? t.cooldownTitle : `Ejercicio ${idx + 1} de ${totalExercises}`}</span>
                     <span>{phase === 'warmup' ? '0%' : phase === 'cooldown' ? '100%' : `${Math.round(progressPercent)}%`}</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-teal-500 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }}></div>
                 </div>
            </div>

            <div className="flex-1 flex flex-col relative pb-32">
                <div className="animate-slideInRight flex-1">
                    {/* FASE: WARMUP */}
                    {phase === 'warmup' && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10">
                            <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 animate-pulse"><Icon name="flame" className="w-12 h-12 text-orange-500"/></div>
                            <h2 className="text-3xl font-black text-white mb-2">{t.warmupTitle}</h2>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">{routine.calentamiento || t.warmupDesc}</p>
                            <button onClick={handleNext} className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl shadow-lg shadow-orange-900/30 transition-all">{t.startMain}</button>
                        </div>
                    )}

                    {/* FASE: COOLDOWN */}
                    {phase === 'cooldown' && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10">
                            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 animate-pulse"><Icon name="wind" className="w-12 h-12 text-blue-400"/></div>
                            <h2 className="text-3xl font-black text-white mb-2">{t.cooldownTitle}</h2>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed">{routine.enfriamiento || t.cooldownDesc}</p>
                            <button onClick={handleNext} className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl shadow-lg shadow-teal-900/30 transition-all">{t.finishComplete}</button>
                        </div>
                    )}

                    {/* FASE: WORKOUT */}
                    {phase === 'workout' && (
                        <>
                            <div className="mb-6">
                                {isSuperset ? (
                                    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
                                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
                                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Superserie</h2>
                                            <button onClick={()=>setShowDesc(!showDesc)} className="flex items-center gap-2 text-teal-400 hover:text-white text-xs font-bold transition-colors">
                                                <Icon name="info" className="w-4 h-4"/> <span>TÉCNICA</span>
                                            </button>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-black text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-500/20 mb-1 inline-block">A1</span>
                                                    <h3 className="text-lg font-black text-white leading-tight">{partA}</h3>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); openDemo(partA); }} className="p-2 rounded-lg bg-slate-700 text-red-500 hover:bg-red-600 hover:text-white transition-colors"><Icon name="youtube" className="w-5 h-5" /></button>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="h-px flex-1 bg-slate-700"></div>
                                                <div className="p-1.5 rounded-full bg-slate-700 border border-slate-600"><Icon name="link2" className="w-4 h-4 text-slate-400"/></div>
                                                <div className="h-px flex-1 bg-slate-700"></div>
                                            </div>

                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-black text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20 mb-1 inline-block">A2</span>
                                                    <h3 className="text-lg font-black text-white leading-tight">{partB}</h3>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); openDemo(partB); }} className="p-2 rounded-lg bg-slate-700 text-red-500 hover:bg-red-600 hover:text-white transition-colors"><Icon name="youtube" className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-2"><div className="flex items-center gap-2"><h2 className="text-3xl md:text-4xl font-black text-white leading-tight">{partA}</h2><button onClick={()=>setShowDesc(!showDesc)} className="text-slate-400 hover:text-white transition-colors mt-1"><Icon name="info" className="w-6 h-6"/></button></div></div>
                                        <button onClick={(e) => { e.stopPropagation(); openDemo(partA); }} className="shrink-0 p-3 rounded-xl bg-slate-800 text-red-500 hover:bg-red-600 hover:text-white border border-slate-700 shadow-lg transition-all z-10"><Icon name="youtube" className="w-6 h-6" /></button>
                                    </div>
                                )}
                            </div>

                            {showDesc && (
                                <div className="mb-6 p-4 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-600 text-xs text-slate-200 leading-relaxed animate-fadeIn shadow-xl">
                                    <h4 className="font-bold text-teal-400 mb-1 uppercase tracking-wider">Técnica & Tips</h4>
                                    {activeExercise.tecnica_general}
                                </div>
                            )}

                            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                                {isSuperset ? (
                                <>
                                    {/* SUPERSET TABLE */}
                                    <div className="grid grid-cols-[25px_2fr_2fr_45px] gap-1 bg-slate-800 border-b border-slate-700">
                                        <div className="bg-slate-900"></div>
                                        <div className="bg-cyan-900/20 text-cyan-400 text-[9px] font-black uppercase tracking-wider py-1 text-center border-r border-slate-700/50 truncate px-1">{partA}</div>
                                        <div className="bg-blue-900/20 text-blue-400 text-[9px] font-black uppercase tracking-wider py-1 text-center truncate px-1">{partB}</div>
                                        <div className="bg-slate-900"></div>
                                    </div>
                                    <div className="grid grid-cols-[25px_1fr_1fr_1fr_1fr_45px] gap-1 bg-slate-800/80 p-2 text-[8px] font-bold uppercase tracking-wider text-center border-b border-slate-700 text-slate-500">
                                        <div>#</div><div>Reps</div><div>Kg</div><div>Reps</div><div>Kg</div><div><Icon name="check" className="w-3 h-3 mx-auto"/></div>
                                    </div>
                                    <div className="divide-y divide-slate-800/50">
                                        {activeExercise.componentes.map((set, setIdx) => {
                                            const isDone = completedSets[`${idx}-${setIdx}`];
                                            return (
                                            <div key={setIdx} className={`grid grid-cols-[25px_1fr_1fr_1fr_1fr_45px] gap-1 items-center p-2 transition-colors ${isDone ? 'bg-emerald-900/10' : ''}`}>
                                                <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-900">{set.numero_serie}</div>
                                                <div className="flex flex-col items-center justify-center h-12 bg-cyan-900/10 rounded border border-cyan-900/20"><span className="text-base font-black text-cyan-100 tracking-tight">{formatRepsDisplay(set.repeticiones_ejercicioA)}</span></div>
                                                <div className="flex flex-col items-center justify-center h-12 bg-cyan-900/10 rounded border border-cyan-900/20"><span className="text-base font-black text-cyan-100 tracking-tight">{formatLoadDisplay(set.carga_sugeridaA)}</span></div>
                                                <div className="flex flex-col items-center justify-center h-12 bg-blue-900/10 rounded border border-blue-900/20"><span className="text-base font-black text-blue-100 tracking-tight">{formatRepsDisplay(set.repeticiones_ejercicioB)}</span></div>
                                                <div className="flex flex-col items-center justify-center h-12 bg-blue-900/10 rounded border border-blue-900/20"><span className="text-base font-black text-blue-100 tracking-tight">{formatLoadDisplay(set.carga_sugeridaB)}</span></div>
                                                <button onClick={(e) => toggleSetCompletion(idx, setIdx, activeExercise, e)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border mx-auto ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-90' : 'bg-slate-800 border-slate-600 text-slate-600 hover:border-slate-500 hover:text-slate-400'}`}><Icon name="check" className="w-5 h-5" /></button>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </>
                                ) : (
                                <>
                                    {/* STANDARD TABLE */}
                                    <div className="grid grid-cols-[30px_1fr_1fr_50px] gap-3 bg-slate-800/80 p-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-700">
                                        <div>#</div><div>Repeticiones</div><div>Carga</div><div><Icon name="check" className="w-4 h-4 mx-auto"/></div>
                                    </div>
                                    <div className="divide-y divide-slate-800/50">
                                        {activeExercise.componentes.map((set, setIdx) => {
                                            const isDone = completedSets[`${idx}-${setIdx}`];
                                            return (
                                            <div key={setIdx} className={`grid grid-cols-[30px_1fr_1fr_50px] gap-3 items-center p-3 transition-colors ${isDone ? 'bg-emerald-900/10' : ''}`}>
                                                <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-900">{set.numero_serie}</div>
                                                <div className="flex flex-col items-center justify-center h-16 bg-slate-800/50 rounded-xl border border-slate-700/50"><span className="text-3xl font-black text-white tracking-tighter">{formatRepsDisplay(set.repeticiones_ejercicio)}</span></div>
                                                <div className="flex flex-col items-center justify-center h-16 bg-slate-800/50 rounded-xl border border-slate-700/50"><span className="text-3xl font-black text-teal-400 tracking-tighter">{formatLoadDisplay(set.carga_sugerida)}</span></div>
                                                <button onClick={(e) => toggleSetCompletion(idx, setIdx, activeExercise, e)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 border mx-auto ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-90' : 'bg-slate-800 border-slate-600 text-slate-600 hover:border-slate-500 hover:text-slate-400'}`}><Icon name="check" className="w-6 h-6" /></button>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* DOCK FLOTANTE UNIFICADO */}
            {!isResting && (
                <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
                    <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-xl rounded-full border border-slate-700 shadow-2xl shadow-black/50 p-2 gap-4">
                        
                        {/* Controles: Atrás, Play/Pausa, Adelante */}
                        <div className="flex items-center gap-3 pl-2">
                            <button onClick={handlePrev} className="p-3 text-slate-400 hover:text-white transition-colors active:scale-95 rounded-full hover:bg-slate-800/50">
                                <Icon name="arrowLeft" className="w-5 h-5"/>
                            </button>
                            
                            <button onClick={() => setIsSessionActive(!isSessionActive)} className={`p-4 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center ${!isSessionActive ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-slate-700 text-slate-300'}`}>
                                <Icon name={!isSessionActive ? "play" : "pause"} className="w-6 h-6 fill-current"/>
                            </button>

                            <button onClick={handleNext} className={`group relative p-3 rounded-full transition-all active:scale-95 ${phase === 'cooldown' ? 'text-teal-400 hover:text-teal-300' : 'text-slate-400 hover:text-white'} hover:bg-slate-800/50`}>
                                <Icon name={phase === 'cooldown' ? 'check' : 'arrowRight'} className="w-5 h-5"/>
                            </button>
                        </div>

                        {/* Separador */}
                        <div className="w-px h-8 bg-slate-700/50"></div>

                        {/* Timer de Sesión */}
                        <div className="flex items-center gap-2 pr-4 pl-1 font-mono font-bold text-lg text-teal-400">
                            <Icon name="timer" className="w-4 h-4 opacity-70" />
                            <span className="tabular-nums tracking-tight">{formatDuration(sessionSeconds)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- OVERLAY DE DESCANSO Y FEEDBACK (INTEGRADO) --- */}
            {isResting && (
                <div className="fixed inset-0 z-[60] bg-slate-950/95 flex flex-col animate-fadeIn backdrop-blur-xl overflow-y-auto">
                     <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0">
                         
                         {/* 1. Timer Gigante */}
                         <div className="mb-8 relative shrink-0">
                            <div className="absolute inset-0 bg-teal-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                            <div className="text-[120px] font-black text-white tabular-nums leading-none tracking-tighter relative z-10 text-stroke">
                                {restSeconds}
                            </div>
                         </div>
                         <h3 className="text-xl font-bold text-teal-400 mb-8 uppercase tracking-[0.3em] animate-pulse shrink-0">
                             {t.restTimer || "DESCANSO"}
                         </h3>
                         
                         {/* 2. Botones de Feedback */}
                         <div className="w-full max-w-sm space-y-4 mb-8">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-2">
                                {t.rateEffort || "¿Esfuerzo percibido?"}
                            </h4>
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                                <div className="flex gap-3 w-full">
                                    {[
                                        { val: 'easy', icon: 'zap', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
                                        { val: 'good', icon: 'check', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
                                        { val: 'hard', icon: 'flame', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' }
                                    ].map(btn => {
                                        const isActive = exerciseFeedback[`${idx}_0`] === btn.val;
                                        return (
                                            <button 
                                                key={btn.val} 
                                                onClick={() => handleRateDifficulty(0, btn.val)} 
                                                className={`flex-1 py-4 rounded-xl border flex items-center justify-center transition-all duration-300 ${isActive ? `${btn.bg} ${btn.border} ${btn.color} ring-1 ring-inset ring-white/20 shadow-lg` : 'border-slate-700 bg-slate-800/30 text-slate-500 hover:bg-slate-700 hover:text-slate-300'}`}
                                            >
                                                <Icon name={btn.icon} className="w-6 h-6" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                         </div>

                         {/* 3. Tarjeta "A Continuación" */}
                         {nextContext && nextContext.isNextEx && (
                             <div className="w-full max-w-sm bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-8 shrink-0 backdrop-blur-sm shadow-xl animate-fadeIn">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                        <Icon name="fastForward" className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{nextContext.detail}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                    <div className="text-base font-bold text-white leading-tight line-clamp-1 px-2">
                                        {nextContext.label}
                                    </div>
                                </div>
                             </div>
                         )}

                         {/* 4. Botones de Acción (+30s / Continuar) */}
                         <div className="flex gap-4 w-full max-w-sm shrink-0 mt-auto pb-8">
                             <button 
                                 onClick={() => setRestSeconds(s => s + 30)} 
                                 className="flex-1 py-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold hover:bg-slate-700 hover:text-white active:scale-95 transition-all"
                             >
                                 +30s
                             </button>
                             <button 
                                 onClick={() => setRestSeconds(0)} 
                                 className="flex-[2] py-4 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500 shadow-lg shadow-teal-900/50 active:scale-95 transition-all flex items-center justify-center gap-2"
                             >
                                <Icon name="play" className="w-5 h-5 fill-current"/> 
                                {t.letsGo || "A DARLE"}
                             </button>
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default ActiveSession;