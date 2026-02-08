import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { 
    TRANSLATIONS, 
    cleanExerciseTitle, 
    formatRepsDisplay, 
    formatLoadDisplay,
    formatDuration,
    isWarmup, 
    isCooldown 
} from '../../../utils/helpers.js';

// Componente helper para mostrar valores numéricos estilo Matrix - Tamaños responsivos
const MatrixValue = ({ value, unit, subtext, label }) => {
    return (
        // Reducción 10% adicional en tamaño base (w-[4.3rem])
        <div className="relative w-[4.3rem] h-[4.3rem] xs:w-20 xs:h-20 bg-slate-900/90 rounded-2xl border border-slate-700/50 p-2 flex flex-col items-center justify-center shrink-0 shadow-lg backdrop-blur-sm pointer-events-none select-none overflow-hidden">
            {label && (
                <span className="absolute top-0 left-0 bg-slate-800/80 text-[8px] font-black text-slate-400 px-1.5 py-0.5 rounded-br-lg border-r border-b border-slate-700/50 z-10">
                    {label}
                </span>
            )}
            <span className="text-white font-bold text-base xs:text-lg tabular-nums leading-none tracking-tight mt-1">{value}</span>
            <span className="text-slate-500 text-[7px] xs:text-[8px] uppercase font-bold tracking-wider mt-0.5">{unit}</span>
            {subtext && <span className="text-slate-600 text-[7px] font-medium leading-none mt-0.5 text-center px-1 truncate w-full">{subtext}</span>}
        </div>
    );
};

// Componente AdjustableLoad con estilo Matrix - Tamaños responsivos
const AdjustableLoadMatrix = ({ initialLoad, onUpdate, label }) => {
    const [load, setLoad] = useState(initialLoad === null ? 0 : initialLoad);
    const [isInteracting, setIsInteracting] = useState(false);
    const lastUpdateY = useRef(0);

    useEffect(() => {
        setLoad(initialLoad === null ? 0 : initialLoad);
    }, [initialLoad]);

    const handleTouchStart = (e) => {
        e.stopPropagation();
        lastUpdateY.current = e.touches[0].clientY;
        setIsInteracting(true);
    };

    const handleTouchMove = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const currentY = e.touches[0].clientY;
        const deltaY = lastUpdateY.current - currentY;
        const sensitivity = 25;
        if (Math.abs(deltaY) > sensitivity) {
            let newLoad = deltaY > 0 ? Math.min(300, load + 1.25) : Math.max(0, load - 1.25);
            newLoad = Math.round(newLoad * 100) / 100;
            setLoad(newLoad);
            onUpdate(newLoad);
            lastUpdateY.current = currentY;
        }
    };
    
    let displayValue = "0";
    let unit = "KG";
    
    if (initialLoad === 0 || initialLoad === null) {
        displayValue = "BW";
        unit = "Peso";
    } else {
        const str = formatLoadDisplay(initialLoad);
        const match = str.match(/([\d.]+)\s*(.*)/);
        if (match) {
            displayValue = match[1];
            unit = match[2] || "KG";
        } else {
             if (str === "BW") {
                 displayValue = "BW";
                 unit = "Peso";
             } else {
                 displayValue = str;
             }
        }
    }

    // Reducción 10% adicional en tamaño base (w-[4.3rem])
    const containerClass = `relative w-[4.3rem] h-[4.3rem] xs:w-20 xs:h-20 rounded-2xl border flex flex-col items-center justify-center shrink-0 transition-all duration-200 cursor-ns-resize select-none touch-none overflow-hidden ${
        isInteracting 
        ? 'bg-teal-900/80 border-teal-500/50 scale-105 shadow-[0_0_20px_rgba(20,184,166,0.3)] z-10' 
        : 'bg-slate-900/90 border-slate-700/50 shadow-lg backdrop-blur-sm'
    }`;
    
    const textClass = isInteracting ? 'text-teal-400' : 'text-white';
    const unitClass = isInteracting ? 'text-teal-500/70' : 'text-slate-500';

    return (
        <div 
            onTouchStart={handleTouchStart} 
            onTouchMove={handleTouchMove} 
            onTouchEnd={(e) => { e.stopPropagation(); setIsInteracting(false); }}
            onClick={(e) => e.stopPropagation()}
            className={containerClass}>
            
            {label && (
                <span className={`absolute top-0 left-0 text-[8px] font-black px-1.5 py-0.5 rounded-br-lg border-r border-b z-20 ${
                    label.includes('A1') ? 'bg-cyan-900/40 text-cyan-400 border-cyan-500/20' : 
                    label.includes('A2') ? 'bg-blue-900/40 text-blue-400 border-blue-500/20' : 
                    'bg-slate-800/80 text-slate-400 border-slate-700/50'
                }`}>
                    {label}
                </span>
            )}

            {isInteracting && <Icon name="chevronUp" className="w-3 h-3 text-teal-400 absolute top-1.5 animate-pulse" />}
            <span className={`${textClass} font-bold text-base xs:text-lg tabular-nums leading-none tracking-tight mt-1`}>{displayValue}</span>
            <span className={`${unitClass} text-[7px] xs:text-[8px] uppercase font-bold tracking-wider mt-0.5 text-center leading-tight px-1`}>{unit}</span>
            {isInteracting && <Icon name="chevronDown" className="w-3 h-3 text-teal-400 absolute bottom-1.5 animate-pulse" />}
        </div>
    );
};

export const ActiveSession = ({ 
    currentRoutine, 
    handleRoutineFeedback, 
    lang, 
    onExerciseComplete, 
    restSeconds, 
    setRestSeconds, 
    setIsSessionActive, 
    isSessionActive,
    sessionSeconds,
    handleBackToMain,
    title
}) => {
    const routineId = currentRoutine.id;
    const t = TRANSLATIONS?.[lang || 'es'] || TRANSLATIONS?.['es'] || {};
    const [phase, setPhase] = useState('warmup');
    const [idx, setIdx] = useState(0);
    const [completedSets, setCompletedSets] = useState({});
    const [currentLoads, setCurrentLoads] = useState({});
    
    const isResting = restSeconds > 0;
    const rawExercises = currentRoutine.rutinaPrincipal || [];
    const warmupEx = rawExercises.filter(isWarmup);
    const cooldownEx = rawExercises.filter(isCooldown);
    const exercises = rawExercises.filter(e => !isWarmup(e) && !isCooldown(e));
    const activeExercise = phase === 'workout' ? exercises[idx] : null;
    const nextExercise = phase === 'workout' && idx + 1 < exercises.length ? exercises[idx + 1] : null;

    useEffect(() => {
        if (isResting) {
            const timer = setInterval(() => {
                setRestSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isResting, setRestSeconds]);

    const detectSuperset = (ex) => {
        if (!ex) return false;
        const bloqueType = (ex.bloque || ex.tipo_bloque || "").toLowerCase();
        return bloqueType.includes('superserie') || /\+/.test(ex.ejercicio) || /[A-Z]2[:\s]/i.test(ex.ejercicio);
    };

    const isSuperset = detectSuperset(activeExercise);

    const getSupersetLetter = (currentIndex) => {
        let count = 0;
        for (let i = 0; i < currentIndex; i++) {
            if (detectSuperset(exercises[i])) count++;
        }
        return String.fromCharCode(65 + count);
    };

    const currentLetter = getSupersetLetter(idx);

    const getExerciseParts = (title) => {
        if (!title) return ["Ejercicio 1", "Ejercicio 2"];
        let rawParts = title.split(/\s*\+\s*/);
        if (/[A-Z]2[:\s]/i.test(title)) {
             const match = title.match(/[\+\s]*([A-Z]2[:\s].*)/i);
             if (match) {
                 const part2 = match[1];
                 const part1 = title.replace(match[0], '').trim();
                 rawParts = [part1, part2];
             }
        }
        const parts = rawParts.map(p => {
             if (!p) return "";
             return cleanExerciseTitle(p.replace(/[A-Z][12][:.)\s]*/gi, '').replace(/^\+\s*/, '').trim());
        }).filter(p => p.length > 0);
        return [parts[0] || "Ejercicio A", parts[1] || "Ejercicio B"];
    };

    const [partA, partB] = isSuperset 
        ? (activeExercise?.ejercicioA && activeExercise?.ejercicioB 
            ? [activeExercise.ejercicioA, activeExercise.ejercicioB]
            : getExerciseParts(activeExercise?.ejercicio))
        : [cleanExerciseTitle(activeExercise?.ejercicio), null];
        
    const nextIsSuperset = detectSuperset(nextExercise);
    const [nextPartA, nextPartB] = nextIsSuperset 
        ? (nextExercise?.ejercicioA && nextExercise?.ejercicioB 
            ? [nextExercise.ejercicioA, nextExercise.ejercicioB]
            : getExerciseParts(nextExercise?.ejercicio))
        : [cleanExerciseTitle(nextExercise?.ejercicio), null];

    useEffect(() => {
        if (!activeExercise) return;
        const initialLoads = {};
        const isBodyweightByName = (name) => /burpee|salto|jump|plank|flexion|push.?up|dominada|pull.?up|crunch|abdominal|mountain|climber|silla|air|calistenia|fondos/i.test(name || "");
        const parseLoad = (val, exerciseName) => {
            if (typeof val === 'string' && val.toUpperCase() === 'BW') return 0;
            const num = parseFloat(val);
            if (!isNaN(num)) return num;
            if (isBodyweightByName(exerciseName)) return 0;
            return null;
        };
        (activeExercise.componentes || []).forEach((set, setIdx) => {
            initialLoads[`${idx}-${setIdx}-A`] = parseLoad(set.carga_sugeridaA ?? set.carga_sugerida, partA);
            if (isSuperset) initialLoads[`${idx}-${setIdx}-B`] = parseLoad(set.carga_sugeridaB, partB);
        });
        setCurrentLoads(initialLoads);
    }, [activeExercise, idx, isSuperset, partA, partB]);

    const progressPercent = phase === 'warmup' ? 0 : phase === 'cooldown' ? 100 : ((idx + 1) / exercises.length) * 100;

    const handleLoadUpdate = (exIdx, setIdx, part, newLoad) => {
        const key = `${exIdx}-${setIdx}-${part}`;
        setCurrentLoads(prev => ({ ...prev, [key]: newLoad }));
    };

    const toggleSetCompletion = (setIndex) => {
        const key = `${idx}-${setIndex}`;
        const isNowDone = !completedSets[key]?.completed;
        if (isNowDone) {
            const setInfo = activeExercise.componentes[setIndex];
            const loadA = currentLoads[`${idx}-${setIndex}-A`];
            const setData = { completed: true, ejercicio: activeExercise.ejercicio, load: loadA === null ? 0 : loadA, reps: setInfo.repeticiones_ejercicioA ?? setInfo.repeticiones_ejercicio };
            if (isSuperset) { 
                const loadB = currentLoads[`${idx}-${setIndex}-B`];
                setData.loadB = loadB === null ? 0 : loadB; 
                setData.repsB = setInfo.repeticiones_ejercicioB; 
            }
            setCompletedSets(prev => ({ ...prev, [key]: setData }));
            if (onExerciseComplete) onExerciseComplete(activeExercise);
            const restTime = activeExercise.descanso_segs || activeExercise.descanso_entre_series || 60;
            setRestSeconds(restTime);
        } else {
            const { [key]: _, ...rest } = completedSets;
            setCompletedSets(rest);
        }
    };

    const handleNext = () => {
        if (phase === 'warmup') setPhase('workout');
        else if (phase === 'cooldown') handleRoutineFeedback?.(routineId, { sets: completedSets }, "", "completed");
        else if (idx < exercises.length - 1) setIdx(prev => prev + 1);
        else setPhase('cooldown');
    };

    const formatWarmup = (data) => {
        if (!data) return null;
        if (Array.isArray(data)) {
             return data.map((ex, i) => (
                <li key={i} className="flex items-start gap-3 text-left">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></span>
                    <span className="text-slate-300 text-sm leading-relaxed font-medium">{ex.ejercicio || ex}</span>
                </li>
            ));
        }
        return null; 
    };

    return (
        <div className="h-screen w-full bg-black flex flex-col overflow-hidden relative selection:bg-teal-500/30">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <header className="shrink-0 p-4 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handleBackToMain} className="p-2 -ml-2 text-slate-400 active:scale-90"><Icon name="arrowLeft" className="w-6 h-6" /></button>
                        <h1 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] truncate max-w-[60%]">{title}</h1>
                        <div className="w-10"></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        <span>{phase === 'warmup' ? t.warmupTitle : phase === 'cooldown' ? t.cooldownTitle : `EJE ${idx + 1}/${exercises.length}`}</span>
                        <span className="text-teal-500">{`${Math.round(progressPercent)}%`}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)] transition-all duration-700" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 pb-32 minimal-scrollbar pt-2">
                    {phase === 'workout' && activeExercise ? (
                        <div className="flex flex-col space-y-6">
                            <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-4 shadow-xl backdrop-blur-md">
                                {isSuperset ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className="shrink-0 text-[10px] font-black bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">A1</span>
                                                <h3 className="text-lg xs:text-xl font-bold text-white truncate">{partA}</h3>
                                            </div>
                                            <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${partA}+short`, '_blank')} className="p-2 text-red-500 bg-white/5 rounded-xl active:scale-95"><Icon name="youtube" className="w-5 h-5" /></button>
                                        </div>
                                        <div className="h-px bg-white/5 w-full"></div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className="shrink-0 text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">A2</span>
                                                <h3 className="text-lg xs:text-xl font-bold text-white truncate">{partB}</h3>
                                            </div>
                                            <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${partB}+short`, '_blank')} className="p-2 text-red-500 bg-white/5 rounded-xl active:scale-95"><Icon name="youtube" className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-2xl font-black text-white leading-tight pr-4">{partA}</h2>
                                        <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${partA}+short`, '_blank')} className="p-2 text-red-500 bg-white/5 rounded-xl active:scale-95"><Icon name="youtube" className="w-5 h-5" /></button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {(activeExercise.componentes || []).map((set, setIdx) => {
                                    const isDone = completedSets[`${idx}-${setIdx}`]?.completed;
                                    const valA = currentLoads[`${idx}-${setIdx}-A`];
                                    const valB = currentLoads[`${idx}-${setIdx}-B`];
                                    const repsA = formatRepsDisplay(set.repeticiones_ejercicioA ?? set.repeticiones_ejercicio);
                                    const repsB = isSuperset ? formatRepsDisplay(set.repeticiones_ejercicioB) : null;

                                    return (
                                        <div 
                                            key={setIdx} 
                                            onClick={() => toggleSetCompletion(setIdx)}
                                            className={`group relative flex items-center gap-2 p-3 rounded-[2.5rem] transition-all duration-300 border ${isDone ? 'bg-teal-500/20 border-teal-500/40' : 'bg-slate-900/60 border-white/5 active:bg-slate-800'}`}
                                        >
                                            {/* Reducción 40% en círculo de sesión (w-8 h-8) */}
                                            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ml-1">
                                                {isDone ? (
                                                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                                                        <Icon name="check" className="w-4 h-4 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 font-black text-[10px]">
                                                        {setIdx + 1}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Ajuste para ocupar el 90% restante */}
                                            <div className="flex-1 flex flex-wrap items-center justify-end gap-2 overflow-hidden">
                                                {isSuperset ? (
                                                    <>
                                                        <div className="flex gap-1.5 xs:gap-2">
                                                            <MatrixValue value={repsA} unit="REPS" label="A1" />
                                                            <AdjustableLoadMatrix initialLoad={valA} onUpdate={(nl) => handleLoadUpdate(idx, setIdx, 'A', nl)} label="A1" />
                                                        </div>
                                                        <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                                                        <div className="flex gap-1.5 xs:gap-2">
                                                            <MatrixValue value={repsB} unit="REPS" label="A2" />
                                                            <AdjustableLoadMatrix initialLoad={valB} onUpdate={(nl) => handleLoadUpdate(idx, setIdx, 'B', nl)} label="A2" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <MatrixValue value={repsA} unit="REPS" />
                                                        <AdjustableLoadMatrix initialLoad={valA} onUpdate={(nl) => handleLoadUpdate(idx, setIdx, 'A', nl)} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                            <div className={`w-20 h-20 rounded-3xl ${phase === 'warmup' ? 'bg-orange-500/10' : 'bg-blue-500/10'} flex items-center justify-center mb-6 animate-pulse`}>
                                <Icon name={phase === 'warmup' ? "flame" : "wind"} className={`w-10 h-10 ${phase === 'warmup' ? 'text-orange-500' : 'text-blue-400'}`}/>
                            </div>
                            <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">{phase === 'warmup' ? t.warmupTitle : t.cooldownTitle}</h2>
                            <div className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-6 mb-10 w-full max-w-sm backdrop-blur-md">
                                <ul className="space-y-4">
                                    {formatWarmup(phase === 'warmup' ? (currentRoutine.calentamiento || warmupEx) : (currentRoutine.enfriamiento || cooldownEx)) || 
                                     <li className="text-slate-400 text-sm italic">Prepárate para la sesión</li>}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 p-4 pb-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                    {phase === 'workout' ? (
                        <div className="flex items-center gap-4 bg-slate-900/80 border border-white/10 rounded-full p-2 backdrop-blur-xl shadow-2xl">
                            <button onClick={() => idx > 0 && setIdx(idx-1)} className="p-3 text-slate-500 active:scale-75"><Icon name="arrowLeft" className="w-5 h-5"/></button>
                            <div className="flex-1 flex items-center justify-center gap-6">
                                <button onClick={() => setIsSessionActive(!isSessionActive)} className={`w-12 h-12 xs:w-14 xs:h-14 rounded-full flex items-center justify-center transition-all ${!isSessionActive ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-slate-800 text-slate-400'}`}>
                                    <Icon name={!isSessionActive ? "play" : "pause"} className="w-6 h-6 fill-current"/>
                                </button>
                                <div className="text-lg xs:text-xl font-mono font-black text-teal-400 tracking-tighter tabular-nums">
                                    {formatDuration(sessionSeconds)}
                                </div>
                            </div>
                            <button onClick={handleNext} className="p-3 text-slate-500 active:scale-75"><Icon name="arrowRight" className="w-5 h-5"/></button>
                        </div>
                    ) : (
                        <button onClick={handleNext} className={`w-full py-5 ${phase === 'warmup' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-teal-500 shadow-teal-500/20'} text-white font-black rounded-3xl shadow-2xl active:scale-[0.98] transition-all text-sm tracking-[0.2em] uppercase`}>{phase === 'warmup' ? t.startMain : t.finishComplete}</button>
                    )}
                </div>

                {isResting && (
                    <div className="absolute inset-0 z-[60] bg-slate-950/98 flex flex-col animate-fadeIn backdrop-blur-3xl p-6 text-center">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="relative shrink-0 flex flex-col items-center">
                                <div className="absolute -inset-10 bg-teal-500 blur-[120px] opacity-20 animate-pulse rounded-full"></div>
                                <div className="text-[120px] xs:text-[160px] font-black text-white tabular-nums leading-none tracking-tighter relative z-10">{String(restSeconds).padStart(2, '0')}</div>
                                <h3 className="text-sm font-black text-teal-400 uppercase tracking-[0.6em] animate-pulse mt-4">{t.restTimer || "DESCANSO"}</h3>
                            </div>
                        </div>

                        <div className="w-full max-w-sm mx-auto shrink-0 pb-8">
                            <div className="bg-black/20 rounded-2xl p-4 mb-6 text-left">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">{t.nextSession}</h4>
                                {nextExercise ? (
                                    <div className="text-base font-bold text-white bg-slate-800/40 p-4 rounded-lg truncate">
                                        {nextIsSuperset ? `${nextPartA} + ${nextPartB}` : nextPartA}
                                    </div>
                                ) : (
                                    <div className="text-base font-bold text-white bg-slate-800/40 p-4 rounded-lg">
                                        {t.cooldownTitle || 'Enfriamiento'}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <button onClick={() => setRestSeconds(0)} className="w-full py-5 rounded-2xl bg-teal-600 text-white font-black flex items-center justify-center gap-3 text-lg shadow-[0_20px_40px_rgba(20,184,166,0.2)] active:scale-95 transition-all uppercase tracking-widest"><Icon name="play" className="w-5 h-5 fill-current"/> {t.letsGo || "CONTINUAR"}</button>
                                <button onClick={() => setRestSeconds(s => s + 30)} className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 font-bold active:scale-95 transition-all text-xs tracking-widest">+30 SEGUNDOS</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActiveSession;
