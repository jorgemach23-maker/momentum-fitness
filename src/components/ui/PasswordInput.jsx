import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';

const PasswordRequirement = ({ isValid, text }) => (
    <div className={`flex items-center text-xs transition-colors duration-300 ${isValid ? 'text-green-400' : 'text-slate-500'}`}>
        <Icon name={isValid ? "checkCircle" : "xCircle"} className="w-4 h-4 mr-2 flex-shrink-0" />
        <span>{text}</span>
    </div>
);

export const PasswordInput = ({ value, onChange, placeholder, t }) => {
    const [showPassword, setShowPassword] = useState(false);

    const validations = useMemo(() => {
        const hasLength = value.length >= 6;
        const hasUppercase = /[A-Z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        return { hasLength, hasUppercase, hasNumber };
    }, [value]);

    return (
        <div className="space-y-3">
            <div className="relative">
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder || 'Contraseña'}
                    className="w-full bg-slate-900/70 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-colors"
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 pt-1">
                <PasswordRequirement isValid={validations.hasLength} text={t.passRequirementLength} />
                <PasswordRequirement isValid={validations.hasUppercase} text={t.passRequirementUpper} />
                <PasswordRequirement isValid={validations.hasNumber} text={t.passRequirementNumber} />
            </div>
        </div>
    );
};
