import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/LayoutComponents';
import { CalendarWidget } from './CalendarWidget';
import { ExerciseListPreview } from './training/TrainingUI';
import { formatRoutineTitle } from '../../utils/helpers'; 

const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function HistoryTab({ history, onViewRoutine, t, setActiveTab, onRepeatSession }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [previewRoutine, setPreviewRoutine] = useState(null);

  const completedRoutines = useMemo(() => 
    history
      .filter(r => r.status === 'completed')
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  , [history]);

  const filteredRoutines = useMemo(() => {
    if (!selectedDate) return completedRoutines;
    return completedRoutines.filter(r => {
      const routineDate = new Date(r.createdAt.seconds * 1000).toDateString();
      return routineDate === selectedDate.toDateString();
    });
  }, [completedRoutines, selectedDate]);

  const handleDateChange = (date) => {
    if (selectedDate && date.getTime() === selectedDate.getTime()) {
        setSelectedDate(null);
    } else {
        setSelectedDate(date);
    }
  };

  if (previewRoutine) {
    const data = previewRoutine.routine || previewRoutine;
    const title = formatRoutineTitle(data.diaEnfoque || data.diaNombre || previewRoutine.diaEnfoque || "Sesión Completada");

    return (
      <div className="animate-fadeIn pb-20">
        <button 
          onClick={() => setPreviewRoutine(null)} 
          className="flex items-center gap-2 text-teal-400 mb-6 font-bold hover:text-teal-300 transition-colors px-2"
        >
          <Icon name="arrowLeft" className="w-5 h-5" /> {t.back || 'Volver al Historial'}
        </button>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl p-6 mb-8">
           <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
           
           <div className="relative z-10">
               <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 text-[9px] font-black uppercase tracking-wider border border-teal-500/20">Historial</span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Icon name="calendar" className="w-3 h-3"/> 
                        {previewRoutine.createdAt?.toDate?.().toLocaleDateString() || 
                         new Date(previewRoutine.createdAt?.seconds * 1000).toLocaleDateString()}
                      </span>
                  </div>
                  <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">
                    {title}
                  </h2>
               </div>
               
               <div className="bg-slate-900/40 rounded-2xl p-2 border border-slate-700/30 mb-6">
                  <ExerciseListPreview routineData={data} limit={99} />
               </div>
               
               <button 
                onClick={() => {
                  onRepeatSession(previewRoutine); 
                  if (setActiveTab) setActiveTab('training');
                }} 
                className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-xl font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-teal-900/20 active:scale-[0.98]"
              >
                  <Icon name="play" className="w-5 h-5 fill-current" />
                  <span className="tracking-wide uppercase text-sm">REPETIR ESTA SESIÓN</span>
              </button>
           </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-fadeIn pb-20">
      <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2"><Icon name="list" className="w-5 h-5 text-teal-400"/> {t.tabHistory}</h2>
      
      {/* CALENDARIO REDUCIDO UN 20% Y CENTRADO */}
      <div className="mb-0 flex justify-center w-full overflow-hidden">
        <div className="scale-75 origin-top transform-gpu">
            <CalendarWidget 
                history={history} 
                onDateChange={handleDateChange} 
                selectedDate={selectedDate}
                t={t}
            />
        </div>
      </div>

      {/* Título de la lista o mensaje de fecha seleccionada */}
      <div className="mb-4 -mt-16 flex items-center justify-between border-b border-slate-700/50 pb-2">
         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
             {selectedDate ? `Sesiones del ${selectedDate.toLocaleDateString()}` : 'Todas las sesiones'}
         </span>
         {selectedDate && (
             <button onClick={() => setSelectedDate(null)} className="text-[10px] text-teal-400 hover:text-teal-300 font-bold bg-teal-500/10 px-2 py-1 rounded">
                 VER TODAS
             </button>
         )}
      </div>

      {filteredRoutines.length > 0 ? (
        <div className="space-y-3 relative z-10">
           {filteredRoutines.map(r => {
             const itemTitle = formatRoutineTitle(r.diaEnfoque || r.routine?.diaEnfoque || "Entrenamiento");
             
             return (
               <Card key={r.id} className="p-4 flex items-center justify-between group hover:bg-slate-800 transition-colors cursor-pointer bg-slate-800/40 border-slate-700/50" onClick={() => setPreviewRoutine(r)}>
                  <div>
                     <div className="flex items-center gap-2 mb-1.5">
                         <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{r.createdAt?.toDate?.().toLocaleDateString() || new Date(r.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1 text-[9px] text-teal-400 font-bold uppercase tracking-wider"><span className="w-1 h-1 rounded-full bg-teal-500 shadow-[0_0_5px_#14b8a6]"></span> Completado</span>
                     </div>
                     <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{itemTitle}</h4>
                     {r.totalTime !== undefined && (
                         <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-mono">
                             <Icon name="clock" className="w-3 h-3" />
                             <span>{formatTime(r.totalTime)}</span>
                         </div>
                     )}
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 text-slate-500 border border-slate-700 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-500 transition-all">
                      <Icon name="chevronRight" className="w-4 h-4" />
                  </div>
               </Card>
             );
           })}
        </div>
      ) : (
        <div className="text-center py-12 mt-4 opacity-50 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700 relative z-10">
            <Icon name={selectedDate ? "searchX" : "database"} className="w-10 h-10 mx-auto mb-3 text-slate-600"/>
            <p className="text-slate-500 font-medium text-sm">
                {selectedDate ? t.noRecordsForDate : t.noRecords}
            </p>
        </div>
      )}
    </div>
  );
}
