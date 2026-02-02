import React from 'react';
import { Icon } from './Icon';

export const Card = ({ children, className = "", onClick }) => <div onClick={onClick} className={`bg-slate-800/40 border border-slate-700/50 rounded-2xl shadow-sm backdrop-blur-xl transition-all duration-300 ${className}`}>{children}</div>;

export const InputField = ({ label, icon, type = "text", name, value, onChange, placeholder, as = 'input', children, className = '', unit }) => {
    const commonProps = {
        name,
        value,
        onChange,
        className: `w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl py-3 pl-4 ${unit ? 'pr-14' : 'pr-4'} text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-colors duration-300 hover:bg-slate-800/50 appearance-none ${className}`
    };

    const renderInput = () => {
        switch (as) {
            case 'select':
                return (
                    <div className="relative">
                        <select {...commonProps}>
                            {children}
                        </select>
                        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 pointer-events-none">
                            <Icon name="chevronDown" className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                );
            case 'textarea':
                return <textarea {...commonProps} placeholder={placeholder} rows="3" />;
            default:
                return (
                    <div className="relative">
                        <input type={type} {...commonProps} placeholder={placeholder} />
                        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 pointer-events-none">{unit}</span>}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-1">
            {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>}
            {renderInput()}
        </div>
    );
};

export const BioageInput = ({ label, name, value, onChange, unit }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
       <input type="number" name={`bio_${name}`} value={value || ''} onChange={onChange} className="w-full bg-slate-950/30 border border-slate-700/70 text-slate-200 rounded-lg py-3 pl-3 pr-10 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none" placeholder="0" />
       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 pointer-events-none">{unit}</span>
    </div>
  </div>
);
