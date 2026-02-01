
import React from 'react';
import { Icon } from '../../ui/Icon';

const ExerciseListPreview = ({ exercises, limit = 3 }) => {
    if (!exercises || exercises.length === 0) {
        return (
            <div className="text-center py-4 text-slate-500">
                <p>No hay ejercicios en esta rutina.</p>
            </div>
        );
    }

    const visibleExercises = exercises.slice(0, limit);

    return (
        <ul className="space-y-3 text-sm">
            {visibleExercises.map((ex, index) => (
                <li key={index} className="flex items-center gap-3 text-slate-300">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700/50 border border-slate-600/50 text-teal-400 font-bold text-xs">
                        {index + 1}
                    </span>
                    <span className="font-semibold flex-grow">{ex.name || ex.nombre}</span>
                    <span className="font-mono text-slate-400 text-xs px-2 py-1 bg-slate-900/50 rounded-md">
                        {ex.sets || ex.series}x{ex.reps || ex.repeticiones}
                    </span>
                </li>
            ))}
            {exercises.length > limit && (
                <li className="flex items-center gap-3 text-slate-500 pt-2">
                    <Icon name="plus" className="w-6 h-6" />
                    <span className="font-medium">y {exercises.length - limit} más...</span>
                </li>
            )}
        </ul>
    );
};

export default ExerciseListPreview;
