import React from 'react';
import { Icon } from './Icon';

export const Card = ({ children, className = "", onClick }) => <div onClick={onClick} className={`bg-slate-800/40 border border-slate-700/50 rounded-2xl shadow-sm backdrop-blur-xl transition-all duration-300 ${className}`}>{children}</div>;

export const InputField = ({ label, icon, type = "text", name, value, onChange, placeholder, options, isTextArea = false }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className={`absolute left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-400 transition-colors duration-300 ${isTextArea ? 'top-4' : 'inset-y-0'}`}><Icon name={icon} className="w-5 h-5" /></div>
      {options ? (
        <select name={name} value={value} onChange={onChange} className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none appearance-none cursor-pointer hover:bg-slate-800/50">
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : isTextArea ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows="3" className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none min-h-[100px] resize-y" />
      ) : (
        <input type={type} name={name} value={value === 0 ? '' : value} onChange={onChange} placeholder={placeholder} className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none" />
      )}
    </div>
  </div>
);

export const BioageInput = ({ label, name, value, onChange, unit, tooltip, isBio = true }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center ml-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label></div>
    <div className="relative group">
       <input type="number" name={isBio ? `bio_${name}` : name} value={value === 0 ? '' : value} onChange={onChange} className="w-full bg-slate-950/30 border border-slate-700/70 text-slate-200 rounded-lg py-3 pl-3 pr-10 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none" placeholder="0" />
       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 pointer-events-none">{unit}</span>
    </div>
  </div>
);

export const SplashScreen = ({ show }) => (
    <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-1000 pointer-events-none ${show ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
            <Icon name="dumbbell" className="w-12 h-12 text-teal-400 relative z-10" />
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">Momentum <span className="text-teal-400">AI</span></h1>
    </div>
);

export const GeminiLoader = ({ progressText }) => (
    <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-full border border-teal-500/20 shadow-xl shadow-teal-900/10 backdrop-blur-md transition-all scale-90 origin-right">
        <div className="gemini-loader-circle">
            <div className="gemini-loader-path"></div>
            <Icon name="sparkles" className="gemini-loader-icon w-3 h-3" />
        </div>
        <span className="text-xs font-medium bg-gradient-to-r from-teal-300 to-violet-300 bg-clip-text text-transparent animate-pulse">{progressText}</span>
    </div>
);
