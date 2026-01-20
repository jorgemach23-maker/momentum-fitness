import React, { useState, useEffect } from 'react';
import ActiveSession from './training/ActiveSession';
import { WeeklyProgressBar, HeroRoutineCard, RoutineLibraryList, AdjustSessionView } from './training/TrainingUI';
import Icon from '../ui/Icon';
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
    lang, 
    t, // Added t prop
    onAnalyzeBioage, 
    bioageLoading,
    view, 
    currentRoutine, 
    routineId, 
    onRoutineFeedback, 
    onExerciseComplete,
    isSessionActive,
    setIsSessionActive,
    restSeconds,
    setRestSeconds,
    sessionSeconds
}) => {
    const [progressText, setProgressText] = useState(t.generating);
    const [activeTab, setActiveTab] = useState('recommended');
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [adjustingRoutine, setAdjustingRoutine] = useState(null);

    const currentPlanId = profile.currentPlanId;
    const todayIndex = (new Date().getDay() + 6) % 7; 

    const currentWeekRoutines = history
        .filter(r => r.planId === currentPlanId && r.status !== 'archived_history')
        .sort((a, b) => a.weekDay - b.weekDay);

    const completionLog = new Map();
    history.forEach(r => {
        if (r.planId === currentPlanId && r.status === 'completed' && r.completedOnDay !== undefined) {
            completionLog.set(r.completedOnDay, r);
        }
    });

    const pendingRoutines = currentWeekRoutines.filter(r => r.status === 'pending');
    const recommendedRoutine = pendingRoutines[0];
    const libraryRoutines = currentWeekRoutines.filter(r => r.id !== recommendedRoutine?.id);

    useEffect(() => {
        if (generationProgress < 30) setProgressText(t.analyzing);
        else if (generationProgress < 60) setProgressText(t.designing);
        else if (generationProgress < 90) setProgressText(t.optimizing);
        else setProgressText(t.finalizing);
    }, [generationProgress, t]);

    const handleOpenAdjustment = (routine) => {
        setAdjustingRoutine(routine);
        setShowAdjustment(true);
    };
    
    if (view === 'routine') {
        return (
            <ActiveSession 
                routine={currentRoutine}
                routineId={routineId}
                onRoutineFeedback={onRoutineFeedback}
                successMessage={successMessage}
                lang={lang}
                onExerciseComplete={onExerciseComplete}
                isSessionActive={isSessionActive}
                setIsSessionActive={setIsSessionActive}
                restSeconds={restSeconds}
                setRestSeconds={setRestSeconds}
                sessionSeconds={sessionSeconds}
            />
        );
    }

    return (
        <div className="animate-fadeIn pb-24">
            <div className="space-y-2 mb-4">
                {successMessage && <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-xl flex items-center shadow-lg backdrop-blur-md"><Icon name="check" className="mr-3 w-5 h-5" /> {successMessage}</div>}
                {errorMessage && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-center shadow-lg backdrop-blur-md"><Icon name="alert" className="mr-3 w-5 h-5" /> {errorMessage}</div>}
            </div>

            <WeeklyProgressBar weekDistribution={currentWeekRoutines} completionLog={completionLog} todayIndex={todayIndex} />

            <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-1 px-2">
                <div className="flex gap-6">
                    <button onClick={() => setActiveTab('recommended')} className={`pb-2 text-xs font-bold transition-all relative uppercase tracking-wider ${activeTab === 'recommended' ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}>Recomendado{activeTab === 'recommended' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>}</button>
                    <button onClick={() => setActiveTab('library')} className={`pb-2 text-xs font-bold transition-all relative uppercase tracking-wider ${activeTab === 'library' ? 'text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>Más Opciones{activeTab === 'library' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-200 rounded-t-full"></div>}</button>
                </div>
                <button onClick={() => onGeneratePlan(profile)} className="pb-2 text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition-colors"><Icon name="refresh" className="w-3 h-3" /> {t.regenerateCycle}</button>
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
                                        <HeroRoutineCard
                                            routine={recommendedRoutine}
                                            onView={onViewRoutine} // Correctly passing onViewRoutine as onView
                                            onAdjust={() => handleOpenAdjustment(recommendedRoutine)}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20"><div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20"><Icon name="check" className="w-8 h-8 text-emerald-500" /></div><h3 className="text-lg font-bold text-white mb-1">¡Semana Completada!</h3><p className="text-slate-500 text-xs mb-5 max-w-[200px] mx-auto">No hay rutinas pendientes. ¡Gran trabajo!</p></div>
                                )}
                            </>
                        )}
                        {activeTab === 'library' && (
                            <div className="animate-fadeIn">
                                <RoutineLibraryList routines={libraryRoutines} onView={onViewRoutine} onAdjust={handleOpenAdjustment} />
                                {libraryRoutines.length === 0 && recommendedRoutine && (
                                    <div className="text-center py-10 opacity-50"><p className="text-xs text-slate-500">Solo queda la rutina recomendada.</p></div>
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
                                lang={lang}
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
                 {pendingRoutines.length > 0 && (
                    <div className="mt-4">
                        <button onClick={() => onAdjustNextSession(pendingRoutines[0], profile, false)} className="w-full py-3 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700">Ajustar Próxima Sesión</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainingTab;
