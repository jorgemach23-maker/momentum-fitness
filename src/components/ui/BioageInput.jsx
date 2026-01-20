import React from 'react';

export const BioageInput = ({ label, name, value, onChange, unit, tooltip, isBio = true }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center ml-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    </div>
    <div className="relative group">
       <input 
         type="number" 
         name={isBio ? `bio_${name}` : name} 
         value={value === 0 ? '' : value} 
         onChange={onChange} 
         className="w-full bg-slate-950/30 border border-slate-700/70 text-slate-200 rounded-lg py-3 pl-3 pr-10 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none" 
         placeholder="0" 
       />
       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 pointer-events-none">{unit}</span>
    </div>
  </div>
);

export default BioageInput;