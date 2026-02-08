
import React from 'react';
import { Icon } from '../../ui/Icon';
import { isWarmupOrCooldown } from '../../../utils/helpers';

const ExerciseListPreview = ({ exercises, limit = 3 }) => {
    if (!exercises || exercises.length === 0) {
        return (
            <div className="text-center py-4 text-slate-500">
                <p>No hay ejercicios en esta rutina.</p>
            </div>
        );
    }

    // LÓGICA DE FILTRADO: Excluir calentamiento/enfriamiento
    const mainExercises = exercises.filter(ex => !isWarmupOrCooldown(ex));

    if (mainExercises.length === 0 && exercises.length > 0) {
         return (
            <div className="text-center py-4 text-slate-500">
                <p>Solo calentamiento/enfriamiento disponible.</p>
            </div>
        );
    }

    const visibleExercises = mainExercises.slice(0, limit);

    return (
        <ul className="space-y-3 text-sm">
            {visibleExercises.map((ex, index) => (
                <li key={index} className="flex items-center gap-3 text-slate-300">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700/50 border border-slate-600/50 text-teal-400 font-bold text-xs">
                        {index + 1}
                    </span>
                    <span className="font-semibold flex-grow">{ex.name || ex.nombre || ex.ejercicio}</span>
                    <span className="font-mono text-slate-400 text-xs px-2 py-1 bg-slate-900/50 rounded-md">
                        {ex.sets || ex.series}x{ex.reps || ex.repeticiones}
                    </span>
                </li>
            ))}
            {mainExercises.length > limit && (
                <li className="flex items-center gap-3 text-slate-500 pt-2">
                    <Icon name="plus" className="w-6 h-6" />
                    <span className="font-medium">y {mainExercises.length - limit} más...</span>
                </li>
            )}
        </ul>
    );
};

export default ExerciseListPreview;
