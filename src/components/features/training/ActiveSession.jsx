import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { 
    TRANSLATIONS, 
    cleanExerciseTitle, 
    formatRepsDisplay, 
    formatLoadDisplay,
    formatDuration
} from '../../../utils/helpers.js';

const BodyweightLoad = ({ isSuperset = false }) => {
    const sizeClass = isSuperset ? "text-lg" : "text-2xl";
    const paddingClass = isSuperset ? "h-12" : "h-14";
    return (
        <div className={`flex flex-col items-center justify-center ${paddingClass} bg-slate-800/30 rounded-xl border border-slate-700/30`}>
            <span className={`${sizeClass} font-black text-slate-500`}>BW</span>
        </div>
    );
};

const AdjustableLoad = ({ initialLoad, onUpdate, isSuperset = false }) => {
    const numericInitial = typeof initialLoad === 'number' ? initialLoad : parseFloat(initialLoad) || 0;
    const [load, setLoad] = useState(numericInitial);
    const [isInteracting, setIsInteracting] = useState(false);
    const touchStartY = useRef(0);
    const lastUpdateY = useRef(0);

    useEffect(() => { setLoad(numericInitial); }, [numericInitial]);

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
            let newLoad = deltaY > 0 ? Math.min(250, load + increment) : Math.max(0, load - increment);
            newLoad = Math.round(newLoad * 100) / 100;
            setLoad(newLoad);
            onUpdate(newLoad);
            lastUpdateY.current = currentY;
        }
    };

    return (
        <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => setIsInteracting(false)} style={{ touchAction: 'none' }} className={`relative flex flex-col items-center justify-center ${isSuperset ? 'h-12' : 'h-14'} bg-slate-800/50 rounded-xl border border-slate-700/50 cursor-ns-resize transition-all duration-200 ${isInteracting ? 'bg-teal-900/50 border-teal-500/50 scale-105 shadow-lg z-10' : ''}`}>
            {isInteracting && <Icon name="chevronUp" className="w-3 h-3 text-teal-400 opacity-70 absolute top-1 animate-bounce" />}
            <span className={`${isSuperset ? 'text-lg' : 'text-2xl'} font-black text-teal-400 leading-none`}>{formatLoadDisplay(load)}</span>
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
    const t = TRANSLATIONS?.[lang || 'es'] || TRANSLATIONS?.['es'] || {};
    const [phase, setPhase] = useState('warmup');
    const [idx, setIdx] = useState(0);
    const [completedSets, setCompletedSets] = useState({});
    const [currentLoads, setCurrentLoads] = useState({});
    const [showDesc, setShowDesc] = useState(false);
    
    const isResting = restSeconds > 0;

    const rawExercises = routine.rutinaPrincipal || [];
    const exercises = rawExercises.filter(e => !/calentamiento|warm.?up/i.test(e.ejercicio));
    const rawActiveExercise = phase === 'workout' ? exercises[idx] : null;

    const detectSuperset = (ex) => {
        if (!ex) return false;
        if (ex.tipo_bloque === 'superserie') return true;
        return /\+|\s+y\s+|\/|A1.*A2/i.test(ex.ejercicio);
    };

    const isSuperset = detectSuperset(rawActiveExercise);

    const getExerciseParts = (title) => {
        if (!title) return ["Ejercicio 1", "Ejercicio 2"];
        const simpleSplit = title.split(/[\+\/]/);
        if (simpleSplit.length > 1) {
            return [cleanExerciseTitle(simpleSplit[0]), cleanExerciseTitle(simpleSplit[1])];
        }
        const match = title.match(/A1[:\s]*(.+?)[\s\+]+A2[:\s]*(.+)/i);
        if (match && match.length >= 3) {
            return [cleanExerciseTitle(match[1]), cleanExerciseTitle(match[2])];
        }
        return [cleanExerciseTitle(title), ""];
    };

    const [partA, partB] = isSuperset ? getExerciseParts(rawActiveExercise?.ejercicio) : [cleanExerciseTitle(rawActiveExercise?.ejercicio), null];

    useEffect(() => {
        if (!rawActiveExercise) return;
        const initialLoads = {};
        const isBodyWeight = (name) => /burpee|salto|jump|plank|flexion|push.?up|dominada|pull.?up|crunch|abdominal|mountain|climber|silla|air/i.test(name || "");
        (rawActiveExercise.componentes || []).forEach((set, setIdx) => {
            const parseL = (val, name) => {
                if (typeof val === 'string' && /BW|PC|Bodyweight/i.test(val)) return 'BW';
                const n = parseFloat(val);
                if ((isNaN(n) || n === 0) && isBodyWeight(name)) return 'BW';
                return isNaN(n) ? 0 : n;
            };
            initialLoads[`${idx}-${setIdx}-A`] = parseL(set.carga_sugeridaA ?? set.carga_sugerida, partA);
            if (isSuperset) { initialLoads[`${idx}-${setIdx}-B`] = parseL(set.carga_sugeridaB, partB); }
        });
        setCurrentLoads(prev => ({ ...prev, ...initialLoads }));
    }, [rawActiveExercise, idx, isSuperset, partA, partB]);

    const progressPercent = phase === 'warmup' ? 0 : phase === 'cooldown' ? 100 : ((idx + 1) / exercises.length) * 100;

    const handleLoadUpdate = (exIdx, setIdx, part, newLoad) => {
        const key = `${exIdx}-${setIdx}-${part}`;
        setCurrentLoads(prev => ({ ...prev, [key]: newLoad }));
    };

    const toggleSetCompletion = (setIndex) => {
        const key = `${idx}-${setIndex}`;
        const isNowDone = !completedSets[key]?.completed;
        if (isNowDone) {
            const setInfo = rawActiveExercise.componentes[setIndex];
            const setData = { completed: true, ejercicio: rawActiveExercise.ejercicio, load: currentLoads[`${idx}-${setIdx}-A`], reps: setInfo.repeticiones_ejercicioA ?? setInfo.repeticiones_ejercicio };
            if (isSuperset) { setData.loadB = currentLoads[`${idx}-${setIdx}-B`]; setData.repsB = setInfo.repeticiones_ejercicioB; }
            setCompletedSets(prev => ({ ...prev, [key]: setData }));
            if (onExerciseComplete) onExerciseComplete(rawActiveExercise);
            setRestSeconds(rawActiveExercise.descanso_entre_series || 60);
        } else {
            const { [key]: _, ...rest } = completedSets;
            setCompletedSets(rest);
        }
    };

    const handleNext = () => {
        if (phase === 'warmup') setPhase('workout');
        else if (phase === 'cooldown') onRoutineFeedback?.(routineId, { sets: completedSets }, "", "completed");
        else if (idx < exercises.length - 1) { setIdx(prev => prev + 1); setShowDesc(false); }
        else setPhase('cooldown');
    };

    const handlePrev = () => {
        if (phase === 'cooldown') setPhase('workout');
        else if (phase === 'workout' && idx > 0) setIdx(prev => prev - 1);
        else setPhase('warmup');
    };

    const formatWarmup = (text) => {
        if (!text) return null;
        return text.split(/[.\n-]/).filter(s => s.trim().length > 3).map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></span>
                <span className="text-slate-300 text-sm leading-relaxed font-medium">{s.trim()}</span>
            </li>
        ));
    };

    return (
        <div className="h-screen w-full bg-slate-900 flex flex-col overflow-hidden relative">
            {/* Header Fijo */}
            <div className="shrink-0 p-4 pt-6 bg-slate-900/80 backdrop-blur-md z-30">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">
                    <span>{phase === 'warmup' ? t.warmupTitle : phase === 'cooldown' ? t.cooldownTitle : `Ejercicio ${idx + 1} de ${exercises.length}`}</span>
                    <span>{`${Math.round(progressPercent)}%`}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>

            {/* Área de Contenido Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pb-40 minimal-scrollbar animate-fadeIn">
                {phase === 'workout' && rawActiveExercise ? (
                    <div className="flex flex-col">
                        <div className="mb-4">
                            {isSuperset ? (
                                <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-3 space-y-3 shadow-lg">
                                    <div className="flex justify-between items-center gap-2"><h3 className="text-sm font-black text-white truncate flex-1">{partA}</h3><button onClick={() => window.open(`https://www.youtube.com/results?search_query=${partA}+tecnica`, '_blank')} className="p-1.5 rounded-lg bg-slate-700 text-red-500"><Icon name="youtube" className="w-4 h-4" /></button></div>
                                    <div className="flex items-center gap-2"><div className="h-px flex-1 bg-slate-700"></div><Icon name="link2" className="w-3 h-3 text-slate-500"/><div className="h-px flex-1 bg-slate-700"></div></div>
                                    {partB && <div className="flex justify-between items-center gap-2"><h3 className="text-sm font-black text-white truncate flex-1">{partB}</h3><button onClick={() => window.open(`https://www.youtube.com/results?search_query=${partB}+tecnica`, '_blank')} className="p-1.5 rounded-lg bg-slate-700 text-red-500"><Icon name="youtube" className="w-4 h-4" /></button></div>}
                                </div>
                            ) : (
                                <div className="flex justify-between items-center pt-2">
                                    <h2 className="text-2xl font-black text-white leading-tight truncate flex-1 pr-2">{partA}</h2>
                                    <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${partA}+tecnica`, '_blank')} className="shrink-0 p-2.5 rounded-xl bg-slate-800 text-red-500 border border-slate-700 shadow-lg"><Icon name="youtube" className="w-5 h-5" /></button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                            <div className="grid grid-cols-[25px_1fr_1fr_1fr_1fr_45px] gap-1 bg-slate-800/80 p-2 text-[8px] font-bold uppercase text-center border-b border-slate-700 text-slate-500">
                                {isSuperset ? (<><div>#</div><div className="text-cyan-400">Reps</div><div className="text-cyan-400">Kg</div><div className="text-blue-400">Reps</div><div className="text-blue-400">Kg</div><Icon name="check" className="mx-auto w-3 h-3"/></>) : (<><div>#</div><div className="col-span-2">Repeticiones</div><div className="col-span-2">Carga</div><Icon name="check" className="mx-auto w-4 h-4"/></>)}
                            </div>
                            <div className="divide-y divide-slate-800/50">
                                {(rawActiveExercise.componentes || []).map((set, setIdx) => {
                                    const isDone = completedSets[`${idx}-${setIdx}`]?.completed;
                                    const valA = currentLoads[`${idx}-${setIdx}-A`];
                                    const valB = currentLoads[`${idx}-${setIdx}-B`];
                                    return (
                                        <div key={setIdx} className={`grid ${isSuperset ? 'grid-cols-[25px_1fr_1fr_1fr_1fr_45px]' : 'grid-cols-[30px_1fr_1fr_50px]'} gap-1 items-center p-2 ${isDone ? 'bg-emerald-900/10' : ''}`}>
                                            <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-900 shrink-0">{set.numero_serie}</div>
                                            {isSuperset ? (
                                                <><div className="h-12 flex items-center justify-center bg-cyan-900/10 rounded border border-cyan-900/20 text-sm font-black text-cyan-100">{formatRepsDisplay(set.repeticiones_ejercicioA)}</div>
                                                {valA === 'BW' ? <BodyweightLoad isSuperset={true}/> : <AdjustableLoad initialLoad={valA} onUpdate={(nl) => handleLoadUpdate(idx, setIdx, 'A', nl)} isSuperset={true} />}
                                                <div className="h-12 flex items-center justify-center bg-blue-900/10 rounded border border-blue-900/20 text-sm font-black text-blue-100">{formatRepsDisplay(set.repeticiones_ejercicioB)}</div>
                                                {valB === 'BW' ? <BodyweightLoad isSuperset={true}/> : <AdjustableLoad initialLoad={valB} onUpdate={(nl) => handleLoadUpdate(idx, setIdx, 'B', nl)} isSuperset={true} />}
                                                </>
                                            ) : (
                                                <><div className="h-14 flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700/50 text-2xl font-black text-white">{formatRepsDisplay(set.repeticiones_ejercicio)}</div>
                                                {valA === 'BW' ? <BodyweightLoad /> : <AdjustableLoad initialLoad={valA} onUpdate={(nl) => handleLoadUpdate(idx, setIdx, 'A', nl)} />}</>
                                            )}
                                            <button onClick={() => toggleSetCompletion(setIdx)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border mx-auto ${isDone ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-600'}`}><Icon name="check" className="w-4 h-4" /></button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <div className={`w-24 h-24 rounded-full ${phase === 'warmup' ? 'bg-orange-500/10' : 'bg-blue-500/10'} flex items-center justify-center mb-6 animate-pulse`}><Icon name={phase === 'warmup' ? "flame" : "wind"} className={`w-12 h-12 ${phase === 'warmup' ? 'text-orange-500' : 'text-blue-400'}`}/></div>
                        <h2 className="text-3xl font-black text-white mb-2">{phase === 'warmup' ? t.warmupTitle : t.cooldownTitle}</h2>
                        <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 p-8 mb-10 w-full">
                            <ul className="space-y-6 text-left">{formatWarmup(phase === 'warmup' ? (routine.calentamiento || t.warmupDesc) : (routine.enfriamiento || t.cooldownDesc))}</ul>
                        </div>
                        <button onClick={handleNext} className={`w-full py-5 ${phase === 'warmup' ? 'bg-orange-500 shadow-orange-900/30' : 'bg-teal-500 shadow-teal-900/30'} text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-sm tracking-widest`}>{phase === 'warmup' ? t.startMain : t.finishComplete}</button>
                    </div>
                )}
            </div>

            {/* Dock Flotante Verdaderamente Fijo */}
            {!isResting && (
                <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
                    <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-full p-2 gap-4">
                        <div className="flex items-center gap-3 pl-2">
                            <button onClick={handlePrev} className="p-3 text-slate-400 hover:text-white rounded-full transition-colors active:scale-90"><Icon name="arrowLeft" className="w-5 h-5"/></button>
                            <button onClick={() => setIsSessionActive(!isSessionActive)} className={`p-4 rounded-full shadow-lg transition-all active:scale-95 ${!isSessionActive ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-slate-700 text-slate-300'}`}><Icon name={!isSessionActive ? "play" : "pause"} className="w-6 h-6 fill-current"/></button>
                            <button onClick={handleNext} className={`p-3 rounded-full transition-colors active:scale-90 ${phase === 'cooldown' ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`}><Icon name={phase === 'cooldown' ? 'check' : 'arrowRight'} className="w-5 h-5"/></button>
                        </div>
                        <div className="w-px h-8 bg-slate-700/50"></div>
                        <div className="flex items-center gap-2 pr-4 pl-1 font-mono font-bold text-lg text-teal-400"><Icon name="timer" className="w-4 h-4 opacity-70" /><span className="tabular-nums">{formatDuration(sessionSeconds)}</span></div>
                    </div>
                </div>
            )}

            {/* Pantalla de Descanso (Capa Superior) */}
            {isResting && (
                <div className="absolute inset-0 z-[60] bg-slate-950/98 flex flex-col animate-fadeIn backdrop-blur-2xl p-6 text-center">
                     <div className="flex-1 flex flex-col items-center justify-center">
                         <div className="relative shrink-0 flex flex-col items-center mb-12">
                            <div className="absolute -inset-4 bg-teal-500 blur-[80px] opacity-20 animate-pulse rounded-full"></div>
                            <div className="text-[140px] font-black text-white tabular-nums leading-none tracking-tighter relative z-10 text-stroke">{String(restSeconds).padStart(2, '0')}</div>
                            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-[0.4em] animate-pulse mt-2">{t.restTimer || "DESCANSO"}</h3>
                         </div>
                         <div className="w-full max-w-sm shrink-0">
                             <button onClick={() => setRestSeconds(0)} className="w-full py-5 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center gap-2 text-base shadow-lg shadow-teal-500/20 active:scale-95 transition-all"><Icon name="play" className="w-5 h-5 fill-current"/> {t.letsGo || "CONTINUAR"}</button>
                             <button onClick={() => setRestSeconds(s => s + 30)} className="mt-4 w-full py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-bold active:scale-95 transition-all text-sm">+30s</button>
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default ActiveSession;
