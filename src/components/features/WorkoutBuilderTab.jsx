import React, { useState, useMemo, useRef } from 'react';
import { Icon } from '../ui/Icon';
import { RoutineEditor } from './workout-builder/RoutineEditor';
import { ExerciseListPreview } from './training/TrainingUI';
import { formatRoutineTitle, normalizeRoutine } from '../../utils/helpers';
import { doc, deleteDoc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../services/firebase'; 

export default function WorkoutBuilderTab({ t, history, routinesColRef, userId, setActiveTab, handleViewRoutine, setHistory }) {
    const [isEditing, setIsEditing] = useState(false);
    const [routineToEdit, setRoutineToEdit] = useState(null); // NUEVO: Estado para saber qué rutina editar
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [expandedRoutineId, setExpandedRoutineId] = useState(null); 
    const fileInputRef = useRef(null);

    const customRoutines = useMemo(() => {
        return history
            .filter(r => r.type === 'custom')
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [history]);

    const executeStart = (routine, e) => {
        e.preventDefault();
        e.stopPropagation(); 
        if (handleViewRoutine) {
            handleViewRoutine(routine);
            setActiveTab('training');
        }
    };

    const executeEdit = (routine, e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveMenuId(null);
        setRoutineToEdit(routine);
        setIsEditing(true);
    };

    const executeDelete = async (routineId, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("[DEBUG BORRADO] 1. ID de rutina recibido:", routineId);

        const confirmed = window.confirm("¿Seguro que quieres borrar esta rutina permanentemente?");
        
        if (!confirmed) {
            console.log("[DEBUG BORRADO] 2. Usuario canceló.");
            setActiveMenuId(null);
            return;
        }

        console.log("[DEBUG BORRADO] 3. Usuario confirmó. Iniciando proceso...");
        
        try {
            if (!routinesColRef) {
                console.error("[DEBUG BORRADO] ERROR: routinesColRef es nulo.");
                alert("Error crítico: Falta referencia a la base de datos.");
                setActiveMenuId(null);
                return;
            }

            if (typeof setHistory === 'function') {
                console.log("[DEBUG BORRADO] 4. Limpiando UI local...");
                setHistory(prevHistory => prevHistory.filter(r => r.id !== routineId));
            } else {
                console.warn("[DEBUG BORRADO] ADVERTENCIA: setHistory no es una función.");
            }

            console.log("[DEBUG BORRADO] 5. Creando referencia a Firebase...");
            const docRefToDelete = doc(routinesColRef, routineId);
            
            console.log("[DEBUG BORRADO] 6. Enviando orden de borrado a Firebase...");
            await deleteDoc(docRefToDelete);
            
            console.log("[DEBUG BORRADO] 7. Firebase confirmó el borrado. ¡ÉXITO!");
            
        } catch (error) {
            console.error("[DEBUG BORRADO] ERROR FATAL en try/catch:", error);
            alert("Ocurrió un error al borrar. Revisa la consola.");
        } finally {
            setActiveMenuId(null);
        }
    };

    const executeDuplicate = async (routine, e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveMenuId(null); 
        
        try {
            if (!routinesColRef) {
                alert("Error: Base de datos no conectada.");
                return;
            }
            
            const newDocRef = doc(routinesColRef); 

            const duplicatedRoutine = {
                ...routine,
                diaEnfoque: `${routine.diaEnfoque} (Copia)`,
                createdAt: serverTimestamp(),
                status: 'pending',
                id: newDocRef.id
            };

            await setDoc(newDocRef, duplicatedRoutine);
            alert("Rutina duplicada con éxito.");
            
        } catch (error) {
            console.error("Error duplicando rutina:", error);
            alert("Error al duplicar la rutina.");
        }
    };

    const executeExport = (routine, e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveMenuId(null); 
        
        const exportData = {
            version: 1,
            source: "MomentumFitness",
            type: "custom_routine",
            payload: {
                diaEnfoque: routine.diaEnfoque,
                rutinaPrincipal: routine.rutinaPrincipal
            }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        
        const safeName = (routine.diaEnfoque || "rutina").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const a = document.createElement("a");
        a.href = url;
        a.download = `momentum_${safeName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                const data = JSON.parse(content);

                if (data.source !== "MomentumFitness" || data.type !== "custom_routine" || !data.payload) {
                    throw new Error("El archivo no es una rutina válida de Momentum Fitness.");
                }

                if (!routinesColRef) throw new Error("Base de datos no conectada.");

                const newDocRef = doc(routinesColRef);

                const importedRoutine = {
                    diaEnfoque: data.payload.diaEnfoque,
                    rutinaPrincipal: data.payload.rutinaPrincipal,
                    type: 'custom',
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    id: newDocRef.id
                };

                await setDoc(newDocRef, importedRoutine);
                alert("¡Rutina importada con éxito!");
            } catch (error) {
                console.error("Error importando:", error);
                alert("Error al importar: Archivo inválido o corrupto.");
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const triggerImport = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const closeEditor = () => {
        setIsEditing(false);
        setRoutineToEdit(null); // Limpiar la rutina a editar al cerrar
    };


    if (isEditing) {
        return (
            <RoutineEditor 
                t={t} 
                onClose={closeEditor} 
                routinesColRef={routinesColRef}
                userId={userId}
                setActiveTab={setActiveTab}
                initialRoutine={routineToEdit} // Pasamos la rutina a editar
                setHistory={setHistory}
            />
        );
    }

    return (
        <div className="animate-fadeIn pb-24" onClick={() => setActiveMenuId(null)}>
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Icon name="dumbbell" className="w-5 h-5 text-indigo-400" /> 
                Laboratorio de Rutinas
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-8">
                <button 
                    onClick={() => { setRoutineToEdit(null); setIsEditing(true); }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl hover:bg-indigo-600/30 transition-colors group"
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon name="plus" className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-indigo-300">Crear Nueva</span>
                </button>

                <button 
                    onClick={triggerImport}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-700 transition-colors group relative overflow-hidden"
                >
                    <input 
                        type="file" 
                        accept=".txt" 
                        ref={fileInputRef} 
                        onChange={handleImportFileChange} 
                        className="hidden" 
                    />
                    <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon name="download" className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Importar (.txt)</span>
                </button>
            </div>

            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-4 flex items-center gap-2">
                    <Icon name="layers" className="w-4 h-4" />
                    Mis Rutinas ({customRoutines.length})
                </h3>

                {customRoutines.length > 0 ? (
                    <div className="space-y-3">
                        {customRoutines.map(routine => {
                            const isExpanded = expandedRoutineId === routine.id;
                            const normalized = normalizeRoutine(routine);
                            const title = formatRoutineTitle(normalized.diaEnfoque);
                            const isMenuOpen = activeMenuId === routine.id;

                            const robustKey = `routine-${routine.id || Math.random()}`;

                            return (
                                <div 
                                    key={robustKey} 
                                    className={`relative rounded-2xl border transition-all duration-300 
                                        ${isMenuOpen ? 'z-50' : 'z-10'} 
                                        ${isExpanded ? 'border-indigo-500/30 ring-1 ring-indigo-500/20 bg-slate-800/80' : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'}
                                    `}
                                >
                                    <div 
                                        className="p-4 flex justify-between items-center cursor-pointer"
                                        onClick={() => {
                                            if (!isMenuOpen) setExpandedRoutineId(isExpanded ? null : routine.id);
                                        }}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                <Icon name="dumbbell" className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-sm font-bold text-white truncate pr-2">{title}</h4>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button 
                                                onClick={(e) => executeStart(routine, e)}
                                                className="p-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white transition-colors"
                                                title="Iniciar"
                                            >
                                                <Icon name="play" className="w-4 h-4" />
                                            </button>

                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => { 
                                                        e.preventDefault();
                                                        e.stopPropagation(); 
                                                        setActiveMenuId(isMenuOpen ? null : routine.id); 
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                                >
                                                    <Icon name="settings" className="w-4 h-4" />
                                                </button>

                                                {/* Menú Desplegable con BOTÓN EDITAR */}
                                                {isMenuOpen && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-fadeIn">
                                                        <button onClick={(e) => executeEdit(routine, e)} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 flex items-center gap-3">
                                                            <Icon name="settings" className="w-4 h-4 text-slate-400" /> Editar
                                                        </button>
                                                        <button onClick={(e) => executeDuplicate(routine, e)} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 flex items-center gap-3 border-t border-slate-700/50">
                                                            <Icon name="copy" className="w-4 h-4 text-slate-400" /> Duplicar
                                                        </button>
                                                        <button onClick={(e) => executeExport(routine, e)} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 flex items-center gap-3 border-t border-slate-700/50">
                                                            <Icon name="upload" className="w-4 h-4 text-slate-400" /> Exportar
                                                        </button>
                                                        
                                                        {/* BOTON DE BORRAR */}
                                                        <button 
                                                            onClick={(e) => executeDelete(routine.id, e)} 
                                                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-3 border-t border-slate-700/50"
                                                        >
                                                            <Icon name="close" className="w-4 h-4 text-red-400" /> Borrar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <Icon name={isExpanded ? "chevronUp" : "chevronDown"} className="w-4 h-4 text-slate-500 ml-1" />
                                        </div>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="animate-fadeIn border-t border-slate-700/50 bg-slate-900/50 rounded-b-2xl">
                                            <div className="p-4">
                                                <ExerciseListPreview routineData={routine} limit={99} />
                                            </div>
                                            <div className="p-3 bg-slate-800/80 rounded-b-2xl">
                                                <button 
                                                    onClick={(e) => executeStart(routine, e)}
                                                    className="w-full flex justify-center items-center gap-2 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-teal-900/20 active:scale-95 uppercase tracking-wide"
                                                >
                                                    <Icon name="play" className="w-4 h-4" />
                                                    Comenzar Esta Sesión
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                        <Icon name="database" className="w-10 h-10 mx-auto mb-3 text-slate-600"/>
                        <p className="text-slate-500 font-medium text-sm px-8">Crea tu primera rutina o importa una de un archivo .txt</p>
                    </div>
                )}
            </div>
        </div>
    );
}
