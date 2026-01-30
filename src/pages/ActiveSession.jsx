import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { formatRepsDisplay, formatLoadDisplay, cleanExerciseTitle, calculateSmartRest } from '../utils/helpers';
import RestScreen from '../components/features/training/RestScreen'; // <-- IMPORTAR NUEVO COMPONENTE

const ActiveSession = ({ lang, profile, onSessionComplete }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { routine: initialRoutine } = location.state || {};
    
    const [routine, setRoutine] = useState(initialRoutine);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [sessionData, setSessionData] = useState({});

    // --- ESTADOS NUEVOS PARA EL DESCANSO ---
    const [isResting, setIsResting] = useState(false);
    const [restDuration, setRestDuration] = useState(0);
    // -------------------------------------

    useEffect(() => {
        if (!routine) navigate('/');
    }, [routine, navigate]);

    const currentExercise = routine?.rutinaPrincipal?.[currentExerciseIndex];
    const nextExercise = routine?.rutinaPrincipal?.[currentExerciseIndex + 1];

    const handleSetComplete = (setIndex, isChecked) => {
        const updatedRoutine = { ...routine };
        const exerciseToUpdate = updatedRoutine.rutinaPrincipal[currentExerciseIndex];
        const setToUpdate = exerciseToUpdate.componentes[setIndex];
        setToUpdate.completado = isChecked;

        setRoutine(updatedRoutine);

        const allSetsCompleted = exerciseToUpdate.componentes.every(s => s.completado);

        // --- LÓGICA DE DESCANSO ---
        if (allSetsCompleted && nextExercise) {
            const smartRest = calculateSmartRest(profile, nextExercise);
            setRestDuration(smartRest);
            setIsResting(true);
        }
    };

    const handleRestFinished = useCallback(() => {
        setIsResting(false);
        if (nextExercise) {
            setCurrentExerciseIndex(prev => prev + 1);
        }
    }, [nextExercise]);

    const navigateExercise = (direction) => {
        const newIndex = currentExerciseIndex + direction;
        if (newIndex >= 0 && newIndex < routine.rutinaPrincipal.length) {
            setCurrentExerciseIndex(newIndex);
        }
    };

    const handleEndSession = () => {
        const finalSessionData = { 
            ...sessionData, 
            routine, 
            completedAt: new Date().toISOString() 
        };
        if (onSessionComplete) {
            onSessionComplete(finalSessionData);
        }
        navigate('/');
    };

    if (!currentExercise) return <div className="p-4 bg-slate-900 min-h-screen">Cargando sesión...</div>;

    // --- RENDERIZAR PANTALLA DE DESCANSO ---
    if (isResting) {
        return <RestScreen 
            duration={restDuration}
            nextExercise={nextExercise}
            onFinish={handleRestFinished}
            lang={lang}
        />
    }

    const isSuperset = currentExercise.tipo_bloque === 'superserie';
    const titleParts = currentExercise.ejercicio.split('+');
    const titleA = cleanExerciseTitle(titleParts[0]);
    const titleB = isSuperset ? cleanExerciseTitle(titleParts[1]) : null;

    return (
        <>
            <div className="min-h-screen bg-slate-900 text-white p-4 animate-fadeIn pb-32">
                <header className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="p-2"><Icon name="arrowLeft" className="w-6 h-6" /></button>
                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-400 uppercase">EJERCICIO {currentExerciseIndex + 1} DE {routine.rutinaPrincipal.length}</p>
                    </div>
                    <div className="w-8"></div>
                </header>
                
                <div className="w-full bg-slate-800/50 rounded-full h-1.5 mb-6">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${((currentExerciseIndex + 1) / routine.rutinaPrincipal.length) * 100}%` }}></div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">{titleA}</h2>
                        <a href="#" className="text-red-500"><Icon name="youtube" className="w-6 h-6"/></a>
                    </div>
                    {isSuperset && (
                        <>
                            <div className="my-3 flex items-center justify-center gap-2 text-slate-500">
                               <div className="h-px w-full bg-slate-700"></div>
                               <Icon name="link" className="w-4 h-4 shrink-0"/>
                               <div className="h-px w-full bg-slate-700"></div>
                            </div>
                            <div className="flex items-center justify-between">
                               <h2 className="text-lg font-bold text-white">{titleB}</h2>
                               <a href="#" className="text-red-500"><Icon name="youtube" className="w-6 h-6"/></a>
                            </div>
                        </>
                    )}
                </div>

                <table className="w-full text-center mb-6">
                    <thead>
                        <tr className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                            <th className="pb-2">#</th>
                            <th className="pb-2">{isSuperset ? "REPS A" : "REPS"}</th>
                            <th className="pb-2">{isSuperset ? "KG A" : "KG"}</th>
                            {isSuperset && <th className="pb-2">REPS B</th>}
                            {isSuperset && <th className="pb-2">KG B</th>}
                            <th className="pb-2"><Icon name="checkCircle" className="w-5 h-5 mx-auto" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentExercise.componentes.map((set, i) => (
                            <tr key={i} className={`border-t border-slate-800 ${set.completado ? 'text-slate-500' : ''}`}>
                                <td className="py-4 font-bold text-slate-500">{i + 1}</td>
                                <td><div className={`w-16 mx-auto py-2 rounded-lg font-bold text-lg ${set.completado ? 'bg-slate-800' : 'bg-slate-700'}`}>{formatRepsDisplay(set.repeticiones_ejercicioA || set.repeticiones_ejercicio)}</div></td>
                                <td><div className={`w-20 mx-auto py-2 rounded-lg font-bold text-lg ${set.completado ? 'bg-slate-800' : 'bg-slate-700'}`}>{formatLoadDisplay(set.carga_sugeridaA || set.carga_sugerida)}</div></td>
                                {isSuperset && <td><div className={`w-16 mx-auto py-2 rounded-lg font-bold text-lg ${set.completado ? 'bg-slate-800' : 'bg-slate-700'}`}>{formatRepsDisplay(set.repeticiones_ejercicioB)}</div></td>}
                                {isSuperset && <td><div className={`w-20 mx-auto py-2 rounded-lg font-bold text-lg ${set.completado ? 'bg-slate-800' : 'bg-slate-700'}`}>{formatLoadDisplay(set.carga_sugeridaB)}</div></td>}
                                <td>
                                    <button onClick={() => handleSetComplete(i, !set.completado)} className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-all ${set.completado ? 'bg-teal-500 text-white' : 'border-2 border-slate-600 text-slate-600'}`}>
                                        <Icon name="check" className="w-6 h-6" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/60 z-50">
                <div className="max-w-md mx-auto p-4 flex justify-between items-center">
                    <button onClick={() => navigateExercise(-1)} disabled={currentExerciseIndex === 0} className="p-2 disabled:opacity-30 transition-opacity"><Icon name="arrowLeftCircle" className="w-9 h-9" /></button>
                    <button onClick={handleEndSession} className="bg-red-600 hover:bg-red-700 transition-colors text-white font-bold py-3 px-8 rounded-full uppercase text-sm tracking-wider">Finalizar</button>
                    <button onClick={() => navigateExercise(1)} disabled={currentExerciseIndex >= routine.rutinaPrincipal.length - 1} className="p-2 disabled:opacity-30 transition-opacity"><Icon name="arrowRightCircle" className="w-9 h-9" /></button>
                </div>
            </div>
        </>
    );
};

export default ActiveSession;
