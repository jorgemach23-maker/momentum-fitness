import React, { useState, useMemo } from 'react';
import { WeeklyProgressBar, HeroRoutineCard, RoutineLibraryList, AdjustSessionView } from './training/TrainingUI';
import { Icon } from '../ui/Icon';
import { GeminiLoader } from '../ui/GeminiLoader';

const TrainingTab = ({ 
    profile, 
    onProfileChange, 
    onGeneratePlan, 
    onAdjustNextSession, 
    loading, 
    successMessage, 
    errorMessage, 
    history, 
    onViewRoutine, 
    generationProgress, 
    t
}) => {
    const [activeTab, setActiveTab] = useState('recommended');
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [adjustingRoutine, setAdjustingRoutine] = useState(null);

    const currentPlanId = profile.currentPlanId;
    const todayIndex = (new Date().getDay() + 6) % 7; 

    const progressText = useMemo(() => {
        if (generationProgress < 30) return t.analyzing;
        if (generationProgress < 60) return t.designing;
        if (generationProgress < 90) return t.optimizing;
        return t.finalizing;
    }, [generationProgress, t]);

    // Helper: Detectar grupos musculares predominantes
    const getMuscleGroups = (title = "") => {
        const t = title.toLowerCase();
        const groups = new Set();
        if (/pecho|chest|push|empuje|press|hombro|shoulder|tricep/i.test(t)) groups.add('push');
        if (/espalda|back|pull|tracción|remo|bicep/i.test(t)) groups.add('pull');
        if (/pierna|leg|cuad|femoral|gluteo|squat|inferior/i.test(t)) groups.add('legs');
        if (/core|abs|abdomen|plank/i.test(t)) groups.add('core');
        return groups;
    };

    // 1. Obtener todas las rutinas de la semana actual
    const currentWeekRoutines = useMemo(() => 
        history
            .filter(r => r.planId === currentPlanId && r.status !== 'archived_history')
            .sort((a, b) => a.weekDay - b.weekDay)
    , [history, currentPlanId]);

    // 2. Identificar la última rutina completada globalmente para saber qué descansar
    const lastCompleted = useMemo(() => 
        history
            .filter(r => r.status === 'completed')
            .sort((a, b) => {
                const timeA = a.completedAt?.seconds || a.createdAt?.seconds || 0;
                const timeB = b.completedAt?.seconds || b.createdAt?.seconds || 0;
                return timeB - timeA;
            })[0]
    , [history]);

    // 3. Lógica de Recomendación Inteligente
    const { recommendedRoutine, libraryRoutines } = useMemo(() => {
        const pending = currentWeekRoutines.filter(r => r.status === 'pending');
        if (pending.length === 0) return { recommendedRoutine: null, libraryRoutines: [], pendingRoutines: [] };

        const lastMuscles = lastCompleted ? getMuscleGroups(lastCompleted.diaEnfoque) : new Set();
        
        let recommended = pending.find(r => {
            const currentMuscles = getMuscleGroups(r.diaEnfoque);
            return ![...currentMuscles].some(m => lastMuscles.has(m));
        });

        if (!recommended) recommended = pending[0];
        const library = pending.filter(r => r.id !== recommended.id);

        return { recommendedRoutine: recommended, libraryRoutines: library };
    }, [currentWeekRoutines, lastCompleted]);

    const completionLog = useMemo(() => {
        const log = new Map();
        history.forEach(r => {
            if (r.planId === currentPlanId && r.status === 'completed' && r.completedOnDay !== undefined) {
                log.set(r.completedOnDay, r);
            }
        });
        return log;
    }, [history, currentPlanId]);

    const handleOpenAdjustment = (routine) => {
        setAdjustingRoutine(routine);
        setShowAdjustment(true);
    };
    
    return (
        <div className="animate-fadeIn pb-24">
            <div className="space-y-2 mb-4">
                {successMessage && <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-xl flex items-center shadow-lg backdrop-blur-md"><Icon name="check" className="mr-3 w-5 h-5" /> {successMessage}</div>}
                {errorMessage && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-center shadow-lg backdrop-blur-md"><Icon name="alert" className="mr-3 w-5 h-5" /> {errorMessage}</div>}
            </div>

            <WeeklyProgressBar weekDistribution={currentWeekRoutines} completionLog={completionLog} todayIndex={todayIndex} t={t} />

            {/* CONTENEDOR DE PESTAÑAS */}
            <div className="mb-4">
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-4">
                    <div className="flex space-x-2 bg-slate-800/50 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('recommended')} 
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${activeTab === 'recommended' ? 'bg-teal-500 text-white shadow' : 'text-slate-400 hover:bg-slate-700/50'}`}
                        >
                            {t.recommended}
                        </button>
                        <button 
                            onClick={() => setActiveTab('library')} 
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${activeTab === 'library' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700/50'}`}
                        >
                            {t.moreOptions}
                        </button>
                    </div>
                    <button onClick={() => onGeneratePlan(profile)} className="text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition-colors">
                        <Icon name="refresh" className="w-3 h-3" /> {t.regenerateCycle}
                    </button>
                </div>
            </div>

            <div className="min-h-[250px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10"><GeminiLoader progressText={progressText} /></div>
                ) : (
                    <>
                        {activeTab === 'recommended' && (
                            <>
                                {recommendedRoutine ? (
                                    <div className="animate-fadeIn">
                                        <HeroRoutineCard routine={recommendedRoutine} onView={onViewRoutine} onAdjust={() => handleOpenAdjustment(recommendedRoutine)} t={t}/>
                                        {lastCompleted && (
                                            <div className="mt-2 px-3 py-2 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center gap-2">
                                                <Icon name="info" className="w-3.5 h-3.5 text-teal-500" />
                                                <span className="text-[10px] text-slate-400 italic">
                                                    {t.suggestionBasedOn} {lastCompleted.diaEnfoque}.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20"><div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20"><Icon name="check" className="w-8 h-8 text-emerald-500" /></div><h3 className="text-lg font-bold text-white mb-1">{t.weekCompletedTitle}</h3><p className="text-slate-500 text-xs mb-5 max-w-[200px] mx-auto">{t.weekCompletedMessage}</p></div>
                                )}
                            </>
                        )}
                        {activeTab === 'library' && (
                            <div className="animate-fadeIn">
                                <RoutineLibraryList routines={libraryRoutines} onView={onViewRoutine} onAdjust={handleOpenAdjustment} t={t} />
                                {libraryRoutines.length === 0 && recommendedRoutine && (
                                    <div className="text-center py-10 opacity-50"><p className="text-xs text-slate-500">{t.onlyRecommendedLeft}</p></div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {showAdjustment && adjustingRoutine && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="w-full max-w-md relative">
                            <button onClick={() => setShowAdjustment(false)} className="absolute -top-10 right-0 text-slate-400 hover:text-white"><Icon name="close" className="w-8 h-8" /></button>
                            <AdjustSessionView
                                nextRoutine={adjustingRoutine}
                                profile={profile}
                                onProfileChange={onProfileChange}
                                onAdjustNextSession={(r, p, ne) => {
                                    onAdjustNextSession(r || adjustingRoutine, p, ne);
                                    setShowAdjustment(false);
                                }}
                                loading={loading}
                                progressText={progressText}
                                t={t}
                            />
                        </div>
                    </div>
                )}

                {currentWeekRoutines.length === 0 && !loading && (
                    <div className="p-6 text-center border border-dashed border-slate-700 rounded-2xl mt-4">
                        <Icon name="sparkles" className="w-8 h-8 text-teal-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-xs mb-4">{t.noPlan}</p>
                        <button onClick={() => onGeneratePlan(profile)} className="w-full py-3 rounded-lg bg-teal-600 text-white font-bold text-xs shadow-lg shadow-teal-900/20 hover:bg-teal-500">{t.startRoutine}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainingTab;
