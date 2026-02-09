import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { 
    TRANSLATIONS, 
    formatDuration,
    isWarmup, 
    isCooldown 
} from '../../../utils/helpers.js';

// Componente helper para mostrar valores numéricos estilo Matrix
const MatrixValue = ({ value, unit, subtext, label }) => {
    const displayValue = (value !== undefined && value !== null) ? value : "--";
    
    return (
        <div className="relative w-[4.3rem] h-[4.3rem] xs:w-20 xs:h-20 bg-slate-900/90 rounded-2xl border border-slate-700/50 p-2 flex flex-col items-center justify-center shrink-0 shadow-lg backdrop-blur-sm pointer-events-none select-none overflow-hidden">
            {label && (
                <span className="absolute top-0 left-0 bg-slate-800/80 text-[8px] font-black text-slate-400 px-1.5 py-0.5 rounded-br-lg border-r border-b border-slate-700/50 z-10">
                    {label}
                </span>
            )}
            <span className="text-white font-bold text-xl xs:text-2xl tabular-nums leading-none tracking-tight mt-1">{displayValue}</span>
            <span className="text-slate-500 text-[7px] xs:text-[8px] uppercase font-bold tracking-wider mt-0.5">{unit || "REPS"}</span>
            {subtext && <span className="text-slate-600 text-[7px] font-medium leading-none mt-0.5 text-center px-1 truncate w-full">{subtext}</span>}
        </div>
    );
};

// Componente AdjustableLoad con estilo Matrix
const AdjustableLoadMatrix = ({ initialLoad, initialUnit, onUpdate, label }) => {
    const [load, setLoad] = useState(initialLoad ?? 0);
    const [isInteracting, setIsInteracting] = useState(false);
    const lastUpdateY = useRef(0);

    useEffect(() => {
        setLoad(initialLoad ?? 0);
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
    
    let displayUnit = initialUnit || "KG";
    let displayValue = load;

    if (displayUnit.toUpperCase() === 'BW' || displayUnit.toUpperCase() === 'BODYWEIGHT') {
        displayUnit = "Peso"; 
        if (load === 0) displayValue = "BW";
    }

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
            <span className={`${textClass} font-bold text-xl xs:text-2xl tabular-nums leading-none tracking-tight mt-1`}>{displayValue}</span>
            <span className={`${unitClass} text-[7px] xs:text-[8px] uppercase font-bold tracking-wider mt-0.5 text-center leading-tight px-1`}>{displayUnit}</span>
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
    
    // --- ADAPTADOR UNIFICADO ---
    const normalizedBlocks = useMemo(() => {
        const sanitizeRepsText = (text, idx) => {
            if (!text) return "--";
            let clean = String(text);
            if (clean.includes('A1:') || clean.includes('A2:') || clean.includes('Ej 1:')) {
                const regex = new RegExp(`(?:A${idx + 1}|Ej\\s*${idx + 1})[:\\s]*([^,]+)`, 'i');
                const match = clean.match(regex);
                if (match) return match[1].trim();
            }
            if (clean.includes('+')) {
                const parts = clean.split('+');
                if (parts[idx]) return parts[idx].trim();
            }
            return clean;
        };

        const extractTarget = (val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const cleanVal = val.replace(/^[A-Z]\d+[:\s]*/i, '').replace(/^Ej\s*\d+[:\s]*/i, '');
                const matchRange = cleanVal.match(/-(\d+)/);
                if (matchRange) return parseInt(matchRange[1], 10);
                const matchNum = cleanVal.match(/(\d+)/);
                if (matchNum) return parseInt(matchNum[1], 10);
            }
            return null;
        };

        // REPARACIÓN: Extraer carga numérica ignorando prefijos de índice
        const extractNumericLoad = (val) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            const str = String(val);
            // Elimina prefijos A1: o Ej 1: para evitar falsos positivos (ej: A2 -> 2)
            const cleanStr = str.replace(/^[A-Z]\d+[:\s]*/i, '').replace(/^Ej\s*\d+[:\s]*/i, '');
            const match = cleanStr.match(/[\d.]+/); 
            return match ? parseFloat(match[0]) : 0;
        };

        // 1. Estructura Nueva (Bloques)
        if (currentRoutine.bloques && Array.isArray(currentRoutine.bloques) && currentRoutine.bloques.length > 0) {
            return currentRoutine.bloques.map(b => ({
                ...b,
                items: Array.isArray(b.items) ? b.items.map((item, idx) => {
                    const cleanRepsText = sanitizeRepsText(item.reps_texto, idx);
                    return {
                        ...item,
                        reps_texto: cleanRepsText,
                        reps_target: item.reps_target ?? extractTarget(cleanRepsText)
                    };
                }) : []
            }));
        }

        // 2. Estructura Legacy (RutinaPrincipal)
        const legacyExercises = currentRoutine.rutinaPrincipal || [];
        if (legacyExercises.length > 0) {
            return legacyExercises.map(ex => {
                const isConcatSuperset = ex.ejercicio.includes('+');
                let items = [];

                if (isConcatSuperset) {
                    const parts = ex.ejercicio.split('+');
                    const loadParts = (ex.carga_sugerida || "").toString().split('+');

                    items = parts.map((part, idx) => {
                        const rawReps = ex.reps || ex.repeticiones_ejercicio;
                        const cleanRepsText = sanitizeRepsText(ex.reps_texto || String(rawReps || "--"), idx);
                        const rawLoad = loadParts[idx] || ex.carga_sugerida;

                        return {
                            ejercicio: part.trim().replace(/^[A-Z]\d+[:\s]*/, ''), 
                            reps_target: extractTarget(cleanRepsText),
                            reps_texto: cleanRepsText,
                            peso_valor: extractNumericLoad(rawLoad), // Uso helper reparado
                            peso_unidad: "KG",
                            descanso_segs: idx === parts.length - 1 ? (ex.descanso_segs || 60) : 0, 
                            series: ex.series || 3
                        };
                    });
                } else {
                    const rawReps = ex.reps || ex.repeticiones_ejercicio;
                    const cleanRepsText = sanitizeRepsText(ex.reps_texto || String(rawReps || "--"), 0);
                    
                    items = [{
                        ejercicio: ex.ejercicio,
                        reps_target: extractTarget(cleanRepsText),
                        reps_texto: cleanRepsText,
                        peso_valor: parseFloat(ex.carga_sugerida) || 0,
                        peso_unidad: "KG",
                        series: ex.series || 3,
                        descanso_segs: ex.descanso_segs || 60
                    }];
                }

                return {
                    fase_sesion: isWarmup(ex) ? 'warmup' : isCooldown(ex) ? 'cooldown' : 'main',
                    estructura_visual: isConcatSuperset ? 'superset' : 'single',
                    items: items
                };
            });
        }

        return [];
    }, [currentRoutine]);

    // --- FILTRADO ---
    const warmupBlocks = normalizedBlocks.filter(isWarmup);
    const cooldownBlocks = normalizedBlocks.filter(isCooldown);
    const workoutBlocks = normalizedBlocks.filter(b => !isWarmup(b) && !isCooldown(b));

    const [phase, setPhase] = useState(() => {
        if (warmupBlocks.length > 0) return 'warmup';
        if (workoutBlocks.length > 0) return 'workout';
        return cooldownBlocks.length > 0 ? 'cooldown' : 'workout'; 
    });

    const [blockIndex, setBlockIndex] = useState(0); 
    const [completedSets, setCompletedSets] = useState({});
    const [userLoads, setUserLoads] = useState({});

    const isResting = restSeconds > 0;

    const activeBlock = phase === 'workout' ? workoutBlocks[blockIndex] : null;
    
    const activeWarmupItems = warmupBlocks.flatMap(b => b.items || []);
    const activeCooldownItems = cooldownBlocks.flatMap(b => b.items || []);

    const nextBlock = phase === 'workout' && blockIndex + 1 < workoutBlocks.length 
        ? workoutBlocks[blockIndex + 1] 
        : (phase === 'workout' && cooldownBlocks.length > 0 ? cooldownBlocks[0] : null);

    const isSuperset = activeBlock?.estructura_visual === 'superset' || (activeBlock?.items?.length > 1);
    
    const progressPercent = phase === 'warmup' ? 0 : phase === 'cooldown' ? 100 : ((blockIndex + 1) / Math.max(workoutBlocks.length, 1)) * 100;

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

    const handleLoadUpdate = (bIdx, sIdx, itemIdx, newLoad) => {
        const key = `${bIdx}-${sIdx}-${itemIdx}`;
        setUserLoads(prev => ({ ...prev, [key]: newLoad }));
    };

    const toggleSetCompletion = (setIndex) => {
        const key = `${blockIndex}-${setIndex}`;
        const isNowDone = !completedSets[key]?.completed;
        
        if (isNowDone) {
            const setData = { completed: true };
            
            if (activeBlock && activeBlock.items) {
                activeBlock.items.forEach((item, itemIdx) => {
                    const loadKey = `${blockIndex}-${setIndex}-${itemIdx}`;
                    const finalLoad = userLoads[loadKey] ?? item.peso_valor;
                    
                    setData[`exercise_${itemIdx}`] = {
                        ejercicio: item.ejercicio,
                        reps: item.reps_target,
                        load: finalLoad
                    };
                });
            }

            setCompletedSets(prev => ({ ...prev, [key]: setData }));
            
            if (onExerciseComplete) onExerciseComplete(activeBlock);
            
            const lastItem = activeBlock.items[activeBlock.items.length - 1];
            const restTime = lastItem?.descanso_segs || activeBlock.descanso_segs || 60;
            setRestSeconds(restTime);

        } else {
            const { [key]: _, ...rest } = completedSets;
            setCompletedSets(rest);
        }
    };

    const handleNext = () => {
        if (phase === 'warmup') {
            if (workoutBlocks.length > 0) {
                setPhase('workout');
                setBlockIndex(0);
            } else if (cooldownBlocks.length > 0) {
                setPhase('cooldown');
            } else {
                handleRoutineFeedback?.(routineId, { sets: completedSets }, "", "completed");
            }
        }
        else if (phase === 'workout') {
            if (blockIndex < workoutBlocks.length - 1) { 
                setBlockIndex(prev => prev + 1); 
            } else {
                if (cooldownBlocks.length > 0) setPhase('cooldown');
                else handleRoutineFeedback?.(routineId, { sets: completedSets }, "", "completed");
            }
        }
        else if (phase === 'cooldown') {
            handleRoutineFeedback?.(routineId, { sets: completedSets }, "", "completed");
        }
    };

    const formatWarmupList = (items) => {
        if (!items || items.length === 0) return null;
        return items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></span>
                <span className="text-slate-300 text-sm leading-relaxed font-medium">{item.ejercicio}</span>
            </li>
        ));
    };

    return (
        <div className="h-screen w-full bg-black flex flex-col overflow-hidden relative selection:bg-teal-500/30">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header Integrado */}
                <header className="shrink-0 px-4 pt-6 pb-2 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center gap-4">
                    <button onClick={handleBackToMain} className="p-3 bg-slate-900/50 border border-slate-800 rounded-full text-slate-400 active:scale-90 hover:text-white transition-all shadow-lg shrink-0">
                        <Icon name="arrowLeft" className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="flex justify-between items-baseline mb-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[70%]">
                                {phase === 'warmup' ? t.warmupTitle : phase === 'cooldown' ? t.cooldownTitle : activeBlock?.items[0]?.ejercicio || `BLOQUE ${blockIndex + 1}`}
                            </span>
                            <span className="text-[10px] font-black text-teal-400 tabular-nums">
                                {`${Math.round(progressPercent)}%`}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
                            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_8px_rgba(20,184,166,0.6)] transition-all duration-700 ease-out rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 pb-32 minimal-scrollbar pt-2">
                    {phase === 'workout' && activeBlock ? (
                        <div className="flex flex-col space-y-6">
                            {/* TITULO Y VIDEO DEL BLOQUE */}
                            <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-4 shadow-xl backdrop-blur-md">
                                {activeBlock.items.map((item, idx) => (
                                    <div key={idx} className={idx > 0 ? "mt-4 pt-4 border-t border-white/5" : ""}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {isSuperset && (
                                                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded border ${idx === 0 ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                                        {idx === 0 ? 'A1' : 'A2'}
                                                    </span>
                                                )}
                                                <h3 className="text-lg xs:text-xl font-bold text-white truncate">{item.ejercicio}</h3>
                                            </div>
                                            <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${item.ejercicio}+short`, '_blank')} className="p-2 text-red-500 bg-white/5 rounded-xl active:scale-95"><Icon name="youtube" className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {Array.from({ length: activeBlock.items[0]?.series || 3 }).map((_, setIdx) => {
                                    const isDone = completedSets[`${blockIndex}-${setIdx}`]?.completed;

                                    return (
                                        <div 
                                            key={setIdx} 
                                            onClick={() => toggleSetCompletion(setIdx)}
                                            className={`group relative flex items-center gap-2 p-3 rounded-[2.5rem] transition-all duration-300 border ${isDone ? 'bg-teal-500/20 border-teal-500/40' : 'bg-slate-900/60 border-white/5 active:bg-slate-800'}`}
                                        >
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

                                            <div className="flex-1 flex flex-wrap items-center justify-end gap-2 overflow-hidden">
                                                {activeBlock.items.map((item, itemIdx) => {
                                                    const loadKey = `${blockIndex}-${setIdx}-${itemIdx}`;
                                                    const userLoad = userLoads[loadKey];
                                                    const currentLoad = userLoad !== undefined ? userLoad : item.peso_valor;

                                                    return (
                                                        <React.Fragment key={itemIdx}>
                                                            {itemIdx > 0 && <div className="w-px h-12 bg-white/10 hidden sm:block mx-4"></div>}
                                                            
                                                            <div className="flex gap-1.5 xs:gap-2">
                                                                <MatrixValue 
                                                                    value={item.reps_target} 
                                                                    unit={`${item.reps_texto} REPS`} 
                                                                    label={isSuperset ? (itemIdx === 0 ? 'A1' : 'A2') : null} 
                                                                />
                                                                <AdjustableLoadMatrix 
                                                                    initialLoad={currentLoad}
                                                                    initialUnit={item.peso_unidad}
                                                                    onUpdate={(nl) => handleLoadUpdate(blockIndex, setIdx, itemIdx, nl)}
                                                                    label={isSuperset ? (itemIdx === 0 ? 'A1' : 'A2') : null}
                                                                />
                                                            </div>
                                                        </React.Fragment>
                                                    );
                                                })}
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
                                    {phase === 'warmup' && activeWarmupItems.length > 0 
                                        ? formatWarmupList(activeWarmupItems)
                                        : phase === 'cooldown' && activeCooldownItems.length > 0
                                            ? formatWarmupList(activeCooldownItems)
                                            : <li className="text-slate-400 text-sm italic">Prepárate para la sesión</li>
                                    }
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
                    {phase === 'workout' ? (
                        <div className="pointer-events-auto flex items-center gap-6 bg-slate-900/90 border border-white/10 rounded-full p-2 pr-6 pl-4 backdrop-blur-xl shadow-2xl">
                            <button onClick={() => blockIndex > 0 && setBlockIndex(blockIndex - 1)} className="p-3 text-slate-500 active:scale-75 hover:text-white transition-colors"><Icon name="arrowLeft" className="w-5 h-5"/></button>
                            
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsSessionActive(!isSessionActive)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${!isSessionActive ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
                                    <Icon name={!isSessionActive ? "play" : "pause"} className="w-5 h-5 fill-current"/>
                                </button>
                                <div className="text-lg font-mono font-black text-teal-400 tracking-tighter tabular-nums min-w-[3.5rem] text-center">
                                    {formatDuration(sessionSeconds)}
                                </div>
                            </div>

                            <button onClick={handleNext} className="p-3 text-slate-500 active:scale-75 hover:text-white transition-colors"><Icon name="arrowRight" className="w-5 h-5"/></button>
                        </div>
                    ) : (
                        <button onClick={handleNext} className="pointer-events-auto w-full max-w-sm py-4 bg-teal-500 shadow-lg shadow-teal-500/20 text-white font-black rounded-2xl active:scale-[0.98] transition-all text-xs tracking-[0.2em] uppercase backdrop-blur-md border border-white/10">
                            {phase === 'warmup' ? t.startMain : t.finishComplete}
                        </button>
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
                                {nextBlock ? (
                                    <div className="text-base font-bold text-white bg-slate-800/40 p-4 rounded-lg truncate">
                                        {nextBlock.items.map(i => i.ejercicio).join(" + ")}
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
