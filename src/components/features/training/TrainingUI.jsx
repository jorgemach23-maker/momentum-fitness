import React, { useState } from 'react';
// Ajusta la ruta si es necesario (ej: ../../ui/Icon.jsx)
import { Icon } from '../../ui/Icon.jsx';
import { Card } from '../../ui/Card.jsx';
import { InputField } from '../../ui/InputField.jsx';
import { GeminiLoader } from '../../ui/GeminiLoader.jsx';
import { 
  formatRoutineTitle, 
  cleanExerciseTitle 
} from '../../../utils/helpers.js'; 

// --- 1. BARRA DE PROGRESO SEMANAL ---
export const WeeklyProgressBar = ({ weekDistribution, completionLog, todayIndex }) => (
  <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-6 backdrop-blur-sm">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tu Racha</span>
        <span className="text-xs text-slate-300 font-medium">Semana {weekDistribution.length > 0 ? 'Activa' : 'Off'}</span>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
           const isCompleted = completionLog.has(dayIdx);
           const isToday = dayIdx === todayIndex;
           let bgClass = "bg-slate-700/50";
           let borderClass = "border-transparent";
           if (isCompleted) bgClass = "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]";
           else if (isToday) { bgClass = "bg-slate-800"; borderClass = "border-teal-500 animate-pulse"; }
           return <div key={dayIdx} className={`w-3 h-3 rounded-full border ${borderClass} ${bgClass} transition-all duration-500`}></div>;
        })}
      </div>
  </div>
);

// --- 2. VISTA PREVIA DE EJERCICIOS ---
export const ExerciseListPreview = ({ exercises, limit }) => {
  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return <div className="py-2 text-xs text-slate-500 italic text-center">Detalles disponibles al iniciar.</div>;
  }

  const visibleEx = limit ? exercises.slice(0, limit) : exercises;
  const remaining = limit ? Math.max(0, exercises.length - limit) : 0;

  return (
    <div className="space-y-2 mt-4 mb-4">
       {visibleEx.map((ex, i) => {
         const isSuperset = ex.tipo_bloque === 'superserie';
         let content = null;
         
         if (isSuperset) {
             const parts = (ex.ejercicio || "").split('+');
             const name1 = cleanExerciseTitle(parts[0]);
             const name2 = cleanExerciseTitle(parts[1] || "").replace(/^[A-Z]\d+[\s.-]*/, ''); 
             content = ( 
                <div className="flex flex-col w-full gap-1">
                    <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-[9px] font-black text-cyan-400 bg-cyan-900/30 px-1.5 py-0.5 rounded border border-cyan-500/20 whitespace-nowrap">A1</span>
                            <p className="text-xs font-medium text-slate-200 truncate">{name1}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-[9px] font-black text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-500/20 whitespace-nowrap">A2</span>
                            <p className="text-xs font-medium text-slate-200 truncate">{name2}</p>
                        </div>
                    </div>
                </div> 
             );
         } else {
             const rawName = cleanExerciseTitle(ex.ejercicio);
             let equipBadge = "General";
             if(rawName.match(/barra/i)) equipBadge = "Barra";
             else if(rawName.match(/mancuerna/i)) equipBadge = "Mancuernas";
             else if(rawName.match(/polea|cable/i)) equipBadge = "Polea";
             else if(rawName.match(/máquina|maquina/i)) equipBadge = "Máquina";
             
             content = ( 
                <div className="flex-1 min-w-0 flex justify-between items-center">
                    <p className="text-xs font-medium text-slate-200 truncate pr-2">{rawName}</p>
                    <span className="text-[8px] font-bold text-slate-500 uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/50 whitespace-nowrap">{equipBadge}</span>
                </div> 
             );
         }
         
         return ( 
            <div key={i} className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${isSuperset ? 'bg-slate-800/80 border-cyan-900/20' : 'bg-slate-800/40 border-slate-700/30'}`}>
                <span className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold mt-0.5 ${isSuperset ? 'bg-cyan-900/20 text-cyan-500' : 'bg-teal-900/20 text-teal-500'}`}>{i + 1}</span>
                {content}
            </div> 
         );
       })}
       
       {remaining > 0 && (
           <div className="text-center pt-2">
               <span className="text-[10px] text-slate-500 font-medium bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">+ {remaining} ejercicios más...</span>
           </div>
       )}
    </div>
  );
};

// --- 3. TARJETA PRINCIPAL (HERO) ---
export const HeroRoutineCard = ({ routine, onView, onAdjust }) => {
  if (!routine) return <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-700 rounded-2xl">Todo listo por hoy.</div>;
  
  const data = routine.routine || routine;
  const exercisesList = Array.isArray(data.rutinaPrincipal) ? data.rutinaPrincipal : [];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-xl p-5 mb-4 group">
       <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-teal-500/10 transition-colors duration-500"></div>
       
       <div className="relative z-10">
           <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-2">
                  <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 text-[9px] font-black uppercase tracking-wider border border-teal-500/20 shadow-sm shadow-teal-900/20">Sugerencia</span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono"><Icon name="clock" className="w-3 h-3"/> {data.duracionEstimada || "45 min"}</span>
                  </div>
                  <h2 className="text-xl font-black text-white leading-tight line-clamp-2 drop-shadow-md">{formatRoutineTitle(routine.diaEnfoque || data.diaEnfoque)}</h2>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onAdjust(); }} className="p-2.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all shadow-lg active:scale-95"><Icon name="settings" className="w-4 h-4" /></button>
           </div>
           
           <ExerciseListPreview exercises={exercisesList} limit={3} />
           
           <button onClick={() => onView(routine)} className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20 active:scale-[0.98] group-hover:shadow-teal-500/20 mt-2">
               <Icon name="play" className="w-4 h-4 fill-current"/> 
               <span className="tracking-wide text-sm">COMENZAR SESIÓN</span>
           </button>
       </div>
    </div>
  );
};

// --- 4. LISTA DE BIBLIOTECA ---
export const RoutineLibraryList = ({ routines, onView, onAdjust }) => {
  const [expandedId, setExpandedId] = useState(null);
  if (!routines || routines.length === 0) return <div className="text-center py-8 text-xs text-slate-500">No hay opciones extra.</div>;
  
  return (
    <div className="space-y-3 pb-20">
       <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Otras Opciones</h3>
       {routines.map((r) => {
         const isExpanded = expandedId === r.id;
         const data = r.routine || r; // Normalización de datos corregida
         const exercisesList = Array.isArray(data.rutinaPrincipal) ? data.rutinaPrincipal : [];

         return (
           <div key={r.id} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-slate-800 border-teal-500/30 ring-1 ring-teal-500/20' : 'bg-slate-800/40 border-slate-700/50'}`}>
              <div className="w-full flex items-center justify-between p-4 text-left cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                 <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-teal-500 text-slate-900 shadow-lg shadow-teal-500/20' : 'bg-slate-900 text-slate-500 border border-slate-700'}`}><Icon name="dumbbell" className="w-5 h-5" /></div>
                    <div>
                        <h4 className={`text-sm font-bold ${isExpanded ? 'text-white' : 'text-slate-300'}`}>{formatRoutineTitle(r.diaEnfoque)}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{data.duracionEstimada || "45 min"}</p>
                    </div>
                 </div>
                 <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-teal-500' : 'text-slate-600'}`}>
                     <Icon name="chevronDown" className="w-5 h-5" />
                 </div>
              </div>
              
              {isExpanded && (
                  <div className="px-4 pb-4 animate-fadeIn">
                      <div className="pt-2 border-t border-slate-700/50 mb-4 bg-slate-900/20 rounded-xl p-2">
                          <ExerciseListPreview exercises={exercisesList} limit={99} />
                      </div>
                      <div className="flex gap-3 px-1">
                          <button onClick={(e) => { e.stopPropagation(); onAdjust(r); }} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors">AJUSTAR</button>
                          <button onClick={(e) => { e.stopPropagation(); onView(r); }} className="flex-[2] py-2.5 rounded-lg bg-teal-600 text-white font-bold text-xs hover:bg-teal-500 shadow-lg shadow-teal-900/20 transition-colors flex items-center justify-center gap-2"><Icon name="play" className="w-3 h-3 fill-current"/> INICIAR</button>
                      </div>
                  </div>
              )}
           </div>
         );
       })}
    </div>
  );
};

// --- 5. MODAL DE AJUSTE ---
export const AdjustSessionView = ({ nextRoutine, profile, onProfileChange, onAdjustNextSession, loading, progressText, lang }) => {
    const t = { timeAvailable: "Tiempo", modality: "Modalidad", noEquipment: "Sin equipo", focusZone: "Zona", processing: "Procesando...", recalcParams: "Recalcular" }; 
    const [selectedMuscles, setSelectedMuscles] = useState([]);
    const [noEquipment, setNoEquipment] = useState(false); 
    const [isZoneOpen, setIsZoneOpen] = useState(false);
    
    const toggleMuscle = (m) => {
        const newSelection = selectedMuscles.includes(m) ? selectedMuscles.filter(x => x !== m) : [...selectedMuscles, m];
        setSelectedMuscles(newSelection);
        if (onProfileChange) {
            onProfileChange({ target: { name: 'muscleFocus', value: newSelection.join(', ') } });
        }
    };
    
    const muscleOptions = [ { category: "Grupos", items: ["Tren Superior", "Tren Inferior", "Core", "Full Body"] }, { category: "Músculos", items: ["Glúteos", "Cuádriceps", "Pecho", "Espalda", "Brazos"] } ];
    
    return (
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6 border-b border-slate-700/50 pb-4"><div><h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Icon name="settings" className="w-5 h-5 text-slate-400"/> {nextRoutine.diaEnfoque}</h3></div>{loading && <GeminiLoader progressText={progressText} />}</div>
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-6 items-center">
                <InputField label={t.timeAvailable} icon="clock" type="number" name="timeAvailable" value={profile.timeAvailable} onChange={onProfileChange} />
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t.modality}</label>
                    <button onClick={() => setNoEquipment(!noEquipment)} className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between transition-all ${noEquipment ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-900/50 border-slate-700 text-slate-400'}`}>
                        <span className="text-sm font-semibold">{t.noEquipment}</span>
                        <Icon name={noEquipment ? "toggleOn" : "toggleOff"} className={`w-6 h-6 ${noEquipment ? "text-indigo-400" : "text-slate-600"}`} />
                    </button>
                </div>
           </div>
           <div className="border border-slate-700 rounded-xl overflow-hidden">
                <button onClick={() => setIsZoneOpen(!isZoneOpen)} className="w-full p-4 flex items-center justify-between bg-slate-900/50 hover:bg-slate-800 transition-colors">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.focusZone}</span>
                    <Icon name={isZoneOpen ? "chevronUp" : "chevronDown"} className="w-4 h-4 text-slate-500" />
                </button>
                {isZoneOpen && (
                    <div className="p-4 bg-slate-900/30 animate-fadeIn border-t border-slate-700/50">
                        <div className="flex flex-wrap gap-2.5">
                            {muscleOptions.flatMap(g => g.items).map(muscle => { 
                                const isSelected = selectedMuscles.includes(muscle); 
                                return (
                                    <button key={muscle} onClick={() => toggleMuscle(muscle)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 border hover:scale-105 active:scale-95 ${isSelected ? 'bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-900/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                                        {muscle}
                                    </button>
                                ); 
                            })}
                        </div>
                    </div>
                )}
            </div>
           <button onClick={() => onAdjustNextSession(nextRoutine, profile, noEquipment)} disabled={loading} className="w-full py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2 shadow-lg">
                {loading ? t.processing : <><Icon name="refresh" className="w-5 h-5" /> {t.recalcParams}</>}
           </button>
        </div>
      </Card>
    );
};
