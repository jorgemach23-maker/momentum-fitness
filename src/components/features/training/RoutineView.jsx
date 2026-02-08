import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { cleanExerciseTitle, formatRoutineTitle, isWarmupOrCooldown } from '../../../utils/helpers';

/**
 * Parsea un objeto de ejercicio de tipo superserie y devuelve las dos partes.
 * @param {object} exercise - El objeto de ejercicio.
 * @returns {{partA: string, partB: string}} Las dos partes del ejercicio.
 */
const parseSupersetExercises = (exercise) => {
    if (exercise.ejercicioA && exercise.ejercicioB) {
        return {
            partA: cleanExerciseTitle(exercise.ejercicioA),
            partB: cleanExerciseTitle(exercise.ejercicioB)
        };
    }
    const parts = exercise.ejercicio
        .split(/\s*\+\s*|\s+y\s+/i)
        .map(p => cleanExerciseTitle(p.replace(/[A-Z][12][:.)\s]*/gi, '').trim()))
        .filter(Boolean);
    return {
        partA: parts[0] || "Ejercicio A",
        partB: parts[1] || "Ejercicio B"
    };
};

const RoutineView = ({ routine, onStart, onAdjust, lang, isProcessing, profile }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const t = {
        es: { suggestion: 'SUGERENCIA', adjust: 'Ajustar', start: 'Comenzar Sesión', more: 'ejercicios más' },
        en: { suggestion: 'SUGGESTION', adjust: 'Adjust', start: 'Start Session', more: 'more exercises' }
    }[lang || 'es'];

    if (!routine || !routine.rutinaPrincipal) return null;

    // LÓGICA DE FILTRADO DEFINITIVA: Excluir bloques de calentamiento o enfriamiento usando helper centralizado.
    // Se asegura que routine.rutinaPrincipal sea un array antes de filtrar.
    const mainExercises = (routine.rutinaPrincipal || []).filter(exercise => !isWarmupOrCooldown(exercise));

    const displayedExercises = isExpanded ? mainExercises : mainExercises.slice(0, 3);
    const hiddenCount = Math.max(0, mainExercises.length - displayedExercises.length);

    let supersetCounter = 0;

    // Calcular duración robusta
    const getDuration = () => {
        if (routine.duracionEstimada) return routine.duracionEstimada;
        if (profile?.timeAvailable) return `${profile.timeAvailable} min`;
        return '45 min';
    };

    const duration = getDuration();

    const renderExercise = (exercise, index) => {
        const tipo_bloque = (exercise.bloque || exercise.tipo_bloque || "").toLowerCase();
        const isSuperset = tipo_bloque.includes('superserie');
        
        if (isSuperset) {
            const letter = String.fromCharCode(65 + supersetCounter);
            supersetCounter++; 
            const { partA, partB } = parseSupersetExercises(exercise);

            return (
                <div key={index} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-slate-500 mt-0.5">{index + 1}</span>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-cyan-500 text-cyan-950 px-1.5 py-0.5 rounded-md w-8 text-center">{`${letter}1`}</span>
                                <p className="text-sm font-semibold text-white leading-tight">{partA}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-blue-500 text-blue-950 px-1.5 py-0.5 rounded-md w-8 text-center">{`${letter}2`}</span>
                                <p className="text-sm font-semibold text-white leading-tight">{partB}</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div key={index} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <span className="text-xs font-bold text-slate-500">{index + 1}</span>
                    <p className="text-sm font-semibold text-white flex-1 truncate">{cleanExerciseTitle(exercise.ejercicio)}</p>
                </div>
            );
        }
    };

    return (
        <div className="bg-slate-900 rounded-2xl shadow-lg p-4 animate-fadeIn w-full max-w-md mx-auto">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-teal-500/10 text-teal-400 text-[10px] font-bold uppercase px-2 py-1 rounded">{t.suggestion}</span>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <Icon name="timer" className="w-3.5 h-3.5" />
                            <span>{duration}</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-white">{formatRoutineTitle(routine.diaEnfoque)}</h2>
                </div>
                <button onClick={onAdjust} className="p-2.5 bg-slate-800 rounded-full text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors">
                    <Icon name="settings" className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-2 mb-4">
                {mainExercises.length > 0 ? (
                    displayedExercises.map(renderExercise)
                ) : (
                     <div className="text-center py-4 text-slate-500 italic text-sm">
                        <p>No hay ejercicios principales asignados.</p>
                    </div>
                )}
            </div>

            {hiddenCount > 0 && (
                <button onClick={() => setIsExpanded(true)} className="w-full text-center text-xs font-bold text-slate-400 py-2 mb-4 hover:text-white transition-colors">
                    + {hiddenCount} {t.more}
                </button>
            )}

            <button onClick={onStart} disabled={isProcessing} className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-teal-400 transition-all disabled:bg-slate-600 disabled:opacity-50">
                {isProcessing ? <Icon name="loader" className="w-5 h-5 animate-spin" /> : <Icon name="play" className="w-5 h-5" />}
                {t.start}
            </button>
        </div>
    );
};

export default RoutineView;
