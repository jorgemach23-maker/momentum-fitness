import React, { useState, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/LayoutComponents';
import { CalendarWidget } from './CalendarWidget';
import { ExerciseListPreview } from './training/TrainingUI';
import { formatRoutineTitle } from '../../utils/helpers'; // Corregido el path a ../../

const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function HistoryTab({ history, onViewRoutine, t, setActiveTab }) {
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
    const exercisesList = Array.isArray(data.rutinaPrincipal) ? data.rutinaPrincipal : [];

    return (
      <div className="animate-fadeIn pb-20">
        <button 
          onClick={() => setPreviewRoutine(null)} 
          className="flex items-center gap-2 text-teal-400 mb-6 font-bold hover:text-teal-300 transition-colors px-2"
        >
          <Icon name="arrowLeft" className="w-5 h-5" /> {t.back || 'Volver al Historial'}
        </button>

        {/* Tarjeta Estilo Recomendado (Hero) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl p-6 mb-8">
           {/* Decoración Fondo */}
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
                    {formatRoutineTitle(previewRoutine.diaEnfoque)}
                  </h2>
               </div>
               
               <div className="bg-slate-900/40 rounded-2xl p-2 border border-slate-700/30 mb-6">
                  <ExerciseListPreview exercises={exercisesList} limit={99} />
               </div>
               
               <button 
                onClick={() => {
                  onViewRoutine({ ...previewRoutine, status: 'pending' });
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
      <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2"><Icon name="list" className="w-5 h-5 text-teal-400"/> {t.tabHistory}</h2>
      
      <div className="mb-8">
        <CalendarWidget 
            history={history} 
            onDateChange={handleDateChange} 
            selectedDate={selectedDate}
            t={t}
        />
      </div>

      {filteredRoutines.length > 0 ? (
        <div className="space-y-4">
           {filteredRoutines.map(r => (
             <Card key={r.id} className="p-5 flex items-center justify-between group hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => setPreviewRoutine(r)}>
                <div>
                   <div className="flex items-center gap-2 mb-2">
                       <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">{r.createdAt?.toDate?.().toLocaleDateString() || new Date(r.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                       <span className="flex items-center gap-1 text-[10px] text-teal-400 font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> {t.completed}</span>
                   </div>
                   <h4 className="text-base font-bold text-slate-200 group-hover:text-teal-300 transition-colors">{r.diaEnfoque}</h4>
                   {r.totalTime !== undefined && (
                       <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-mono">
                           <Icon name="clock" className="w-3.5 h-3.5" />
                           <span>{formatTime(r.totalTime)}</span>
                       </div>
                   )}
                </div>
                <div className="p-3 rounded-full bg-slate-900 text-slate-500 border border-slate-700 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-500 transition-all">
                    <Icon name="chevronRight" className="w-5 h-5" />
                </div>
             </Card>
           ))}
        </div>
      ) : (
        <div className="text-center py-16 opacity-50 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
            <Icon name={selectedDate ? "searchX" : "database"} className="w-12 h-12 mx-auto mb-4 text-slate-600"/>
            <p className="text-slate-500 font-medium">
                {selectedDate ? t.noRecordsForDate : t.noRecords}
            </p>
             {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="mt-4 px-4 py-2 text-sm font-semibold text-teal-300 bg-teal-500/10 rounded-lg hover:bg-teal-500/20 transition-colors">
                    {t.showAll}
                </button>
            )}
        </div>
      )}
    </div>
  );
}
