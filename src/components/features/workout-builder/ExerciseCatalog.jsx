import React, { useState } from 'react';
import { Icon } from '../../ui/Icon';
import exerciseData from '../../../data/exercises.json';

export const ExerciseCatalog = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const categories = ['All', ...new Set(exerciseData.map(e => e.category))];

    const filteredExercises = exerciseData.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || ex.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col animate-fadeIn">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <h3 className="text-lg font-bold text-white">Catálogo de Ejercicios</h3>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800">
                    <Icon name="close" className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 space-y-3 bg-slate-900">
                <div className="relative">
                    <Icon name="searchX" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Buscar ejercicio..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto minimal-scrollbar pb-2">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredExercises.map(ex => (
                    <button 
                        key={ex.id}
                        onClick={() => onSelect(ex.name)}
                        className="w-full text-left p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/50 transition-all flex justify-between items-center group"
                    >
                        <div>
                            <h4 className="text-white font-bold group-hover:text-indigo-300 transition-colors">{ex.name}</h4>
                            <p className="text-xs text-slate-500 mt-1">{ex.category} • {ex.equipment}</p>
                        </div>
                        <Icon name="plus" className="w-5 h-5 text-slate-600 group-hover:text-indigo-400" />
                    </button>
                ))}
                
                {/* Opción para agregar manual si no existe */}
                {search && filteredExercises.length === 0 && (
                    <button 
                        onClick={() => onSelect(search)}
                        className="w-full p-4 rounded-xl border border-dashed border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-bold flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-colors"
                    >
                        <Icon name="plus" className="w-4 h-4" />
                        Añadir "{search}" manualmente
                    </button>
                )}
            </div>
        </div>
    );
};