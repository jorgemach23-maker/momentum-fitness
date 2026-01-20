import React from 'react';
import { Sparkles } from 'lucide-react';

export const GeminiLoader = ({ progressText }) => (
  <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-full border border-teal-500/20 shadow-xl shadow-teal-900/10 backdrop-blur-md transition-all scale-90 origin-right">
    <div className="gemini-loader-circle">
      <div className="gemini-loader-path"></div>
      <Sparkles className="gemini-loader-icon w-3 h-3" strokeWidth={2} />
    </div>
    <span className="text-xs font-medium bg-gradient-to-r from-teal-300 to-violet-300 bg-clip-text text-transparent animate-pulse">{progressText}</span>
  </div>
);

export default GeminiLoader;