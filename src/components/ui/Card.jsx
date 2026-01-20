import React from 'react';

export const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-slate-800/40 border border-slate-700/50 rounded-2xl shadow-sm backdrop-blur-xl transition-all duration-300 ${className}`}>
    {children}
  </div>
);

export default Card;