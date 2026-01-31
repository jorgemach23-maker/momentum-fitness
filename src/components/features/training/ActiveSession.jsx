import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { 
    TRANSLATIONS, 
    cleanExerciseTitle, 
    formatRepsDisplay, 
    formatLoadDisplay,
    formatDuration
} from '../../../utils/helpers.js';

// Componente unificado para manejar la carga. Es "inteligente" gracias a la lógica de parseo y formato.
const AdjustableLoad = ({ initialLoad, onUpdate, isSuperset = false }) => {
    // Si initialLoad es null (fallo de IA), lo tratamos como 0 para el estado interno,
    // pero la visualización será "0 kg" gracias a formatLoadDisplay.
    const [load, setLoad] = useState(initialLoad === null ? 0 : initialLoad);
    const [isInteracting, setIsInteracting] = useState(false);
    const lastUpdateY = useRef(0);

    useEffect(() => {
        setLoad(initialLoad === null ? 0 : initialLoad);
    }, [initialLoad]);

    const handleTouchStart = (e) => {
        lastUpdateY.current = e.touches[0].clientY;
        setIsInteracting(true);
    };

    const handleTouchMove = (e) => {
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
    
    // Usamos el initialLoad original para la visualización, así formatLoadDisplay puede diferenciar entre 0 y null.
    const displayValue = formatLoadDisplay(initialLoad);
    const isBw = initialLoad === 0;
    const sizeClass = isSuperset ? "text-lg" : "text-2xl";

    return (
        <div 
            onTouchStart={handleTouchStart} 
            onTouchMove={handleTouchMove} 
            onTouchEnd={() => setIsInteracting(false)} 
            style={{ touchAction: 'none' }} 
            className={`relative flex flex-col items-center justify-center h-14 rounded-xl border transition-all duration-200 cursor-ns-resize ${isInteracting ? 'bg-teal-900/40 border-teal-500/50 scale-105 shadow-[0_0_20px_rgba(20,184,166,0.2)] z-10' : (isBw ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-800/50 border-slate-700/50')}`}>
            {isInteracting && <Icon name="chevronUp" className="w-3 h-3 text-teal-400 absolute top-1 animate-pulse" />}
            <span className={`${sizeClass} font-black leading-none tabular-nums ${isBw ? 'text-slate-500 uppercase tracking-tighter' : 'text-teal-400'}`}>
                {displayValue}
            </span>
            {isInteracting && <Icon name="chevronDown" className="w-3 h-3 text-teal-400 absolute bottom-1 animate-pulse" />}
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
    sessionSeconds,
    onBack,
    title
}) => {
    const routineId = routine.id;
    const t = TRANSLATIONS?.[lang || 'es'] || TRANSLATIONS?.['es'] || {};
    const [phase, setPhase] = useState('warmup');
    const [idx, setIdx] = useState(0);
    const [completedSets, setCompletedSets] = useState({});
    const [currentLoads, setCurrentLoads] = useState({});
    
    const isResting = restSeconds > 0;

    const rawExercises = routine.rutinaPrincipal || [];
    const exercises = rawExercises.filter(e => !/calentamiento|warm.?up/i.test(e.ejercicio));
    const activeExercise = phase === 'workout' ? exercises[idx] : null;

    const detectSuperset = (ex) => {
        if (!ex) return false;
        const bloqueType = (ex.bloque || ex.tipo_bloque || "").toLowerCase();
        return bloqueType.includes('superserie') || 
               /\+|\s+y\s+|\/|A1.*A2/i.test(ex.ejercicio) ||
               /[A-Z]2[:\s]/i.test(ex.ejercicio);
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
        
        let rawParts = title.split(/[\+\/]/);
        
        // Estrategia robusta idéntica a RoutineView para fallback
        if (/[A-Z]2[:\s]/i.test(title)) {
             const match = title.match(/[\+\s]*([A-Z]2[:\s].*)/i);
             if (match) {
                 const part2 = match[1];
                 const part1 = title.replace(match[0], '').trim();
                 rawParts = [part1, part2];
             }
        }
        else if (rawParts.length < 2) {
            const a1a2Match = title.match(/A1[:\s]*(.+?)\s*A2[:\s]*(.+)/i);
            if (a1a2Match) rawParts = [a1a2Match[1], a1a2Match[2]];
        }
        else if (rawParts.length < 2) {
            const yMatch = title.match(/(.*?)\s+\by\b\s+(.*)/i);
            if (yMatch) rawParts = [yMatch[1], yMatch[2]];
        }

        const parts = rawParts.map(p => {
             if (!p) return "";
             return cleanExerciseTitle(p.replace(/[A-Z][12][:.)\s]*/gi, '').replace(/^[\+\/]\s*/, '').trim());
        }).filter(p => p.length > 0);
        
        return [
            parts[0] || "Ejercicio A",
            parts[1] || "Ejercicio B"
        ];
    };

    // Prioridad a campos explícitos si existen (Solución de Raíz)
    const [partA, partB] = isSuperset 
        ? (activeExercise.ejercicioA && activeExercise.ejercicioB 
            ? [activeExercise.ejercicioA, activeExercise.ejercicioB]
            : getExerciseParts(activeExercise?.ejercicio))
        : [cleanExerciseTitle(activeExercise?.ejercicio), null];

    useEffect(() => {
        if (!activeExercise) return;
        const initialLoads = {};
        
        const isBodyweightByName = (name) => 
            /burpee|salto|jump|plank|flexion|push.?up|dominada|pull.?up|crunch|abdominal|mountain|climber|silla|air|calistenia|fondos/i.test(name || "");

        // Lógica de parseo robusta para manejar los 3 casos.
        const parseLoad = (val, exerciseName) => {
            if (typeof val === 'string' && val.toUpperCase() === 'BW') {
                return 0; // Caso 1: Peso corporal explícito.
            }
            const num = parseFloat(val);
            if (!isNaN(num)) {
                return num; // Caso 2: Carga numérica válida.
            }
            if (isBodyweightByName(exerciseName)) {
                return 0; // Caso 3: Peso corporal implícito por nombre.
            }
            // Caso 4: Fallo de la IA (null, undefined, etc.). Se devuelve null
            // para que formatLoadDisplay() lo muestre como "0 kg".
            return null;
        };

        (activeExercise.componentes || []).forEach((set, setIdx) => {
            initialLoads[`${idx}-${setIdx}-A`] = parseLoad(set.carga_sugeridaA ?? set.carga_sugerida, partA);
            if (isSuperset) {
                initialLoads[`${idx}-${setIdx}-B`] = parseLoad(set.carga_sugeridaB, partB);
            }
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
            const finalLoadA = loadA === null ? 0 : loadA; // Guardamos 0 si fue un fallo de IA

            const setData = { completed: true, ejercicio: activeExercise.ejercicio, load: finalLoadA, reps: setInfo.repeticiones_ejercicioA ?? setInfo.repeticiones_ejercicio };
            if (isSuperset) { 
                const loadB = currentLoads[`${idx}-${setIndex}-B`];
                const finalLoadB = loadB === null ? 0 : loadB;
                setData.loadB = finalLoadB; 
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
        if (phase === 'warmup') setPhase('workout');
        else if (phase === 'cooldown') onRoutineFeedback?.(routineId, { sets: completedSets }, "", "completed");
        else if (idx < exercises.length - 1) { setIdx(prev => prev + 1); }
        else setPhase('cooldown');
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
        <div className="h-screen w-full bg-slate-900 flex flex-col overflow-hidden relative selection:bg-teal-500/30">
            {/* Header Fijo */}
            <header className="shrink-0 p-4 pt-6 bg-slate-900/80 backdrop-blur-md z-30 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors active:scale-90">
                        <Icon name="arrowLeft" className="w-6 h-6" />
                    </button>
                    <h1 className="text-xs font-black text-slate-100 uppercase tracking-[0.2em]">{title}</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">
                    <span>{phase === 'warmup' ? t.warmupTitle : phase === 'cooldown' ? t.cooldownTitle : `Ejercicio ${idx + 1} de ${exercises.length}`}</span>
                    <span>{`${Math.round(progressPercent)}%`}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(20,184,166,0.4)]" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </header>

            {/* Área de Contenido */}
            <div className="flex-1 overflow-y-auto px-4 pb-40 minimal-scrollbar animate-fadeIn pt-4">
                {phase === 'workout' && activeExercise ? (
                    <div className="flex flex-col space-y-4">
                        <div className="relative">
                            {isSuperset ? (
                                <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-4 space-y-4 shadow-xl">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-black text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-500/20 mb-1 inline-block uppercase">{currentLetter}1</span>
                                            <h3 className="text-xl font-black text-white leading-tight break-words">{partA}</h3>
                                        </div>
                                        <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${partA}+tecnica`, '_blank')} className="shrink-0 p-2 rounded-xl bg-slate-700 text-red-500 active:scale-95 transition-transform shadow-lg"><Icon name="youtube" className="w-5 h-5" /></button>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 opacity-30"><div className="h-px flex-1 bg-slate-600"></div><Icon name="link2" className="w-3 h-3 text-slate-500"/><div className="h-px flex-1 bg-slate-600"></div></div>
                                    {partB && (
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-black text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20 mb-1 inline-block uppercase">{currentLetter}2</span>
                                                <h3 className="text-xl font-black text-white leading-tight break-words">{partB}</h3>
                                            </div>
                                            <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${partB}+tecnica`, '_blank')} className="shrink-0 p-2 rounded-xl bg-slate-700 text-red-500 active:scale-95 transition-transform shadow-lg"><Icon name="youtube" className="w-5 h-5" /></button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex justify-between items-start pt-2 bg-slate-800/20 p-4 rounded-3xl border border-slate-700/30">
                                    <h2 className="text-3xl font-black text-white leading-[1.1] break-words flex-1 pr-4">{partA}</h2>
                                    <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${partA}+tecnica`, '_blank')} className="shrink-0 p-3 rounded-2xl bg-slate-800 text-red-500 border border-slate-700 shadow-xl active:scale-95 transition-all"><Icon name="youtube" className="w-6 h-6" /></button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col bg-slate-900/80 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                            <div className={`grid ${isSuperset ? 'grid-cols-[30px_1fr_1fr_1fr_1fr_50px]' : 'grid-cols-[40px_1fr_1fr_60px]'} gap-2 bg-slate-800/80 p-3 text-[9px] font-black uppercase text-center border-b border-slate-700 text-slate-500 tracking-tighter`}>
                                <span>#</span>
                                {isSuperset ? (<><span className="text-cyan-400">Reps A</span><span className="text-cyan-400">Kg A</span><span className="text-blue-400">Reps B</span><span className="text-blue-400">Kg B</span></>) : (<><span className="col-span-1">Repeticiones</span><span className="col-span-1">Carga</span></>)}
                                <Icon name="check" className="mx-auto w-4 h-4 opacity-30"/>
                            </div>
                            <div className="divide-y divide-slate-800/50">
                                {(activeExercise.componentes || []).map((set, setIdx) => {
                                    const isDone = completedSets[`${idx}-${setIdx}`]?.completed;
                                    const valA = currentLoads[`${idx}-${setIdx}-A`];
                                    const valB = currentLoads[`${idx}-${setIdx}-B`];
                                    return (
                                        <div key={setIdx} className={`grid ${isSuperset ? 'grid-cols-[30px_1fr_1fr_1fr_1fr_50px]' : 'grid-cols-[40px_1fr_1fr_60px]'} gap-2 items-center p-3 transition-colors ${isDone ? 'bg-teal-500/10' : ''}`}>
                                            <div className="text-xs font-black text-slate-600 tabular-nums">{set.numero_serie}</div>
                                            {isSuperset ? (
                                                <>
                                                    <div className="flex items-center justify-center h-14 bg-cyan-900/10 rounded-xl border border-cyan-900/20 text-xl font-black text-cyan-100 tabular-nums">{formatRepsDisplay(set.repeticiones_ejercicioA ?? set.repeticiones_ejercicio)}</div>
                                                    <AdjustableLoad initialLoad={valA} onUpdate={(nl) => handleLoadUpdate(idx, setIdx, 'A', nl)} isSuperset={true} />
                                                    <div className="flex items-center justify-center h-14 bg-blue-900/10 rounded-xl border border-blue-900/20 text-xl font-black text-blue-100 tabular-nums">{formatRepsDisplay(set.repeticiones_ejercicioB)}</div>
                                                    <AdjustableLoad initialLoad={valB} onUpdate={(nl) => handleLoadUpdate(idx, setIdx, 'B', nl)} isSuperset={true} />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-center h-14 bg-slate-800/50 rounded-xl border border-slate-700/50 text-2xl font-black text-white tabular-nums">{formatRepsDisplay(set.repeticiones_ejercicio)}</div>
                                                    <AdjustableLoad initialLoad={valA} onUpdate={(nl) => handleLoadUpdate(idx, setIdx, 'A', nl)} />
                                                </>
                                            )}
                                            <button onClick={() => toggleSetCompletion(setIdx)} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all border shadow-lg ${isDone ? 'bg-teal-500 text-white border-teal-400 shadow-teal-500/20 scale-90' : 'bg-slate-800 border-slate-700 text-slate-600 active:bg-slate-700'}`}><Icon name="check" className="w-6 h-6" /></button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <div className={`w-24 h-24 rounded-3xl ${phase === 'warmup' ? 'bg-orange-500/10 shadow-[0_0_40px_rgba(249,115,22,0.1)]' : 'bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.1)]'} flex items-center justify-center mb-6 animate-pulse`}><Icon name={phase === 'warmup' ? "flame" : "wind"} className={`w-12 h-12 ${phase === 'warmup' ? 'text-orange-500' : 'text-blue-400'}`}/></div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{phase === 'warmup' ? t.warmupTitle : t.cooldownTitle}</h2>
                        <div className="bg-slate-800/30 rounded-[2rem] border border-slate-700/50 p-8 mb-10 w-full backdrop-blur-sm">
                            <ul className="space-y-6 text-left">{formatWarmup(phase === 'warmup' ? (routine.calentamiento || t.warmupDesc) : (routine.enfriamiento || t.cooldownDesc))}</ul>
                        </div>
                        <button onClick={handleNext} className={`w-full py-5 ${phase === 'warmup' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-teal-500 shadow-teal-500/20'} text-white font-black rounded-3xl shadow-2xl active:scale-[0.98] transition-all text-sm tracking-[0.2em]`}>{phase === 'warmup' ? t.startMain : t.finishComplete}</button>
                    </div>
                )}
            </div>

            {/* Dock Flotante */}
            {!isResting && (
                <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
                    <div className="pointer-events-auto flex items-center bg-slate-900/50 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-full p-2.5 gap-4">
                        <div className="flex items-center gap-2 pl-2">
                            <button onClick={() => idx > 0 && setIdx(idx-1)} className="p-3 text-slate-500 hover:text-white rounded-full transition-colors active:scale-90"><Icon name="arrowLeft" className="w-5 h-5"/></button>
                            <button onClick={() => setIsSessionActive(!isSessionActive)} className={`p-4 rounded-full shadow-2xl transition-all active:scale-90 ${!isSessionActive ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'}`}><Icon name={!isSessionActive ? "play" : "pause"} className="w-6 h-6 fill-current"/></button>
                            <button onClick={handleNext} className={`p-3 rounded-full transition-colors active:scale-90 ${phase === 'cooldown' ? 'text-teal-400' : 'text-slate-500 hover:text-white'}`}><Icon name={phase === 'cooldown' ? 'check' : 'arrowRight'} className="w-5 h-5"/></button>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="flex items-center gap-2 pr-5 pl-1 font-mono font-black text-xl text-teal-400 tracking-tighter tabular-nums"><Icon name="timer" className="w-4 h-4 opacity-50" /><span>{formatDuration(sessionSeconds)}</span></div>
                    </div>
                </div>
            )}

            {/* Pantalla de Descanso */}
            {isResting && (
                <div className="absolute inset-0 z-[60] bg-slate-950/98 flex flex-col animate-fadeIn backdrop-blur-3xl p-6 text-center">
                     <div className="flex-1 flex flex-col items-center justify-center">
                         <div className="relative shrink-0 flex flex-col items-center mb-16">
                            <div className="absolute -inset-10 bg-teal-500 blur-[120px] opacity-20 animate-pulse rounded-full"></div>
                            <div className="text-[160px] font-black text-white tabular-nums leading-none tracking-tighter relative z-10">{String(restSeconds).padStart(2, '0')}</div>
                            <h3 className="text-sm font-black text-teal-400 uppercase tracking-[0.6em] animate-pulse mt-4">{t.restTimer || "DESCANSO"}</h3>
                         </div>
                         <div className="w-full max-w-sm shrink-0 space-y-4">
                             <button onClick={() => setRestSeconds(0)} className="w-full py-6 rounded-2xl bg-teal-600 text-white font-black flex items-center justify-center gap-3 text-lg shadow-[0_20px_40px_rgba(20,184,166,0.2)] active:scale-95 transition-all uppercase tracking-widest"><Icon name="play" className="w-6 h-6 fill-current"/> {t.letsGo || "CONTINUAR"}</button>
                             <button onClick={() => setRestSeconds(s => s + 30)} className="w-full py-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 font-black active:scale-95 transition-all text-sm tracking-widest">+30 SEGUNDOS</button>
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default ActiveSession;
