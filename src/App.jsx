import React, { useState } from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import { useBackButtonHandler } from './hooks/useBackButtonHandler';
import TrainingTab from './components/features/TrainingTab';
import HistoryTab from './components/features/HistoryTab';
import ProfileTab from './components/features/ProfileTab';
import WorkoutBuilderTab from './components/features/WorkoutBuilderTab'; 
import { Auth } from './components/features/Auth';
import ActiveSession from './components/features/training/ActiveSession';
import { Icon } from './components/ui/Icon';
import { MinimalScrollbarStyles } from './components/ui/GlobalStyles';
import { SplashScreen } from './components/ui/SplashScreen'; 
import { Card } from './components/ui/LayoutComponents';

const BackupModal = ({ jsonString, onClose, onCopy, copySuccess, t }) => (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn"></div>
);

const ImportTextModal = ({ onClose, onImport, importError, t }) => (
     <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn"></div>
);

const SignOutWarningModal = ({ onContinue, onSave, onCancel, t, isAnonymous }) => (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
        <Card className="max-w-md w-full p-8 space-y-6 text-center border border-yellow-500/30 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl relative">
            <Icon name="alertTriangle" className="w-16 h-16 text-yellow-400 mx-auto" />
            <h2 className="text-3xl font-bold text-white">{t.signOutWarningTitle}</h2>
            {isAnonymous ? (
                <p className="text-slate-300 text-lg">
                    {t.signOutWarningGuestMessage}
                </p>
            ) : (
                <p className="text-slate-300 text-lg">
                    {t.signOutWarningMessage}
                </p>
            )}
            <div className="flex gap-4 justify-center">
                {isAnonymous && (
                    <button
                        onClick={onSave}
                        className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-teal-900/30 transition-colors transform hover:-translate-y-1"
                    >
                        {t.signOutWarningSaveData}
                    </button>
                )}
                <button
                    onClick={onContinue}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-red-900/30 transition-colors transform hover:-translate-y-1"
                >
                    {isAnonymous ? t.signOutWarningContinueWithoutSaving : t.signOutConfirm}
                </button>
            </div>
            <button
                onClick={onCancel}
                className="w-full text-center text-slate-400 font-semibold hover:text-white transition-colors mt-4"
            >
                {t.cancel}
            </button>
        </Card>
    </div>
);

const ExitAppModal = ({ onConfirm, onCancel, t }) => (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
        <Card className="max-w-md w-full p-8 space-y-6 text-center border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl relative">
            <Icon name="logOut" className="w-16 h-16 text-slate-400 mx-auto" />
            <h2 className="text-3xl font-bold text-white">{t.exitAppTitle}</h2>
            <p className="text-slate-300 text-lg">
                {t.exitAppMessage}
            </p>
            <div className="flex gap-4 justify-center">
                <button
                    onClick={onConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-red-900/30 transition-colors transform hover:-translate-y-1"
                >
                    {t.exitAppConfirm}
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-slate-900/30 transition-colors transform hover:-translate-y-1"
                >
                    {t.cancel}
                </button>
            </div>
        </Card>
    </div>
);


export default function App() {
    const appLogic = useAppLogic();
    const {
        t, activeTab, view,
        userId, isAuthReady, showSplash,
        scrolled, headerRef, handleScroll,
        setActiveTab, language, setLanguage, isAnonymous,
        backupJson, onCloseBackupModal, onCopyToClipboard, copySuccess,
        isImportModalOpen, setIsImportModalOpen, onImportFromText, importTextError,
        isSignOutWarningVisible, onForceSignOut, setIsSignOutWarningVisible, 
        handleRoutineFeedback, onRepeatSession,
        currentExerciseIndex, setCurrentExerciseIndex, handleBackToMain, isSessionActive
    } = appLogic;

    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

    const { showExitAppModal, handleConfirmExitApp, handleCancelExitApp } = useBackButtonHandler(
        view,
        activeTab,
        isSessionActive,
        currentExerciseIndex,
        setCurrentExerciseIndex,
        handleBackToMain,
        setActiveTab,
        t
    );

    if (!isAuthReady || showSplash) {
        return <SplashScreen show={true} />;
    }

    if (!userId) {
        return <Auth {...appLogic} />;
    }

    if (view === 'routine') {
        return <ActiveSession {...appLogic} />;
    }
    
    const handleSaveAndSignOut = () => {
        setIsSignOutWarningVisible(false);
        setActiveTab('profile'); 
    };

    const handleLanguageChange = (langCode) => {
        setLanguage(langCode);
        setIsLangMenuOpen(false);
    };

    const languages = [
        { code: 'es', label: 'Español' },
        { code: 'en', label: 'English' },
        { code: 'de', label: 'Deutsch' }
    ];

    const currentLangLabel = languages.find(l => l.code === language)?.label || 'Español';

    return (
        <div onClick={() => setIsLangMenuOpen(false)}>
            <MinimalScrollbarStyles />
            
            {backupJson && <BackupModal jsonString={backupJson} onClose={onCloseBackupModal} onCopy={onCopyToClipboard} copySuccess={copySuccess} t={t} />}
            {isImportModalOpen && <ImportTextModal onClose={() => setIsImportModalOpen(false)} onImport={onImportFromText} importError={importTextError} t={t} />}
            {isSignOutWarningVisible && <SignOutWarningModal onContinue={onForceSignOut} onSave={handleSaveAndSignOut} onCancel={() => setIsSignOutWarningVisible(false)} t={t} isAnonymous={isAnonymous} />}
            {showExitAppModal && <ExitAppModal onConfirm={handleConfirmExitApp} onCancel={handleCancelExitApp} t={t} />}

            <div className="h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col overflow-hidden font-sans bg-slate-900 text-slate-100 selection:bg-teal-500/30 relative">
                
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-teal-500/30 to-cyan-500/10 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite]"></div>
                    <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-violet-500/20 to-purple-500/10 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>
                </div>

                <div className="relative z-10 flex flex-col flex-1 h-full">
                    <header ref={headerRef} className={`w-full fixed top-0 left-0 border-b transition-all duration-300 ${scrolled ? 'bg-slate-900/80 backdrop-blur-md border-slate-700/50 py-2 shadow-lg z-50' : 'bg-transparent border-transparent py-3 z-50'}`}>
                        <div className="max-w-md mx-auto px-6 flex items-center justify-between">
                            <h1 className={`font-bold text-slate-100 flex items-center transition-all ${scrolled ? 'text-sm' : 'text-base'}`}>
                                <div className="bg-teal-500/10 p-1.5 rounded-lg mr-2">
                                    <Icon name="dumbbell" className="text-teal-400 w-4 h-4" />
                                </div>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    {t.appTitle}
                                </span>
                            </h1>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="flex items-center gap-2 origin-right relative">
                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-teal-500/50 transition-all font-bold tracking-tight shadow-sm"
                                        >
                                            <Icon name="lang" className="w-3.5 h-3.5 text-teal-400" />
                                            <span>{language.toUpperCase()}</span>
                                            <Icon name="chevronDown" className={`w-3 h-3 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isLangMenuOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 z-[100] animate-fadeIn">
                                                {languages.map(lang => (
                                                    <button 
                                                        key={lang.code}
                                                        onClick={() => handleLanguageChange(lang.code)}
                                                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between
                                                            ${language === lang.code ? 'bg-teal-500/10 text-teal-400' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                                                        `}
                                                    >
                                                        {lang.label}
                                                        {language === lang.code && <Icon name="check" className="w-4 h-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {userId && <span className={`flex items-center px-2 py-1.5 rounded-lg border ${isAnonymous ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' : 'bg-teal-500/10 border-teal-500/20 text-teal-300'} font-semibold shadow-inner`}><Icon name={isAnonymous ? "userCheck" : "activity"} className="w-3.5 h-3.5 mr-1.5" />{isAnonymous ? t.guest : t.online}</span>}
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto overflow-x-hidden minimal-scrollbar pt-16" onScroll={handleScroll}>
                        <div className="max-w-md mx-auto px-4 md:px-0 pb-32">
                            {activeTab === 'training' && <TrainingTab {...appLogic} />}
                            {activeTab === 'builder' && <WorkoutBuilderTab {...appLogic} />}
                            {activeTab === 'history' && <HistoryTab {...appLogic} onRepeatSession={onRepeatSession} />}
                            {activeTab === 'profile' && <ProfileTab {...appLogic} />}
                        </div>
                    </main>

                    {/* DOCK FLOTANTE CON TRANSPARENCIA AUMENTADA Y COLORES PERSONALIZADOS */}
                    <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none px-4 z-50">
                        <nav className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-full px-6 py-3 flex gap-6 sm:gap-8 pointer-events-auto">
                            {['training', 'builder', 'history', 'profile'].map(tab => {
                                const isActive = activeTab === tab;
                                
                                // ICONOS PERSONALIZADOS
                                const icons = { training: 'sparkles', builder: 'copyPlus', history: 'calendarClock', profile: 'user' };
                                
                                // COLORES PERSONALIZADOS
                                let activeBg = 'bg-teal-500';
                                if (tab === 'training') activeBg = 'bg-blue-900 shadow-blue-900/40';
                                if (tab === 'builder') activeBg = 'bg-indigo-500 shadow-indigo-500/40';
                                if (tab === 'history') activeBg = 'bg-sky-900 shadow-sky-900/40';
                                
                                const isSpecial = tab === 'builder' || tab === 'history' || tab === 'training';
                                
                                return (
                                    <button 
                                        key={tab} 
                                        onClick={() => setActiveTab(tab)} 
                                        className={`relative p-3 rounded-full transition-all duration-300 flex items-center justify-center
                                            ${isActive ? `${activeBg} text-white shadow-lg -translate-y-2 scale-110` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}
                                        `}
                                    >
                                        <Icon name={icons[tab]} className="w-6 h-6" />
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}
