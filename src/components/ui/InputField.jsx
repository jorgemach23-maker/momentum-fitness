import React from 'react';
import { Icon } from './Icon.jsx';

export const InputField = ({ label, icon, type = "text", name, value, onChange, placeholder, options, isTextArea = false }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className={`absolute left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-400 transition-colors duration-300 ${isTextArea ? 'top-4' : 'inset-y-0'}`}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
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

export default InputField;