import React, { useState, useEffect } from 'react';
import { Icon } from '../../ui/Icon';
import { cleanExerciseTitle } from '../../../utils/helpers';

const NextExercisePreview = ({ exercise }) => {
    if (!exercise) return null;

    const isSuperset = exercise.tipo_bloque === 'superserie' || exercise.ejercicio.includes('+');
    const title = isSuperset ? "Siguiente Superserie" : "Siguiente Ejercicio";

    let partA = exercise.ejercicio;
    let partB = null;

    if (isSuperset) {
        const parts = exercise.ejercicio.split('+').map(p => cleanExerciseTitle(p.trim()));
        partA = parts[0] || 'Ejercicio A';
        partB = parts[1] || 'Ejercicio B';
    }

    return (
        <div className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">{title}</h3>
            <div className="space-y-2">
                <div className="bg-slate-900/70 p-3 rounded-lg text-center">
                    <p className="text-sm font-semibold text-white truncate">{cleanExerciseTitle(partA)}</p>
                </div>
                {partB && (
                    <div className="bg-slate-900/70 p-3 rounded-lg text-center">
                        <p className="text-sm font-semibold text-white truncate">{partB}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const RestScreen = ({ duration, nextExercise, onFinish, lang }) => {
    const [remaining, setRemaining] = useState(duration);
    const t = { es: { whatsNext: 'QUÉ SIGUE', skip: 'Saltar' }, en: { whatsNext: 'WHAT\'S NEXT', skip: 'Skip' } }[lang || 'es'];

    useEffect(() => {
        if (remaining <= 0) {
            onFinish();
            return;
        }
        const timer = setTimeout(() => setRemaining(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [remaining, onFinish]);

    const progress = (duration - remaining) / duration;
    const circumference = 2 * Math.PI * 90; // radio = 90

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="relative w-52 h-52 flex items-center justify-center mb-8">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" stroke="#334155" strokeWidth="10" fill="none" />
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        stroke="#14b8a6" // teal-500
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - progress)}
                        className="transition-all duration-1000 linear"
                    />
                </svg>
                <span className="text-6xl font-bold text-white font-mono tracking-tighter">{remaining}</span>
            </div>

            <div className="w-full max-w-sm mb-8">
                <h2 className="text-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">{t.whatsNext}</h2>
                <NextExercisePreview exercise={nextExercise} />
            </div>
            
            <button onClick={onFinish} className="bg-slate-800 text-slate-300 font-bold py-3 px-6 rounded-full text-sm hover:bg-slate-700 transition-colors">
                {t.skip}
            </button>
        </div>
    );
};

export default RestScreen;
