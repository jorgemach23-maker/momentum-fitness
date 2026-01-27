import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { 
    TRANSLATIONS, 
    cleanExerciseTitle, 
    formatRepsDisplay, 
    formatLoadDisplay,
    formatDuration
} from '../../../utils/helpers.js';

// --- Componente para Carga Fija (Peso Corporal) ---
const BodyweightLoad = ({ isSuperset = false }) => {
    const sizeClass = isSuperset ? "text-lg" : "text-2xl";
    const paddingClass = isSuperset ? "h-12" : "h-14";

    return (
        <div className={`flex flex-col items-center justify-center ${paddingClass} bg-slate-800/30 rounded-xl border border-slate-700/30`}>
            <span className={`${sizeClass} font-black text-slate-500`}>BW</span>
        </div>
    );
};

// --- Componente para Ajuste de Carga ---
const AdjustableLoad = ({ initialLoad, onUpdate, isSuperset = false }) => {
    const numericInitial = typeof initialLoad === 'number' ? initialLoad : parseFloat(initialLoad) || 0;
    const [load, setLoad] = useState(numericInitial);
    const [isInteracting, setIsInteracting] = useState(false);
    const touchStartY = useRef(0);
    const lastUpdateY = useRef(0);

    useEffect(() => {
        setLoad(numericInitial);
    }, [numericInitial]);

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        lastUpdateY.current = e.touches[0].clientY;
        setIsInteracting(true);
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        const currentY = e.touches[0].clientY;
        const deltaY = lastUpdateY.current - currentY;
        const sensitivity = 25;
        const increment = 1.25;

        if (Math.abs(deltaY) > sensitivity) {
            let newLoad;
            if (deltaY > 0) { // Arriba
                newLoad = Math.min(250, load + increment);
            } else { // Abajo
                newLoad = Math.max(0, load - increment);
            }
            newLoad = Math.round(newLoad * 100) / 100;
            setLoad(newLoad);
            onUpdate(newLoad);
            lastUpdateY.current = currentY;
        }
    };

    const handleTouchEnd = () => {
        setIsInteracting(false);
    };
    
    const sizeClass = isSuperset ? "text-lg" : "text-2xl";
    const paddingClass = isSuperset ? "h-12" : "h-14";

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
            className={`relative flex flex-col items-center justify-center ${paddingClass} bg-slate-800/50 rounded-xl border border-slate-700/50 cursor-ns-resize transition-all duration-200 ${isInteracting ? 'bg-teal-900/50 border-teal-500/50 scale-105 shadow-lg z-10' : ''}`}>
            {isInteracting && <Icon name="chevronUp" className="w-3 h-3 text-teal-400 opacity-70 absolute top-1 animate-bounce" />}
            <span className={`${sizeClass} font-black text-teal-400 leading-none`}>{formatLoadDisplay(load)}</span>
            {isInteracting && <Icon name="chevronDown" className="w-3 h-3 text-teal-400 opacity-70 absolute bottom-1 animate-bounce" />}
        </div>
    );
};


export const ActiveSession = ({ 
    routine, 
    onRoutineFeedback, 
    lang, 
    onExerciseComplete, 
    restSeconds, 
    setRestSeconds, 
    setIsSessionActive, 
    isSessionActive,
    sessionSeconds 
}) => {
    const routineId = routine.id;
    const currentLang = lang || 'es';
    const t = TRANSLATIONS?.[currentLang] || TRANSLATIONS?.['es'] || {};
    
    const [phase, setPhase] = useState('warmup');
    const [idx, setIdx] = useState(0);
    const [completedSets, setCompletedSets] = useState({});
    const [currentLoads, setCurrentLoads] = useState({});
    const [showDesc, setShowDesc] = useState(false);
    
    const isResting = restSeconds > 0;

    const exercises = (routine.rutinaPrincipal || []).filter(e => !/calentamiento|warm.?up/i.test(e.ejercicio));
    
    const activeExercise = phase === 'workout' ? exercises[idx] : null;
    const isSuperset = activeExercise?.tipo_bloque === 'superserie';
    
    useEffect(() => {
        if (!activeExercise) return;
        const initialLoads = {};
        
        const isBodyWeightExercise = (name) => /burpee|salto|jump|plank|flexion|push.?up|dominada|pull.?up|crunch|abdominal|mountain|climber|silla|air/i.test(name || "");

        (activeExercise.componentes || []).forEach((set, setIdx) => {
            const keyA = `${idx}-${setIdx}-A`;
            const keyB = `${idx}-${setIdx}-B`;

            const parseL = (val, exerciseName) => {
                if (typeof val === 'string' && /BW|PC|Bodyweight/i.test(val)) return 'BW';
                const n = parseFloat(val);
                if ((isNaN(n) || n === 0) && isBodyWeightExercise(exerciseName)) return 'BW';
                return isNaN(n) ? 0 : n;
            };

            const loadA = parseL(set.carga_sugeridaA ?? set.carga_sugerida, activeExercise.ejercicio);
            initialLoads[keyA] = loadA;

            if (isSuperset) {
                const parts = activeExercise.ejercicio.split('+');
                const nameB = parts[1] || activeExercise.ejercicio;
                const loadB = parseL(set.carga_sugeridaB, nameB);
                initialLoads[keyB] = loadB;
            }
        });
        setCurrentLoads(prev => ({ ...prev, ...initialLoads }));
    }, [activeExercise, idx]);

    const progressPercent = phase === 'warmup' ? 0 : phase === 'cooldown' ? 100 : ((idx + 1) / exercises.length) * 100;

    const openDemo = (exerciseName) => {
       if (!exerciseName) return;
       const cleanName = exerciseName.replace(/^(?:A[1-2]:?|B[1-2]:?|Superserie:?|Serie\s?\w+)\s*/i, '').replace(/\(.*\)/, '').trim();
       const query = encodeURIComponent(`${cleanName} tecnica ejercicio`);
       window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
    };

    const handleLoadUpdate = (exIdx, setIdx, part, newLoad) => {
        const key = `${exIdx}-${setIdx}-${part}`;
        setCurrentLoads(prev => ({ ...prev, [key]: newLoad }));
    };

    const toggleSetCompletion = (exIndex, setIndex) => {
        const key = `${exIndex}-${setIndex}`;
        const isNowDone = !completedSets[key]?.completed;

        if (isNowDone) {
            const loadA = currentLoads[`${exIndex}-${setIndex}-A`];
            const loadB = currentLoads[`${exIndex}-${setIndex}-B`];
            const setInfo = activeExercise.componentes[setIndex];

            const setData = {
                completed: true,
                ejercicio: cleanExerciseTitle(activeExercise.ejercicio),
                load: loadA,
                reps: setInfo.repeticiones_ejercicioA ?? setInfo.repeticiones_ejercicio
            };
            if (isSuperset) {
                setData.loadB = loadB;
                setData.repsB = setInfo.repeticiones_ejercicioB;
            }

            setCompletedSets(prev => ({ ...prev, [key]: setData }));
            if (onExerciseComplete) onExerciseComplete(activeExercise);
            setRestSeconds(activeExercise.descanso_entre_series || 60);
        } else {
            const { [key]: _, ...rest } = completedSets;
            setCompletedSets(rest);
        }
    };

    const handleNext = () => {
        if (phase === 'warmup') {
            setPhase('workout');
        } else if (phase === 'cooldown') {
            onRoutineFeedback?.(routineId, { sets: completedSets }, "", "completed");
        } else if (idx < exercises.length - 1) {
            setIdx(prev => prev + 1);
        } else {
            setPhase('cooldown');
        }
    };

    const handlePrev = () => {
        if (phase === 'cooldown') setPhase('workout');
        else if (phase === 'workout' && idx > 0) setIdx(prev => prev - 1);
        else setPhase('warmup');
    };
    
    let partA = null, partB = null;
    if (activeExercise && phase === 'workout') {
        if (isSuperset) {
            const parts = activeExercise.ejercicio.split('+');
            partA = cleanExerciseTitle(parts[0]);
            partB = cleanExerciseTitle(parts[1]);
        } else {
            partA = cleanExerciseTitle(activeExercise.ejercicio);
        }
    }

    const renderLoadCell = (set, setIdx, part) => {
        const currentVal = currentLoads[`${idx}-${setIdx}-${part}`];
        if (currentVal === 'BW') return <BodyweightLoad isSuperset={isSuperset} />;
        return (
            <AdjustableLoad 
                initialLoad={currentVal ?? 0}
                onUpdate={(nl) => handleLoadUpdate(idx, setIdx, part, nl)} 
                isSuperset={isSuperset} 
            />
        );
    };

    return (
        <div className="relative animate-fadeIn h-[calc(100vh-80px)] overflow-hidden flex flex-col px-4">
            <div className="mb-2 pt-2 shrink-0">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">
                    <span>{phase === 'warmup' ? t.warmupTitle : phase === 'cooldown' ? t.cooldownTitle : `Ejercicio ${idx + 1} de ${exercises.length}`}</span>
                    <span>{`${Math.round(progressPercent)}%`}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-teal-500" style={{ width: `${progressPercent}%` }}></div></div>
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden pb-24">
                {phase === 'workout' && activeExercise ? (
                    <div className="animate-slideInRight flex-1 flex flex-col">
                        <div className="flex flex-col h-full">
                            <div className="mb-4 shrink-0">
                                {isSuperset ? (
                                    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-3 space-y-3 shadow-lg">
                                        <div className="flex justify-between items-center gap-2"><h3 className="text-sm font-black text-white truncate flex-1">{partA}</h3><button onClick={() => openDemo(partA)} className="p-1.5 rounded-lg bg-slate-700 text-red-500"><Icon name="youtube" className="w-4 h-4" /></button></div>
                                        <div className="flex items-center gap-2"><div className="h-px flex-1 bg-slate-700"></div><Icon name="link2" className="w-3 h-3 text-slate-500"/><div className="h-px flex-1 bg-slate-700"></div></div>
                                        <div className="flex justify-between items-center gap-2"><h3 className="text-sm font-black text-white truncate flex-1">{partB}</h3><button onClick={() => openDemo(partB)} className="p-1.5 rounded-lg bg-slate-700 text-red-500"><Icon name="youtube" className="w-4 h-4" /></button></div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center pt-2">
                                        <h2 className="text-2xl font-black text-white leading-tight truncate flex-1 pr-2">{partA}</h2>
                                        <button onClick={() => openDemo(partA)} className="shrink-0 p-2.5 rounded-xl bg-slate-800 text-red-500 border border-slate-700 shadow-lg"><Icon name="youtube" className="w-5 h-5" /></button>
                                    </div>
                                )}
                            </div>

                            <div className="h-full flex flex-col bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                                {isSuperset ? (
                                    <>
                                        <div className="grid grid-cols-[25px_1fr_1fr_1fr_1fr_45px] gap-1 bg-slate-800/80 p-2 text-[8px] font-bold uppercase text-center border-b border-slate-700 text-slate-500 shrink-0"><div>#</div><div>Reps</div><div>Kg</div><div>Reps</div><div>Kg</div><Icon name="check" className="mx-auto w-3 h-3"/></div>
                                        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 minimal-scrollbar">
                                            {(activeExercise.componentes || []).map((set, setIdx) => {
                                                const isDone = completedSets[`${idx}-${setIdx}`]?.completed;
                                                return (
                                                <div key={setIdx} className={`grid grid-cols-[25px_1fr_1fr_1fr_1fr_45px] gap-1 items-center p-2 ${isDone ? 'bg-emerald-900/10' : ''}`}>
                                                    <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-900 shrink-0">{set.numero_serie}</div>
                                                    <div className="h-12 flex items-center justify-center bg-cyan-900/10 rounded border border-cyan-900/20 text-sm font-black text-cyan-100">{formatRepsDisplay(set.repeticiones_ejercicioA)}</div>
                                                    {renderLoadCell(set, setIdx, 'A')}
                                                    <div className="h-12 flex items-center justify-center bg-blue-900/10 rounded border border-blue-900/20 text-sm font-black text-blue-100">{formatRepsDisplay(set.repeticiones_ejercicioB)}</div>
                                                    {renderLoadCell(set, setIdx, 'B')}
                                                    <button onClick={() => toggleSetCompletion(idx, setIdx)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border mx-auto ${isDone ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-600'}`}><Icon name="check" className="w-4 h-4" /></button>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-[30px_1fr_1fr_50px] gap-3 bg-slate-800/80 p-3 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-slate-700 shrink-0"><div>#</div><div>Reps</div><div>Carga</div><Icon name="check" className="mx-auto w-4 h-4"/></div>
                                        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 minimal-scrollbar">
                                            {(activeExercise.componentes || []).map((set, setIdx) => {
                                                const isDone = completedSets[`${idx}-${setIdx}`]?.completed;
                                                return (
                                                <div key={setIdx} className={`grid grid-cols-[30px_1fr_1fr_50px] gap-3 items-center p-3 ${isDone ? 'bg-emerald-900/10' : ''}`}>
                                                    <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-900 shrink-0">{set.numero_serie}</div>
                                                    <div className="h-14 flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700/50 text-2xl font-black text-white">{formatRepsDisplay(set.repeticiones_ejercicio)}</div>
                                                    {renderLoadCell(set, setIdx, 'A')}
                                                    <button onClick={() => toggleSetCompletion(idx, setIdx)} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border mx-auto ${isDone ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-600'}`}><Icon name="check" className="w-5 h-5" /></button>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-4">
                        {phase === 'warmup' ? (
                            <><div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 shrink-0"><Icon name="flame" className="w-10 h-10 text-orange-500"/></div>
                            <h2 className="text-2xl font-black text-white mb-2">{t.warmupTitle}</h2>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed line-clamp-4">{routine.calentamiento || t.warmupDesc}</p>
                            <button onClick={handleNext} className="px-8 py-4 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-900/30">{t.startMain}</button></>
                        ) : (
                            <><div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 shrink-0"><Icon name="wind" className="w-10 h-10 text-blue-400"/></div>
                            <h2 className="text-2xl font-black text-white mb-2">{t.cooldownTitle}</h2>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 leading-relaxed line-clamp-4">{routine.enfriamiento || t.cooldownDesc}</p>
                            <button onClick={handleNext} className="px-8 py-4 bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-900/30">{t.finishComplete}</button></>
                        )}
                    </div>
                )}
            </div>

            <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
                <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-xl rounded-full border border-slate-700 shadow-2xl p-2 gap-4">
                    <div className="flex items-center gap-3 pl-2">
                        <button onClick={handlePrev} className="p-3 text-slate-400 hover:text-white rounded-full transition-colors active:scale-90"><Icon name="arrowLeft" className="w-5 h-5"/></button>
                        <button onClick={() => setIsSessionActive(!isSessionActive)} className={`p-4 rounded-full shadow-lg transition-all active:scale-95 ${!isSessionActive ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-slate-700 text-slate-300'}`}><Icon name={!isSessionActive ? "play" : "pause"} className="w-6 h-6 fill-current"/></button>
                        <button onClick={handleNext} className={`p-3 rounded-full transition-colors active:scale-90 ${phase === 'cooldown' ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`}><Icon name={phase === 'cooldown' ? 'check' : 'arrowRight'} className="w-5 h-5"/></button>
                    </div>
                    <div className="w-px h-8 bg-slate-700/50"></div>
                    <div className="flex items-center gap-2 pr-4 pl-1 font-mono font-bold text-lg text-teal-400"><Icon name="timer" className="w-4 h-4 opacity-70" /><span className="tabular-nums">{formatDuration(sessionSeconds)}</span></div>
                </div>
            </div>

            {isResting && (
                <div className="fixed inset-0 z-[60] bg-slate-950/98 flex flex-col animate-fadeIn backdrop-blur-2xl overflow-hidden p-6">
                     <div className="flex-1 flex flex-col items-center justify-around">
                         <div className="relative shrink-0 flex flex-col items-center">
                            <div className="absolute inset-0 bg-teal-500 blur-[80px] opacity-20 animate-pulse rounded-full"></div>
                            <div className="text-[140px] font-black text-white tabular-nums leading-none tracking-tighter relative z-10 text-stroke">
                                {restSeconds}
                            </div>
                            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-[0.4em] animate-pulse mt-2">{t.restTimer || "DESCANSO"}</h3>
                         </div>
                         <div className="flex gap-4 w-full max-w-sm shrink-0">
                             <button onClick={() => setRestSeconds(s => s + 30)} className="flex-1 py-4 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-bold active:scale-95 transition-all text-sm">+30s</button>
                             <button onClick={() => setRestSeconds(0)} className="flex-[2] py-4 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-500 shadow-xl shadow-teal-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 tracking-widest text-sm"><Icon name="play" className="w-5 h-5 fill-current"/> {t.letsGo || "CONTINUAR"}</button>
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default ActiveSession;