import React from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import TrainingTab from './components/features/TrainingTab';
import HistoryTab from './components/features/HistoryTab';
import ProfileTab from './components/features/ProfileTab';
import { Auth } from './components/features/Auth';
import ActiveSession from './components/features/training/ActiveSession';
import { Icon } from './components/ui/Icon';
import { MinimalScrollbarStyles } from './components/ui/GlobalStyles';
import { SplashScreen } from './components/ui/SplashScreen'; 
import { Card } from './components/ui/LayoutComponents';

// --- Modales Globales (sin cambios) ---
// ...

export default function App() {
    const appLogic = useAppLogic();
    const {
        t, activeTab, view,
        userId, isAuthReady, showSplash,
        scrolled, headerRef, handleScroll,
        setActiveTab,
    } = appLogic;

    if (!isAuthReady || showSplash) {
        return <SplashScreen show={true} />;
    }

    if (!userId) {
        return <Auth {...appLogic} />;
    }

    if (view === 'routine') {
        return <ActiveSession {...appLogic} />;
    }

    return (
        <>
            <MinimalScrollbarStyles />
            
            {/* ... (modales sin cambios, se recomienda moverlos a su propio componente si crecen) ... */}
            
            <div className="h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col overflow-hidden font-sans bg-slate-900 text-slate-100 selection:bg-teal-500/30 relative">
                
                {/* --- A. FONDO DE GRADIENTES CON BLUR --- */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-teal-500/30 to-cyan-500/10 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite]"></div>
                    <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-violet-500/20 to-purple-500/10 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>
                </div>

                <header ref={headerRef} className={`w-full z-40 fixed top-0 left-0 border-b transition-all duration-300 ${scrolled ? 'bg-slate-900/80 backdrop-blur-md border-slate-700/50 py-2 shadow-lg' : 'bg-transparent border-transparent py-3'}`}>
                    {/* ... (contenido del header sin cambios) */}
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden minimal-scrollbar pt-16 z-10" onScroll={handleScroll}>
                    <div className="max-w-md mx-auto px-4 md:px-0 pb-32">
                        {activeTab === 'training' && <TrainingTab {...appLogic} />}
                        {activeTab === 'history' && <HistoryTab {...appLogic} />}
                        {activeTab === 'profile' && <ProfileTab {...appLogic} />}
                    </div>
                </main>

                {/* --- D. BARRA DE NAVEGACIÓN DE CRISTAL --- */}
                <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
                    <nav className="bg-black/30 backdrop-blur-md border border-white/10 shadow-2xl rounded-full px-6 py-3 flex gap-8 pointer-events-auto">
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
