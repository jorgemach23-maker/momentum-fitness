import React from 'react';

const MinimalScrollbarStyles = () => (
  <style>{`
    body { background-color: #0f172a; color: #f8fafc; }
    .minimal-scrollbar { scrollbar-width: thin; scrollbar-color: #334155 #0f172a; }
    .minimal-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
    .minimal-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-radius: 8px; }
    .minimal-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 8px; border: 2px solid #0f172a; }
    
    /* Animaciones */
    .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-slideInRight { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-pop { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pop { 0% { transform: scale(0.9); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes gradient-move { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    
    /* Utilidades Extra */
    .gemini-loader-circle { width: 28px; height: 28px; position: relative; animation: spin-slow 2s linear infinite; }
    .gemini-loader-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #2dd4bf; }
    .gemini-loader-path {
      width: 28px; height: 28px; border-radius: 50%; padding: 2px;
      background: conic-gradient(from 0deg, #2dd4bf, #8b5cf6, #2dd4bf);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      animation: spin-slow 2s linear infinite;
    }
    .lava-lamp-bg {
        background: linear-gradient(-45deg, #0f172a, #1e1b4b, #0f172a, #064e3b);
        background-size: 400% 400%;
        animation: gradient-move 15s ease infinite;
    }
    .text-stroke { -webkit-text-stroke: 1px rgba(255,255,255,0.1); }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    /* Confeti */
    .particle { position: absolute; width: 8px; height: 8px; border-radius: 50%; animation: particle-anim 1s forwards; pointer-events: none; z-index: 100; }
    @keyframes particle-anim {
        0% { transform: translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
    }
  `}</style>
);

export { MinimalScrollbarStyles };