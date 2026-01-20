import React from 'react';
// Importación con extensión explícita para asegurar la resolución
import Icon from './Icon.jsx';

export const SplashScreen = ({ show }) => (
  <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-1000 pointer-events-none ${show ? 'opacity-100' : 'opacity-0'}`}>
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
      <Icon name="dumbbell" className="w-12 h-12 text-teal-400 relative z-10" />
    </div>
    <h1 className="text-xl font-black text-white tracking-tight">Momentum <span className="text-teal-400">AI</span></h1>
  </div>
);

export default SplashScreen;