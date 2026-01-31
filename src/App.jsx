import React from 'react';
import { useAppLogic } from './hooks/useAppLogic';

// Vistas Principales (Tabs)
import TrainingTab from './components/features/TrainingTab';
import HistoryTab from './components/features/HistoryTab';
import ProfileTab from './components/features/ProfileTab';
import { Auth } from './components/features/Auth';

// Sesión Activa (Cargada como vista de nivel superior)
import ActiveSession from './components/features/training/ActiveSession';

// Componentes de UI y Layout
import { Icon } from './components/ui/Icon';
import { MinimalScrollbarStyles } from './components/ui/GlobalStyles';
import { SplashScreen } from './components/ui/SplashScreen'; 
import { Card } from './components/ui/LayoutComponents';

// --- Modales Globales ---
const BackupModal = ({ jsonString, onClose, onCopy, copySuccess, t }) => {
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
            <Card className="w-full max-w-lg p-6 border-slate-600 bg-slate-900">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-100 font-bold text-lg">{t.copyBackup}</h3>
                    <button onClick={onClose}><Icon name="close" className="text-slate-400 hover:text-white"/></button>
                </div>
                <textarea readOnly value={jsonString} className="w-full h-48 bg-slate-950 text-slate-400 text-xs p-4 rounded-xl border border-slate-700 mb-5 minimal-scrollbar font-mono focus:outline-none focus:border-teal-500"/>
                <div className="flex justify-end gap-3">
                    <button onClick={onCopy} className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-lg ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-500'}`}>
                        {copySuccess ? <><Icon name="check" className="inline w-4 h-4 mr-1"/> {t.copied}</> : <><Icon name="copy" className="inline w-4 h-4 mr-1"/> {t.copyToClip}</>}
                    </button>
                </div>
            </Card>
        </div>
    );
};

const ImportTextModal = ({ onClose, onImport, importError, t }) => {
    const [txt, setTxt] = React.useState("");
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
            <Card className="w-full max-w-lg p-6 border-slate-600 bg-slate-900">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-100 font-bold text-lg">{t.importData}</h3>
                    <button onClick={onClose}><Icon name="close" className="text-slate-400 hover:text-white"/></button>
                </div>
                <textarea value={txt} onChange={e => setTxt(e.target.value)} className="w-full h-48 bg-slate-950 text-slate-200 text-xs p-4 rounded-xl border border-slate-700 mb-5 minimal-scrollbar font-mono focus:ring-2 focus:ring-teal-500 outline-none" placeholder='Pegar contenido JSON aquí...'/>
                <div className="flex justify-end gap-3">
                    <button onClick={() => onImport(txt)} className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-bold text-sm hover:bg-teal-500 shadow-lg">{t.importBtn}</button>
                </div>
                {importError && <p className="text-red-400 text-xs mt-3 bg-red-900/20 p-2 rounded border border-red-900/50">{importError}</p>}
            </Card>
        </div>
    );
};

const SignOutWarningModal = ({ onContinue, onSave, onCancel, t }) => (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
        <Card className="w-full max-w-md p-8 border-slate-600 bg-slate-900 text-center">
            <Icon name="alertTriangle" className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-slate-100 font-bold text-2xl mb-2">{t.signOutGuestTitle}</h3>
            <p className="text-slate-400 mb-8">{t.signOutGuestMessage}</p>
            <div className="flex flex-col gap-3">
                <button onClick={onSave} className="px-5 py-3 rounded-lg bg-teal-600 text-white font-bold text-sm hover:bg-teal-500 shadow-lg">
                    {t.saveAccountButton}
                </button>
                <button onClick={onContinue} className="px-5 py-2.5 rounded-lg bg-red-800/80 text-white font-semibold text-sm hover:bg-red-700">
                    {t.signOutAndLoseData}
                </button>
                 <button onClick={onCancel} className="px-5 py-2 text-slate-400 font-medium text-sm hover:text-white">
                    {t.cancel}
                </button>
            </div>
        </Card>
    </div>
);

export default function App() {
    const {
        t, activeTab, view, currentRoutine, showSplash, scrolled, headerRef,
        isImportModalOpen, importTextError, backupJson, copySuccess, isSessionActive,
        sessionSeconds, restSeconds, userId, isAuthReady, authError, linkAccountError, isAnonymous, 
        profile, bioageLoading, profileSuccess, profileError, successMessage,
        history, loading, generationProgress, error, isSignOutWarningVisible,
        toggleLanguage, setActiveTab, handleScroll, handleViewRoutine, handleBackToMain,
        handleRoutineFeedback, handleExerciseComplete, setRestSeconds, setIsSessionActive,
        onProfileChange, onProfileSave, onAnalyzeBioage, onGeneratePlan, onAdjustNextSession,
        onGenerateBackup, onCloseBackupModal, onCopyToClipboard, setIsImportModalOpen, onImportFromText,
        onSignIn, onSignUp, onAnonymousSignIn, onSignOutRequest, onForceSignOut, onLinkAccount, onPasswordReset, setAuthError,
        setIsSignOutWarningVisible
    } = useAppLogic();

    if (!isAuthReady || showSplash) {
         return <SplashScreen show={true} />;
    }

    if (!userId) {
        return <Auth onSignIn={onSignIn} onSignUp={onSignUp} onAnonymousSignIn={onAnonymousSignIn} onPasswordReset={onPasswordReset} error={authError} t={t} setAuthError={setAuthError} />
    }

    // --- RENDERIZADO CONDICIONAL DE SESIÓN ACTIVA (PANTALLA COMPLETA) ---
    if (view === 'routine') {
        return (
            <div className="h-screen bg-slate-900 text-slate-100 overflow-hidden">
                <ActiveSession 
                    routine={currentRoutine}
                    onRoutineFeedback={handleRoutineFeedback}
                    lang={t.lang}
                    onExerciseComplete={handleExerciseComplete}
                    restSeconds={restSeconds}
                    setRestSeconds={setRestSeconds}
                    setIsSessionActive={setIsSessionActive}
                    isSessionActive={isSessionActive}
                    sessionSeconds={sessionSeconds}
                    onBack={handleBackToMain} // <-- PASAMOS LA FUNCIÓN PARA REGRESAR
                    title={t.routineInProgress} // <-- PASAMOS EL TÍTULO TRADUCIDO
                />
            </div>
        );
    }

    const handleSaveAndSignOut = () => {
        setIsSignOutWarningVisible(false);
        setActiveTab('profile');
    };

    return (
        <>
            <MinimalScrollbarStyles />
            {backupJson && <BackupModal jsonString={backupJson} onClose={onCloseBackupModal} onCopy={onCopyToClipboard} copySuccess={copySuccess} t={t} />}
            {isImportModalOpen && <ImportTextModal onClose={() => setIsImportModalOpen(false)} onImport={onImportFromText} importError={importTextError} t={t} />}
            {isSignOutWarningVisible && <SignOutWarningModal onContinue={onForceSignOut} onSave={handleSaveAndSignOut} onCancel={() => setIsSignOutWarningVisible(false)} t={t}/> }
            
            <div className="h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col overflow-hidden font-sans bg-slate-900 text-slate-100 selection:bg-teal-500/30">
                <header ref={headerRef} className={`w-full z-40 fixed top-0 left-0 border-b transition-all duration-300 ${scrolled ? 'bg-slate-900/90 backdrop-blur-xl border-slate-700/50 py-2 shadow-md' : 'bg-transparent border-transparent py-3'}`}>
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
                            <div className="flex items-center gap-2 scale-90 origin-right">
                                <button onClick={toggleLanguage} className="flex items-center px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all font-bold font-mono tracking-tighter">
                                    <span className={t.lang === 'es' ? 'text-teal-400' : ''}>ES</span>
                                    <span className="mx-1 opacity-30">|</span>
                                    <span className={t.lang === 'en' ? 'text-teal-400' : ''}>EN</span>
                                </button>
                                {userId && <span className={`flex items-center px-2 py-0.5 rounded-full border ${isAnonymous ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' : 'bg-teal-500/10 border-teal-500/20 text-teal-300'} font-semibold shadow-inner`}><Icon name={isAnonymous ? "userCheck" : "activity"} className="w-3.5 h-3.5 mr-2" />{isAnonymous ? t.guest : t.online}</span>}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden minimal-scrollbar pt-16" onScroll={handleScroll}>
                    <div className="max-w-md mx-auto px-4 md:px-0 pb-32">
                        {activeTab === 'training' && 
                            <TrainingTab 
                                profile={profile}
                                onProfileChange={onProfileChange}
                                onGeneratePlan={onGeneratePlan}
                                onAdjustNextSession={onAdjustNextSession}
                                loading={loading}
                                successMessage={successMessage}
                                errorMessage={error}
                                history={history}
                                onViewRoutine={handleViewRoutine}
                                generationProgress={generationProgress}
                                t={t}
                                onAnalyzeBioage={onAnalyzeBioage}
                                bioageLoading={bioageLoading}
                                view={view}
                            />}
                        {activeTab === 'history' && 
                             <HistoryTab 
                                history={history} 
                                t={t} 
                                onViewRoutine={handleViewRoutine}
                                setActiveTab={setActiveTab}
                            />}
                        {activeTab === 'profile' && 
                            <ProfileTab 
                                profile={profile} 
                                onProfileChange={onProfileChange} 
                                onProfileSave={onProfileSave} 
                                onAnalyzeBioage={onAnalyzeBioage} 
                                bioageLoading={bioageLoading} 
                                profileSuccess={profileSuccess} 
                                profileError={profileError}
                                onGenerateBackup={onGenerateBackup}
                                onShowImportModal={() => setIsImportModalOpen(true)} 
                                onSignOut={onSignOutRequest} 
                                isAnonymous={isAnonymous}
                                onLinkAccount={onLinkAccount}
                                linkAccountError={linkAccountError}
                                t={t} 
                            />}
                    </div>
                </main>

                <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
                    <nav className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-full px-6 py-3 flex gap-8 pointer-events-auto">
                        {['training', 'history', 'profile'].map(tab => {
                            const isActive = activeTab === tab;
                            const icons = { training: 'target', history: 'list', profile: 'user' };
                            return (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`relative p-3 rounded-full transition-all duration-300 group ${isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 -translate-y-2 scale-110' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
                                    <Icon name={icons[tab]} className="w-6 h-6" />
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </>
    );
}
