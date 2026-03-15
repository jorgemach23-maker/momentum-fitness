import React, { useState } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { 
  formatRoutineTitle, 
  cleanExerciseTitle,
  isWarmupOrCooldown,
  normalizeRoutine 
} from '../../../utils/helpers.js'; 

const getDuration = (routine, profile) => {
    if (routine?.duracionEstimada) return routine.duracionEstimada;
    if (profile?.timeAvailable) return `${profile.timeAvailable} min`;
    return "45 min";
};

export const WeeklyProgressBar = ({ weekDistribution, completionLog, todayIndex, t }) => {
  const completedDaysCount = completionLog.size;
  return (
    <div className="flex items-center justify-between bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10 shadow-lg mb-6">
        <div className="flex items-center gap-3">
            <Icon name="fire" className="w-6 h-6 text-orange-400 drop-shadow-md" />
            <span className="text-lg font-bold text-white tracking-tight">{t.daysTrainedLabel} {completedDaysCount}</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
             const isCompleted = completionLog.has(dayIdx);
             const isToday = dayIdx === todayIndex;
             let bgClass = "bg-slate-700/50";
             let shadowClass = "shadow-none";
             let borderClass = "border-slate-700/50";

             if (isCompleted) { 
                bgClass = "bg-teal-400"; 
                shadowClass = "shadow-lg shadow-teal-500/50";
                borderClass = "border-teal-400";
              } else if (isToday) { 
                bgClass = "bg-slate-800"; 
                borderClass = "border-teal-500 animate-pulse"; 
              }

             return <div key={dayIdx} className={`w-4 h-4 rounded-full border ${borderClass} ${bgClass} ${shadowClass} transition-all duration-500`}></div>;
          })}
        </div>
    </div>
  );
};

export const ExerciseListPreview = ({ exercises, routineData, limit }) => {
  const normalized = normalizeRoutine(routineData || { rutinaPrincipal: exercises });
  const flatExercises = normalized.rutinaPrincipal || [];

  if (flatExercises.length === 0) {
      return <div className="py-2 text-xs text-slate-500 italic text-center">Detalles disponibles al iniciar.</div>;
  }

  const filteredExercises = flatExercises.filter(ex => !isWarmupOrCooldown(ex));
  const visibleEx = limit ? filteredExercises.slice(0, limit) : filteredExercises;
  const remaining = limit ? Math.max(0, filteredExercises.length - limit) : 0;

  return (
    <div className="space-y-2 mt-4 mb-4">
       {visibleEx.map((ex, i) => {
         const bloqueType = (ex.tipo_bloque || ex.bloque || "").toLowerCase();
         const isSuperset = bloqueType.includes('superserie') || ex.estructura_visual === 'superset';
         let content = null;
         
         if (isSuperset) {
             let name1, name2;
             if (ex.items && ex.items.length >= 2) {
                 name1 = cleanExerciseTitle(ex.items[0].ejercicio || ex.items[0].nombre);
                 name2 = cleanExerciseTitle(ex.items[1].ejercicio || ex.items[1].nombre);
             } else if (ex.ejercicioA && ex.ejercicioB) {
                 name1 = cleanExerciseTitle(ex.ejercicioA);
                 name2 = cleanExerciseTitle(ex.ejercicioB);
             } else {
                 const parts = (ex.ejercicio || "").split(/\s*\+\s*|\s+y\s+/i);
                 name1 = cleanExerciseTitle(parts[0] || "Ejercicio A");
                 name2 = cleanExerciseTitle((parts[1] || "Ejercicio B").replace(/^[A-Z]\d+[\s.-]*/, ''));
             }

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
             const rawName = cleanExerciseTitle(ex.ejercicio || ex.nombre);
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

// --- MENÚ DE OPCIONES DESPLEGABLE (ZONAS CORREGIDAS) ---
const RoutineOptionsMenu = ({ routine, profile, onAdjustNextSession, onCopyToMyWorkouts, loading, onClose }) => {
    const [time, setTime] = useState(profile?.timeAvailable || 45);
    const [noEquipment, setNoEquipment] = useState(false);
    const [isZoneOpen, setIsZoneOpen] = useState(false);
    
    // 2. CORRECCIÓN: Estado de zonas vacío por defecto para no heredar "Brazo" u otros strings mal formateados.
    const [selectedMuscles, setSelectedMuscles] = useState([]);

    const muscleOptions = ["Pecho", "Espalda", "Pierna", "Hombro", "Brazo", "Core", "Full Body"];

    const toggleMuscle = (m) => {
        setSelectedMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
    };

    const handleRecalculate = () => {
        const adjustments = {
            timeAvailable: time,
            noEquipment: noEquipment,
            muscleFocus: selectedMuscles.join(', ') // Puede ser vacío, backend lo ignora si está vacío
        };
        onAdjustNextSession(routine, adjustments);
        onClose();
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-[100] p-4 cursor-default flex flex-col gap-4 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="font-bold text-white text-sm">Ajustes de Sesión</span>
                <button onClick={onClose} className="text-slate-400 hover:text-white"><Icon name="close" className="w-4 h-4" /></button>
            </div>

            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tiempo (min)</label>
                    <input type="number" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-teal-500 focus:outline-none" />
                </div>
                <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Modalidad</label>
                    <button onClick={() => setNoEquipment(!noEquipment)} className={`flex-1 flex items-center justify-center gap-2 rounded-lg border transition-colors ${noEquipment ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                        <span className="text-xs font-bold">Sin Equipo</span>
                    </button>
                </div>
            </div>

            <div className="relative">
                <button onClick={() => setIsZoneOpen(!isZoneOpen)} className="w-full flex justify-between items-center bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-300">
                    <span className="truncate">{selectedMuscles.length > 0 ? selectedMuscles.join(', ') : 'Zonas / Músculos...'}</span>
                    <Icon name={isZoneOpen ? "chevronUp" : "chevronDown"} className="w-4 h-4" />
                </button>
                {isZoneOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 flex flex-wrap gap-1.5 z-10 max-h-32 overflow-y-auto minimal-scrollbar shadow-xl">
                        {muscleOptions.map(m => (
                            <button key={m} onClick={() => toggleMuscle(m)} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${selectedMuscles.includes(m) ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-700/50">
                <button onClick={handleRecalculate} disabled={loading} className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    {loading ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <><Icon name="sparkles" className="w-4 h-4" /> Recalcular con IA</>}
                </button>
                <button onClick={() => { onCopyToMyWorkouts(routine); onClose(); }} disabled={loading} className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    <Icon name="copy" className="w-4 h-4" /> Copiar a "Mis Rutinas"
                </button>
            </div>
        </div>
    );
};


export const HeroRoutineCard = ({ routine, onViewRoutine, profile, onAdjustNextSession, onCopyToMyWorkouts, loading, t, lastCompleted }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!routine) return <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-700 rounded-2xl">Todo listo por hoy.</div>;
  const normalized = normalizeRoutine(routine);
  const title = formatRoutineTitle(normalized.diaEnfoque);
  const duration = getDuration(normalized, profile);

  return (
    <div className={`relative overflow-visible rounded-3xl border transition-all duration-300 ${isMenuOpen ? 'z-50 bg-slate-800 border-teal-500/30 ring-1 ring-teal-500/20' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 shadow-xl'} p-5 mb-4 group`}>
       <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-teal-500/10 transition-colors duration-500"></div>
       <div className="relative z-10">
           <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-2">
                  <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1 text-[10px] text-white font-mono"><Icon name="clock" className="w-3 h-3"/> {duration}</span>
                  </div>
                  <h2 className="text-xl font-black text-white leading-tight line-clamp-2 drop-shadow-md">{title}</h2>
              </div>
              <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className={`p-2.5 rounded-xl transition-colors ${isMenuOpen ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500'}`}>
                      <Icon name="settings" className="w-4 h-4" />
                  </button>
                  {isMenuOpen && (
                      <RoutineOptionsMenu routine={routine} profile={profile} onAdjustNextSession={onAdjustNextSession} onCopyToMyWorkouts={onCopyToMyWorkouts} loading={loading} t={t} onClose={() => setIsMenuOpen(false)} />
                  )}
              </div>
           </div>
           <ExerciseListPreview routineData={routine} limit={3} />
           <button onClick={() => onViewRoutine(routine)} className="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-teal-500/40 bg-gradient-to-r from-teal-500 to-emerald-600 border-t border-white/20 hover:shadow-teal-400/60 transition-all flex items-center justify-center gap-2">
               <Icon name="play" className="w-4 h-4 fill-current"/> 
               <span className="tracking-wide text-sm">COMENZAR SESIÓN</span>
           </button>
       </div>
    </div>
  );
};

export const RoutineLibraryList = ({ routines, onViewRoutine, profile, onAdjustNextSession, onCopyToMyWorkouts, loading, t }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  if (!routines || routines.length === 0) return <div className="text-center py-8 text-xs text-slate-500">No hay opciones extra.</div>;
  
  return (
    <div className="space-y-3 pb-20">
       <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Otras Opciones</h3>
       {routines.map((routine) => {
         const isExpanded = expandedId === routine.id;
         const isMenuOpen = activeMenuId === routine.id;
         const normalized = normalizeRoutine(routine);
         const title = formatRoutineTitle(normalized.diaEnfoque);
         const duration = getDuration(normalized, profile);

         return (
           <div key={routine.id} className={`relative rounded-2xl border transition-all duration-300 ${isMenuOpen ? 'z-50' : 'z-10'} ${isExpanded ? 'border-teal-500/30 ring-1 ring-teal-500/20 bg-slate-800/80' : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'}`}>
              <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => { if(!isMenuOpen) setExpandedId(isExpanded ? null : routine.id); }}>
                 <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-400'}`}><Icon name="dumbbell" className="w-4 h-4" /></div>
                    <div>
                        <h4 className="text-sm font-bold text-white truncate pr-2">{title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{duration}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2 shrink-0">
                     <button onClick={(e) => { e.stopPropagation(); onViewRoutine(routine); }} className="p-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white transition-colors" title="Iniciar">
                         <Icon name="play" className="w-4 h-4" />
                     </button>
                     <div className="relative">
                         <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : routine.id); }} className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                             <Icon name="settings" className="w-4 h-4" />
                         </button>
                         {isMenuOpen && (
                             <RoutineOptionsMenu routine={routine} profile={profile} onAdjustNextSession={onAdjustNextSession} onCopyToMyWorkouts={onCopyToMyWorkouts} loading={loading} t={t} onClose={() => setActiveMenuId(null)} />
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
                          <button onClick={(e) => { e.stopPropagation(); onViewRoutine(routine); }} className="w-full flex justify-center items-center gap-2 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-teal-900/20 active:scale-95 uppercase tracking-wide">
                            <Icon name="play" className="w-4 h-4" /> Comenzar Esta Sesión
                          </button>
                      </div>
                  </div>
              )}
           </div>
         );
       })}
    </div>
  );
};
