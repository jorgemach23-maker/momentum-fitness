import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/LayoutComponents';
import { RoutineEditor } from './workout-builder/RoutineEditor';
import { ExerciseListPreview } from './training/TrainingUI';
import { formatRoutineTitle, normalizeRoutine } from '../../utils/helpers';

export default function WorkoutBuilderTab({ t, history, setHistory, routinesColRef, userId, isAuthReady, setActiveTab, onRepeatSession }) {
    const [isEditing, setIsEditing] = useState(false);

    // Filtrar solo las rutinas creadas manualmente (las marcaremos con type: 'custom')
    const customRoutines = useMemo(() => {
        return history
            .filter(r => r.type === 'custom')
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [history]);

    if (isEditing) {
        return (
            <RoutineEditor 
                t={t} 
                onClose={() => setIsEditing(false)} 
                routinesColRef={routinesColRef} // <-- Asegurado
                userId={userId} // <-- Añadido por si acaso, aunque routinesColRef debería bastar
                setHistory={setHistory} // <-- Para actualizar la UI sin recargar
                setActiveTab={setActiveTab}
            />
        );
    }

    return (
        <div className="animate-fadeIn pb-24">
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Icon name="plus" className="w-5 h-5 text-indigo-400" /> 
                {t.createWorkout || 'Creador de Rutinas'}
            </h2>

            {/* SECCIÓN 1: CREAR NUEVA RUTINA */}
            <Card 
                className="p-6 mb-8 cursor-pointer group hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden"
                onClick={() => setIsEditing(true)}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-col items-center justify-center text-center relative z-10 py-4">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Icon name="plus" className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t.buildNewWorkout || 'Crear Nueva Rutina'}</h3>
                    <p className="text-sm text-slate-400">Diseña tu sesión perfecta desde cero.</p>
                </div>
            </Card>

            {/* SECCIÓN 2: MIS RUTINAS CREADAS */}
            <div className="mt-8">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-4 flex items-center gap-2">
                    <Icon name="layers" className="w-4 h-4" />
                    {t.myWorkouts || 'Mis Rutinas'}
                </h3>

                {customRoutines.length > 0 ? (
                    <div className="space-y-4">
                        {customRoutines.map(routine => {
                            const normalized = normalizeRoutine(routine);
                            const title = formatRoutineTitle(normalized.diaEnfoque);

                            return (
                                <Card key={routine.id} className="p-0 overflow-hidden border-slate-700/50">
                                    <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-lg font-bold text-white">{title}</h4>
                                            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md font-medium border border-indigo-500/20">
                                                Personalizada
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-900/40">
                                        <ExerciseListPreview routineData={routine} limit={3} />
                                    </div>

                                    <div className="flex px-4 py-3 bg-slate-800/50 gap-3">
                                        <button 
                                            onClick={() => onRepeatSession(routine)}
                                            className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-sm transition-colors"
                                        >
                                            <Icon name="play" className="w-4 h-4" />
                                            Iniciar
                                        </button>
                                        <button 
                                            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center"
                                            title="Editar (Próximamente)"
                                        >
                                            <Icon name="settings" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                        <Icon name="database" className="w-10 h-10 mx-auto mb-3 text-slate-600"/>
                        <p className="text-slate-500 font-medium text-sm">Aún no has creado rutinas personalizadas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
