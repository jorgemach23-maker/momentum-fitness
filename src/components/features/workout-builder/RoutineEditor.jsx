import React, { useState, useEffect } from 'react';
import { Icon } from '../../ui/Icon';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ExerciseCatalog } from './ExerciseCatalog';
import { normalizeRoutine } from '../../../utils/helpers'; // Para asegurar formato limpio al editar

export const RoutineEditor = ({ onClose, setHistory, setActiveTab, routinesColRef, initialRoutine = null }) => {
    const [title, setTitle] = useState('');
    const [exercises, setExercises] = useState([]);
    const [showCatalog, setShowCatalog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Si recibimos una rutina para editar, cargamos sus datos iniciales
    useEffect(() => {
        if (initialRoutine) {
            const normalized = normalizeRoutine(initialRoutine);
            setTitle(normalized.diaEnfoque || '');
            
            // Reconstruir la estructura visual del editor basada en la rutina plana
            const loadedExercises = (normalized.rutinaPrincipal || []).map(ex => {
                // Si la rutina se guardó previamente con 'detalles_sets', los usamos
                let sets = ex.detalles_sets || [];
                
                // Si no (ej: rutina generada por IA), reconstruimos los sets básicos
                if (sets.length === 0) {
                    const numSeries = ex.series || 3;
                    sets = Array.from({ length: numSeries }).map((_, i) => ({
                        id: `${ex.ejercicio}-${i}-${Date.now()}`,
                        reps: ex.reps_target?.toString() || '',
                        load: ex.peso_valor?.toString() || '0',
                        completed: false
                    }));
                }

                return {
                    id: `edit-${Date.now()}-${Math.random()}`,
                    ejercicio: ex.ejercicio,
                    restTime: ex.descanso_segs || 90,
                    sets: sets
                };
            });

            setExercises(loadedExercises);
        }
    }, [initialRoutine]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const addExercise = (name) => {
        setExercises([...exercises, {
            id: Date.now().toString(),
            ejercicio: name,
            restTime: 90, 
            sets: [
                { id: Date.now() + '-1', reps: '', load: '', completed: false }
            ]
        }]);
        setShowCatalog(false);
    };

    const removeExercise = (exId) => setExercises(exercises.filter(ex => ex.id !== exId));

    const addSet = (exId) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exId) {
                const lastSet = ex.sets[ex.sets.length - 1];
                return {
                    ...ex,
                    sets: [...ex.sets, { id: Date.now().toString(), reps: lastSet ? lastSet.reps : '', load: lastSet ? lastSet.load : '', completed: false }]
                };
            }
            return ex;
        }));
    };

    const removeSet = (exId, setId) => {
         setExercises(exercises.map(ex => {
            if (ex.id === exId) return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
            return ex;
        }));
    };

    const updateSet = (exId, setId, field, value) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exId) return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) };
            return ex;
        }));
    };

    const updateExerciseRestTime = (exId, change) => {
        setExercises(exercises.map(ex => {
            if (ex.id === exId) return { ...ex, restTime: Math.max(0, ex.restTime + change) };
            return ex;
        }));
    };

    const handleSave = async () => {
        if (!title.trim()) { alert("Por favor, añade un nombre a la rutina."); return; }
        if (exercises.length === 0) { alert("Por favor, añade al menos un ejercicio."); return; }
        if (!routinesColRef) { alert("Error: No hay conexión con la base de datos."); return; }

        setIsSaving(true);
        try {
            const flatRoutine = exercises.map(ex => {
                const targetSet = ex.sets[0] || {}; 
                return {
                    ejercicio: ex.ejercicio,
                    fase_sesion: 'main',
                    estructura_visual: 'single',
                    series: ex.sets.length,
                    reps_target: parseInt(targetSet.reps) || 0,
                    reps_texto: targetSet.reps || "--",
                    peso_valor: parseFloat(targetSet.load) || 0,
                    peso_unidad: 'kg',
                    descanso_segs: ex.restTime, 
                    detalles_sets: ex.sets 
                };
            });

            const routineDataToSave = {
                diaEnfoque: title,
                type: 'custom', 
                status: 'pending',
                rutinaPrincipal: flatRoutine,
                // Si estamos editando, conservamos la fecha de creación original
                createdAt: initialRoutine ? initialRoutine.createdAt : serverTimestamp()
            };

            // Si es edición, usamos el ID original. Si es nueva, creamos docRef nuevo.
            const docRef = initialRoutine && initialRoutine.id 
                ? doc(routinesColRef, initialRoutine.id) 
                : doc(routinesColRef);
            
            await setDoc(docRef, routineDataToSave, { merge: true }); // Merge para no borrar otros campos útiles
            
            // Actualizar UI Local
            const newRoutineForState = { 
                ...routineDataToSave, 
                id: docRef.id, 
                // Aseguramos que tenga un formato de fecha válido para UI
                createdAt: initialRoutine?.createdAt || { seconds: Math.floor(Date.now() / 1000) } 
            };
            
            if (typeof setHistory === 'function') {
                setHistory(prev => {
                    if (initialRoutine) {
                        // Reemplazar la existente
                        return prev.map(r => r.id === initialRoutine.id ? newRoutineForState : r);
                    } else {
                        // Añadir la nueva arriba
                        return [newRoutineForState, ...prev];
                    }
                });
            }
            
            onClose();

        } catch (error) {
            console.error("Error guardando rutina:", error);
            alert("Hubo un error al guardar: " + error.message);
        } finally {
            setIsSaving(false); 
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900 flex flex-col animate-slideUp">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                <button onClick={onClose} disabled={isSaving} className="text-slate-400 hover:text-white font-medium px-2 py-1">Cancelar</button>
                <div className="font-black text-white tracking-wide uppercase text-sm">
                    {initialRoutine ? 'Editar Rutina' : 'Nueva Rutina'}
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="text-teal-400 font-bold px-4 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    {isSaving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : 'Guardar'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-32 minimal-scrollbar">
                <div className="mb-6">
                    <input type="text" placeholder="Ej: Día de Pierna Pesado" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border-b-2 border-slate-700 text-3xl font-black text-white px-2 py-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-700 transition-colors" />
                </div>

                <div className="space-y-6">
                    {exercises.map((exercise, exIndex) => (
                        <div key={exercise.id} className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-3 bg-slate-800/80 border-b border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">{exIndex + 1}</span>
                                    <h3 className="font-bold text-white truncate max-w-[200px] xs:max-w-[250px]">{exercise.ejercicio}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => removeExercise(exercise.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Icon name="close" className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-900/30 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <div className="col-span-2 text-center">Set</div>
                                <div className="col-span-4 text-center">KG</div>
                                <div className="col-span-4 text-center">Reps</div>
                                <div className="col-span-2"></div>
                            </div>

                            <div className="p-2 space-y-1.5">
                                {exercise.sets.map((set, setIndex) => (
                                    <div key={set.id} className="group relative">
                                        <div className="grid grid-cols-12 gap-2 items-center px-1 py-1 rounded-lg hover:bg-slate-800/50 transition-colors">
                                            <div className="col-span-2 text-center font-bold text-slate-400">{setIndex + 1}</div>
                                            <div className="col-span-4 relative"><input type="number" value={set.load} onChange={(e) => updateSet(exercise.id, set.id, 'load', e.target.value)} placeholder="0" className="w-full bg-slate-900 text-white text-center py-2.5 rounded-lg border border-slate-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none placeholder:text-slate-700 font-mono text-lg transition-all" /></div>
                                            <div className="col-span-4 relative"><input type="number" value={set.reps} onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)} placeholder="0" className="w-full bg-slate-900 text-white text-center py-2.5 rounded-lg border border-slate-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none placeholder:text-slate-700 font-mono text-lg transition-all" /></div>
                                            <div className="col-span-2 flex justify-center">{exercise.sets.length > 1 && <button onClick={() => removeSet(exercise.id, set.id)} className="p-2 text-slate-600 hover:text-red-400 bg-slate-900/50 rounded-lg transition-colors"><Icon name="minus" className="w-4 h-4" /></button>}</div>
                                        </div>
                                        {setIndex < exercise.sets.length - 1 && <div className="flex items-center justify-center my-1.5 opacity-50"><div className="h-px bg-slate-700 w-1/4"></div><div className="px-2 text-[9px] font-mono text-slate-500 flex items-center gap-1"><Icon name="timer" className="w-3 h-3" /> {formatTime(exercise.restTime)}</div><div className="h-px bg-slate-700 w-1/4"></div></div>}
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 border-t border-slate-800 bg-slate-900/20 flex flex-col gap-3">
                                <button onClick={() => addSet(exercise.id)} className="w-full py-2.5 rounded-lg border border-dashed border-slate-600 text-slate-400 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 hover:text-white transition-colors flex justify-center items-center gap-2"><Icon name="plus" className="w-4 h-4" /> Añadir Set</button>
                                <div className="flex items-center justify-between bg-slate-900 border border-slate-700/50 rounded-xl p-1.5 pl-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Icon name="timer" className="w-4 h-4 text-indigo-400" /> Descanso</span>
                                    <div className="flex items-center bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                        <button onClick={() => updateExerciseRestTime(exercise.id, -15)} className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition-colors"><Icon name="minus" className="w-4 h-4" /></button>
                                        <div className="w-16 text-center font-mono font-bold text-white text-sm cursor-default">{formatTime(exercise.restTime)}</div>
                                        <button onClick={() => updateExerciseRestTime(exercise.id, 15)} className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition-colors"><Icon name="plus" className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={() => setShowCatalog(true)} className="w-full mt-6 py-5 rounded-2xl bg-indigo-600/20 border-2 border-dashed border-indigo-500/30 text-indigo-400 font-black uppercase tracking-widest hover:bg-indigo-600/30 hover:border-indigo-500/60 transition-all flex flex-col justify-center items-center gap-2"><Icon name="plus" className="w-6 h-6 mb-1" /> Agregar Ejercicio</button>
            </div>
            {showCatalog && <ExerciseCatalog onSelect={addExercise} onClose={() => setShowCatalog(false)} />}
        </div>
    );
};