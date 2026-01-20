import React from 'react';
import Icon from '../ui/Icon';
import { Card } from '../ui/LayoutComponents';

export default function HistoryTab({ history, onViewRoutine, t }) {
  const archivedRoutines = history.filter(r => r.status === 'archived_history').sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  
  return (
    <div className="animate-fadeIn pb-20">
      <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2"><Icon name="list" className="w-5 h-5 text-teal-400"/> {t.tabHistory}</h2>
      {archivedRoutines.length > 0 ? (
        <div className="space-y-4">
           {archivedRoutines.map(r => (
             <Card key={r.id} className="p-5 flex items-center justify-between group hover:bg-slate-800 transition-colors cursor-pointer" onClick={()=>onViewRoutine(r)}>
                <div>
                   <div className="flex items-center gap-2 mb-2"><span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">{r.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</span><span className="flex items-center gap-1 text-[10px] text-teal-400 font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> {t.completed}</span></div>
                   <h4 className="text-base font-bold text-slate-200 group-hover:text-teal-300 transition-colors">{r.diaEnfoque}</h4>
                </div>
                <div className="p-3 rounded-full bg-slate-900 text-slate-500 border border-slate-700 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-500 transition-all"><Icon name="chevronRight" className="w-5 h-5" /></div>
             </Card>
           ))}
        </div>
      ) : (
        <div className="text-center py-16 opacity-50 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700"><Icon name="database" className="w-12 h-12 mx-auto mb-4 text-slate-600"/><p className="text-slate-500 font-medium">{t.noRecords}</p></div>
      )}
    </div>
  );
}
