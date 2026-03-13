import React, { useState, useMemo, useRef } from 'react';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/LayoutComponents';
import { RoutineEditor } from './workout-builder/RoutineEditor';
import { ExerciseListPreview } from './training/TrainingUI';
import { formatRoutineTitle, normalizeRoutine } from '../../utils/helpers';
import { doc, deleteDoc, setDoc, serverTimestamp, collection } from 'firebase/firestore';

export default function WorkoutBuilderTab({ t, history, setHistory, routinesColRef, userId, setActiveTab, handleViewRoutine }) {
    const [isEditing, setIsEditing] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [expandedRoutineId, setExpandedRoutineId] = useState(null); 
    const fileInputRef = useRef(null);

    // Filtrar solo las rutinas creadas manualmente
    const customRoutines = useMemo(() => {
        return history
            .filter(r => r.type === 'custom')
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [history]);

    // --- ACCIONES DE RUTINA ---

    const handleStartRoutine = (routine, e) => {
        e.stopPropagation(); 
        if (handleViewRoutine) {
            handleViewRoutine(routine);
            setActiveTab('training');
        }
    };

    const handleDeleteRoutine = async (routineId, e) => {
        e.stopPropagation(); 
        if (window.confirm("¿Seguro que quieres borrar esta rutina de forma permanente?")) {
            try {
                // Borrar solo de Firebase. El listener en tiempo real actualizará la UI automáticamente.
                if (routinesColRef && routineId) {
                    await deleteDoc(doc(routinesColRef, routineId));
                }
            } catch (error) {
                console.error("Error borrando rutina:", error);
                alert("Error al borrar la rutina en la base de datos.");
            }
        }
        setActiveMenuId(null);
    };

    const handleDuplicateRoutine = async (routine, e) => {
        e.stopPropagation();
        try {
            if (!routinesColRef) return;
            const newDocRef = doc(routinesColRef); 

            const duplicatedRoutine = {
                ...routine,
                diaEnfoque: `${routine.diaEnfoque} (Copia)`,
                createdAt: serverTimestamp(),
                status: 'pending'
            };
            delete duplicatedRoutine.id; // Remover ID antiguo

            // Guardar en Firestore. No llamamos a setHistory, Firebase lo hará por nosotros.
            await setDoc(newDocRef, duplicatedRoutine);
            alert("Rutina duplicada con éxito.");
            
        } catch (error) {
            console.error("Error duplicando rutina:", error);
            alert("Error al duplicar la rutina.");
        }
        setActiveMenuId(null);
    };

    // --- EXPORTAR E IMPORTAR ---

    const handleExportRoutine = (routine, e) => {
        e.stopPropagation();
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
        
        setActiveMenuId(null);
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
                    createdAt: serverTimestamp()
                };

                // Guardar en Firestore. Firebase lo inyectará en la UI.
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


    if (isEditing) {
        return (
            <RoutineEditor 
                t={t} 
                onClose={() => setIsEditing(false)} 
                routinesColRef={routinesColRef}
                userId={userId}
                // ¡TRUCO MAGISTRAL! No pasamos setHistory a RoutineEditor.
                // Así obligamos al editor a depender de Firebase Realtime para actualizar la UI,
                // eliminando el error de duplicidad al crear.
                setActiveTab={setActiveTab}
            />
        );
    }

    return (
        <div className="animate-fadeIn pb-24" onClick={() => setActiveMenuId(null)}>
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Icon name="dumbbell" className="w-5 h-5 text-indigo-400" /> 
                Laboratorio de Rutinas
            </h2>

            {/* SECCIÓN 1: CONTROLES SUPERIORES */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <button 
                    onClick={() => setIsEditing(true)}
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

            {/* SECCIÓN 2: MIS RUTINAS CREADAS (ACORDEÓN) */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-4 flex items-center gap-2">
                    <Icon name="layers" className="w-4 h-4" />
                    Mis Rutinas ({customRoutines.length})
                </h3>

                {customRoutines.length > 0 ? (
                    <div className="space-y-3">
                        {customRoutines.map(routine => {
                            const key = routine.id || `fallback-${Math.random()}`;
                            const isExpanded = expandedRoutineId === routine.id;
                            const normalized = normalizeRoutine(routine);
                            const title = formatRoutineTitle(normalized.diaEnfoque);
                            const isMenuOpen = activeMenuId === routine.id;

                            return (
                                <Card 
                                    key={key} 
                                    // CORRECCIÓN Z-INDEX: Elevamos la tarjeta cuando su menú está abierto
                                    style={{ zIndex: isMenuOpen ? 50 : 10 }}
                                    className={`p-0 overflow-visible relative transition-all duration-300 ${isExpanded ? 'border-indigo-500/30 ring-1 ring-indigo-500/20 bg-slate-800/80' : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'}`}
                                >
                                    {/* Header Colapsable */}
                                    <div 
                                        className="p-4 flex justify-between items-center cursor-pointer"
                                        onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                <Icon name="dumbbell" className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-sm font-bold text-white truncate pr-2">{title}</h4>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Botón Iniciar Rápido */}
                                            <button 
                                                onClick={(e) => handleStartRoutine(routine, e)}
                                                className="p-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white transition-colors"
                                                title="Iniciar"
                                            >
                                                <Icon name="play" className="w-4 h-4" />
                                            </button>

                                            {/* Botón Menú (Engranaje) */}
                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : routine.id); }}
                                                    className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                                >
                                                    <Icon name="settings" className="w-4 h-4" />
                                                </button>

                                                {/* Menú Desplegable con Z-INDEX ALTO */}
                                                {isMenuOpen && (
                                                    <div className="absolute right-0 top-10 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden animate-fadeIn">
                                                        <button onClick={(e) => handleDuplicateRoutine(routine, e)} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 flex items-center gap-3">
                                                            <Icon name="copy" className="w-4 h-4 text-slate-400" /> Duplicar
                                                        </button>
                                                        <button onClick={(e) => handleExportRoutine(routine, e)} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 flex items-center gap-3 border-t border-slate-700/50">
                                                            <Icon name="upload" className="w-4 h-4 text-slate-400" /> Exportar
                                                        </button>
                                                        <button onClick={(e) => handleDeleteRoutine(routine.id, e)} className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-3 border-t border-slate-700/50">
                                                            <Icon name="close" className="w-4 h-4 text-red-400" /> Borrar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Icono de Colapso */}
                                            <Icon name={isExpanded ? "chevronUp" : "chevronDown"} className="w-4 h-4 text-slate-500 ml-1" />
                                        </div>
                                    </div>
                                    
                                    {/* Contenido Expandible */}
                                    {isExpanded && (
                                        <div className="animate-fadeIn border-t border-slate-700/50 bg-slate-900/50">
                                            <div className="p-4">
                                                <ExerciseListPreview routineData={routine} limit={99} />
                                            </div>
                                            <div className="p-3 bg-slate-800/80">
                                                <button 
                                                    onClick={(e) => handleStartRoutine(routine, e)}
                                                    className="w-full flex justify-center items-center gap-2 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-teal-900/20 active:scale-95 uppercase tracking-wide"
                                                >
                                                    <Icon name="play" className="w-4 h-4" />
                                                    Comenzar Esta Sesión
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
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
