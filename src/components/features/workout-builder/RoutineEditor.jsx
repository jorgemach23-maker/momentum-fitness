import React, { useState, useEffect } from 'react';
import { Icon } from '../../ui/Icon';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ExerciseCatalog } from './ExerciseCatalog';
import { normalizeRoutine } from '../../../utils/helpers';

export const RoutineEditor = ({ onClose, setHistory, setActiveTab, routinesColRef, initialRoutine = null }) => {
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState([]);
    const [showCatalog, setShowCatalog] = useState(false);
    const [catalogTarget, setCatalogTarget] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialRoutine) {
            const normalized = normalizeRoutine(initialRoutine);
            setTitle(normalized.diaEnfoque || '');
            
            const loadedBlocks = [];
            (normalized.rutinaPrincipal || []).forEach(ex => {
                const isSuperset = ex.estructura_visual === 'superset' || (ex.tipo_bloque || '').includes('superserie');
                
                let parsedSets = ex.detalles_sets || [];
                
                // Reconstruir sets si no existen en el metadata
                if (parsedSets.length === 0) {
                    const numSeries = ex.series || 3;
                    if (isSuperset && ex.items && ex.items.length >= 2) {
                        parsedSets = Array.from({ length: numSeries }).map((_, i) => ({
                            id: `set-${Date.now()}-${i}`,
                            repsA: ex.items[0].reps_target?.toString() || '',
                            loadA: ex.items[0].peso_valor?.toString() || '0',
                            repsB: ex.items[1].reps_target?.toString() || '',
                            loadB: ex.items[1].peso_valor?.toString() || '0',
                            restTime: ex.items[1].descanso_segs || 120
                        }));
                    } else {
                        parsedSets = Array.from({ length: numSeries }).map((_, i) => ({
                            id: `set-${Date.now()}-${i}`,
                            reps: ex.reps_target?.toString() || '',
                            load: ex.peso_valor?.toString() || '0',
                            restTime: ex.descanso_segs || 90
                        }));
                    }
                }

                if (isSuperset && ex.items && ex.items.length >= 2) {
                    loadedBlocks.push({
                        id: `block-${Date.now()}-${Math.random()}`,
                        type: 'superset',
                        exerciseA: ex.items[0].ejercicio || "Ejercicio A",
                        exerciseB: ex.items[1].ejercicio || "Ejercicio B",
                        sets: parsedSets
                    });
                } else if (!isSuperset) {
                     loadedBlocks.push({
                        id: `block-${Date.now()}-${Math.random()}`,
                        type: 'single',
                        exerciseA: ex.ejercicio || "Ejercicio",
                        sets: parsedSets
                    });
                }
            });
            setBlocks(loadedBlocks);
        }
    }, [initialRoutine]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const addBlock = (type) => {
        const newBlock = {
            id: `block-${Date.now()}`,
            type: type,
            exerciseA: 'Seleccionar Ejercicio...',
            exerciseB: type === 'superset' ? 'Seleccionar Ejercicio...' : undefined,
            sets: [
                type === 'superset' 
                ? { id: `set-${Date.now()}`, repsA: '', loadA: '', repsB: '', loadB: '', restTime: 120 }
                : { id: `set-${Date.now()}`, reps: '', load: '', restTime: 90 }
            ]
        };
        setBlocks([...blocks, newBlock]);
    };

    const removeBlock = (blockId) => setBlocks(blocks.filter(b => b.id !== blockId));

    const openCatalogFor = (blockId, part = null) => {
        setCatalogTarget({ blockId, part });
        setShowCatalog(true);
    };

    const handleCatalogSelect = (name) => {
        if (!catalogTarget) return;
        setBlocks(blocks.map(b => {
            if (b.id === catalogTarget.blockId) {
                if (catalogTarget.part === 'A') return { ...b, exerciseA: name };
                if (catalogTarget.part === 'B') return { ...b, exerciseB: name };
                return { ...b, exerciseA: name };
            }
            return b;
        }));
        setShowCatalog(false);
        setCatalogTarget(null);
    };

    const addSet = (blockId) => {
        setBlocks(blocks.map(b => {
            if (b.id === blockId) {
                const lastSet = b.sets[b.sets.length - 1];
                let newSet;
                if (b.type === 'superset') {
                    newSet = { id: `set-${Date.now()}`, repsA: lastSet?.repsA || '', loadA: lastSet?.loadA || '', repsB: lastSet?.repsB || '', loadB: lastSet?.loadB || '', restTime: lastSet?.restTime || 120 };
                } else {
                    newSet = { id: `set-${Date.now()}`, reps: lastSet?.reps || '', load: lastSet?.load || '', restTime: lastSet?.restTime || 90 };
                }
                return { ...b, sets: [...b.sets, newSet] };
            }
            return b;
        }));
    };

    const removeSet = (blockId, setId) => {
         setBlocks(blocks.map(b => {
            if (b.id === blockId) return { ...b, sets: b.sets.filter(s => s.id !== setId) };
            return b;
        }));
    };

    const updateSet = (blockId, setId, field, value) => {
        setBlocks(blocks.map(b => {
            if (b.id === blockId) {
                return {
                    ...b,
                    sets: b.sets.map(s => {
                        if (s.id === setId) {
                            if (field === 'restTime') return { ...s, [field]: Math.max(0, s.restTime + value) };
                            return { ...s, [field]: value };
                        }
                        return s;
                    })
                };
            }
            return b;
        }));
    };

    const handleSave = async () => {
        if (!title.trim()) { alert("Por favor, añade un nombre a la rutina."); return; }
        if (blocks.length === 0) { alert("Por favor, añade al menos un bloque/ejercicio."); return; }
        if (!routinesColRef) { alert("Error: No hay conexión con la base de datos."); return; }

        setIsSaving(true);
        try {
            const flatRoutine = [];

            blocks.forEach(b => {
                const targetSet = b.sets[0] || {}; 
                const baseData = {
                    fase_sesion: 'main',
                    series: b.sets.length,
                    detalles_sets: b.sets 
                };

                if (b.type === 'superset') {
                    flatRoutine.push({
                        ...baseData,
                        estructura_visual: 'superset',
                        // Nombre para vistas legacy que no leen items
                        ejercicio: `${b.exerciseA} + ${b.exerciseB}`, 
                        items: [
                            { ejercicio: b.exerciseA, reps_target: parseInt(targetSet.repsA) || 0, reps_texto: targetSet.repsA || "--", peso_valor: parseFloat(targetSet.loadA) || 0, peso_unidad: 'kg', descanso_segs: 0 },
                            { ejercicio: b.exerciseB, reps_target: parseInt(targetSet.repsB) || 0, reps_texto: targetSet.repsB || "--", peso_valor: parseFloat(targetSet.loadB) || 0, peso_unidad: 'kg', descanso_segs: targetSet.restTime || 120 }
                        ]
                    });
                } else {
                    flatRoutine.push({
                        ...baseData,
                        estructura_visual: 'single',
                        ejercicio: b.exerciseA,
                        reps_target: parseInt(targetSet.reps) || 0,
                        reps_texto: targetSet.reps || "--",
                        peso_valor: parseFloat(targetSet.load) || 0,
                        peso_unidad: 'kg',
                        descanso_segs: targetSet.restTime || 90
                    });
                }
            });

            const routineDataToSave = {
                diaEnfoque: title,
                type: 'custom', 
                status: 'pending',
                rutinaPrincipal: flatRoutine,
                createdAt: initialRoutine ? initialRoutine.createdAt : serverTimestamp()
            };

            const docRef = initialRoutine && initialRoutine.id ? doc(routinesColRef, initialRoutine.id) : doc(routinesColRef);
            await setDoc(docRef, routineDataToSave, { merge: true }); 
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
                <button onClick={handleSave} disabled={isSaving} className="text-teal-400 font-bold px-4 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {isSaving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : 'Guardar'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-32 minimal-scrollbar">
                <div className="mb-6">
                    <input type="text" placeholder="Ej: Día de Pierna Pesado" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border-b-2 border-slate-700 text-3xl font-black text-white px-2 py-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-700 transition-colors" />
                </div>

                <div className="space-y-6">
                    {blocks.map((block, bIndex) => (
                        <div key={block.id} className={`bg-slate-800/40 rounded-2xl border overflow-hidden shadow-sm ${block.type === 'superset' ? 'border-cyan-900/50' : 'border-slate-700/50'}`}>
                            
                            <div className={`p-3 border-b flex justify-between items-start ${block.type === 'superset' ? 'bg-cyan-900/20 border-cyan-900/30' : 'bg-slate-800/80 border-slate-700/50'}`}>
                                <div className="flex-1 flex flex-col gap-2">
                                    {block.type === 'single' ? (
                                        <div className="flex items-center gap-3">
                                            <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">{bIndex + 1}</span>
                                            <button onClick={() => openCatalogFor(block.id, 'A')} className="text-left font-bold text-white hover:text-indigo-300 transition-colors truncate">
                                                {block.exerciseA}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 relative pl-8">
                                            <div className="absolute left-3 top-2 bottom-2 w-px bg-cyan-800"></div>
                                            <div className="flex items-center gap-3 relative">
                                                <span className="absolute -left-7 w-4 h-4 rounded-full bg-cyan-900 text-cyan-400 flex items-center justify-center text-[8px] font-black border border-cyan-700 z-10">A1</span>
                                                <button onClick={() => openCatalogFor(block.id, 'A')} className="text-left font-bold text-white hover:text-cyan-300 transition-colors truncate text-sm">{block.exerciseA}</button>
                                            </div>
                                            <div className="flex items-center gap-3 relative">
                                                <span className="absolute -left-7 w-4 h-4 rounded-full bg-blue-900 text-blue-400 flex items-center justify-center text-[8px] font-black border border-blue-700 z-10">A2</span>
                                                <button onClick={() => openCatalogFor(block.id, 'B')} className="text-left font-bold text-white hover:text-blue-300 transition-colors truncate text-sm">{block.exerciseB}</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => removeBlock(block.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors shrink-0 ml-2"><Icon name="close" className="w-5 h-5" /></button>
                            </div>

                            {/* CABECERAS DE TABLA DINÁMICAS SEGÚN EL TIPO */}
                            {block.type === 'single' ? (
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-900/30 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="col-span-2 text-center">Set</div>
                                    <div className="col-span-3 text-center">+KG</div>
                                    <div className="col-span-3 text-center">Reps</div>
                                    <div className="col-span-3 text-center">Rest</div>
                                    <div className="col-span-1"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-12 gap-1 px-1 py-2 bg-cyan-950/30 text-[9px] font-black text-cyan-600/70 uppercase tracking-tight">
                                    <div className="col-span-1 text-center">Set</div>
                                    <div className="col-span-2 text-center">KG(A)</div>
                                    <div className="col-span-2 text-center">Rp(A)</div>
                                    <div className="col-span-2 text-center">KG(B)</div>
                                    <div className="col-span-2 text-center">Rp(B)</div>
                                    <div className="col-span-2 text-center">Rest</div>
                                    <div className="col-span-1"></div>
                                </div>
                            )}

                            <div className="p-2 space-y-1.5">
                                {block.sets.map((set, setIndex) => (
                                    <div key={set.id} className="group relative">
                                        {block.type === 'single' ? (
                                            /* FILA PARA SINGLE */
                                            <div className="grid grid-cols-12 gap-2 items-center px-1 py-1 rounded-lg hover:bg-slate-800/50 transition-colors">
                                                <div className="col-span-2 text-center font-bold text-slate-400">{setIndex + 1}</div>
                                                <div className="col-span-3 relative"><input type="number" value={set.load} onChange={(e) => updateSet(block.id, set.id, 'load', e.target.value)} placeholder="0" className="w-full bg-slate-900 text-white text-center py-2.5 rounded-lg border border-slate-700/50 focus:border-indigo-500 focus:outline-none placeholder:text-slate-700 font-mono text-sm transition-all" /></div>
                                                <div className="col-span-3 relative"><input type="number" value={set.reps} onChange={(e) => updateSet(block.id, set.id, 'reps', e.target.value)} placeholder="0" className="w-full bg-slate-900 text-white text-center py-2.5 rounded-lg border border-slate-700/50 focus:border-indigo-500 focus:outline-none placeholder:text-slate-700 font-mono text-sm transition-all" /></div>
                                                <div className="col-span-3 flex justify-center items-center bg-slate-900 rounded-lg border border-slate-700/50 overflow-hidden">
                                                    <button onClick={() => updateSet(block.id, set.id, 'restTime', -15)} className="px-1.5 py-2.5 text-slate-500 hover:text-white hover:bg-slate-700"><Icon name="minus" className="w-3 h-3" /></button>
                                                    <span className="text-[10px] text-indigo-300 font-mono font-bold w-8 text-center">{formatTime(set.restTime)}</span>
                                                    <button onClick={() => updateSet(block.id, set.id, 'restTime', 15)} className="px-1.5 py-2.5 text-slate-500 hover:text-white hover:bg-slate-700"><Icon name="plus" className="w-3 h-3" /></button>
                                                </div>
                                                <div className="col-span-1 flex justify-center">{block.sets.length > 1 && <button onClick={() => removeSet(block.id, set.id)} className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg transition-colors"><Icon name="close" className="w-4 h-4" /></button>}</div>
                                            </div>
                                        ) : (
                                            /* FILA PARA SUPERSET (Doble input) */
                                            <div className="grid grid-cols-12 gap-1 items-center px-1 py-1 rounded-lg bg-cyan-900/10 border border-cyan-900/20 hover:bg-cyan-900/20 transition-colors">
                                                <div className="col-span-1 text-center font-bold text-cyan-500 text-xs">{setIndex + 1}</div>
                                                {/* Controles A */}
                                                <div className="col-span-2 relative"><input type="number" value={set.loadA} onChange={(e) => updateSet(block.id, set.id, 'loadA', e.target.value)} placeholder="KG" className="w-full bg-slate-900 text-cyan-100 text-center py-2 rounded border border-cyan-800/50 focus:border-cyan-500 focus:outline-none placeholder:text-slate-700 font-mono text-[10px] transition-all" /></div>
                                                <div className="col-span-2 relative"><input type="number" value={set.repsA} onChange={(e) => updateSet(block.id, set.id, 'repsA', e.target.value)} placeholder="Rp" className="w-full bg-slate-900 text-cyan-100 text-center py-2 rounded border border-cyan-800/50 focus:border-cyan-500 focus:outline-none placeholder:text-slate-700 font-mono text-[10px] transition-all" /></div>
                                                {/* Controles B */}
                                                <div className="col-span-2 relative"><input type="number" value={set.loadB} onChange={(e) => updateSet(block.id, set.id, 'loadB', e.target.value)} placeholder="KG" className="w-full bg-slate-900 text-blue-100 text-center py-2 rounded border border-blue-800/50 focus:border-blue-500 focus:outline-none placeholder:text-slate-700 font-mono text-[10px] transition-all" /></div>
                                                <div className="col-span-2 relative"><input type="number" value={set.repsB} onChange={(e) => updateSet(block.id, set.id, 'repsB', e.target.value)} placeholder="Rp" className="w-full bg-slate-900 text-blue-100 text-center py-2 rounded border border-blue-800/50 focus:border-blue-500 focus:outline-none placeholder:text-slate-700 font-mono text-[10px] transition-all" /></div>
                                                
                                                {/* Rest y Borrar */}
                                                <div className="col-span-2 flex flex-col justify-center items-center bg-slate-900 rounded border border-slate-700/50 overflow-hidden">
                                                    <button onClick={() => updateSet(block.id, set.id, 'restTime', 15)} className="w-full text-slate-500 hover:text-white bg-slate-800"><Icon name="chevronUp" className="w-3 h-3 mx-auto" /></button>
                                                    <span className="text-[9px] text-cyan-300 font-mono font-bold text-center leading-none py-0.5">{formatTime(set.restTime)}</span>
                                                    <button onClick={() => updateSet(block.id, set.id, 'restTime', -15)} className="w-full text-slate-500 hover:text-white bg-slate-800"><Icon name="chevronDown" className="w-3 h-3 mx-auto" /></button>
                                                </div>
                                                <div className="col-span-1 flex justify-center">{block.sets.length > 1 && <button onClick={() => removeSet(block.id, set.id)} className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors"><Icon name="close" className="w-3 h-3" /></button>}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 border-t border-slate-800 bg-slate-900/20">
                                <button onClick={() => addSet(block.id)} className="w-full py-2.5 rounded-lg border border-dashed border-slate-600 text-slate-400 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 hover:text-white transition-colors flex justify-center items-center gap-2"><Icon name="plus" className="w-4 h-4" /> Añadir Set</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={() => addBlock('single')} className="py-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-bold text-sm tracking-wide hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all flex justify-center items-center gap-2"><Icon name="plus" className="w-4 h-4" /> Ejercicio</button>
                    <button onClick={() => addBlock('superset')} className="py-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-bold text-sm tracking-wide hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all flex justify-center items-center gap-2"><Icon name="layers" className="w-4 h-4" /> SuperSerie</button>
                </div>
            </div>
            
            {showCatalog && <ExerciseCatalog onSelect={handleCatalogSelect} onClose={() => setShowCatalog(false)} />}
        </div>
    );
};