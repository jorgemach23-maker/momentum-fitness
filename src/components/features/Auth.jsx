import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { PasswordInput } from '../ui/PasswordInput';

const AuthForm = ({ mode, onSubmit, error, t, setMode, onPasswordReset, resetEmailSent, setResetEmailSent, setAuthError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        // Limpiar campos de texto al cambiar de modo, el resto se gestiona en el padre
        setEmail('');
        setPassword('');
    }, [mode]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'reset') {
            handleReset();
        } else {
            onSubmit(email, password);
        }
    };

    const handleReset = async () => {
        const success = await onPasswordReset(email);
        if (success) {
            setResetEmailSent(true);
        }
    };

    const titles = { signin: t.signIn, signUp: t.signUp, reset: t.resetPassword };
    const buttonTexts = { signin: t.signIn, signUp: t.signUp, reset: t.resetPassword };

    if (resetEmailSent) {
        return (
            <div className="text-center animate-fadeIn">
                <Icon name="checkCircle" className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">{t.resetEmailSentTitle}</h2>
                <p className="text-slate-300 mb-6">{t.resetEmailSentMessage}</p>
                <button 
                    onClick={() => setMode('signin')} 
                    className="w-full text-center text-teal-400 font-semibold hover:text-teal-300 transition-colors"
                >
                    {t.backToLogin}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            <h2 className="text-3xl font-bold text-center text-white">{titles[mode]}</h2>
            
            {mode === 'reset' && <p className="text-center text-slate-400 text-sm">{t.resetPasswordPrompt}</p>}

            <div className="space-y-4">
                 <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    required
                />
                {mode !== 'reset' && (
                    <PasswordInput 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        t={t}
                    />
                )}
            </div>

            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/30">{error}</p>}

            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-teal-900/30 transition-colors">
                {buttonTexts[mode]}
            </button>
        </form>
    );
};

export function Auth({ onSignIn, onSignUp, onAnonymousSignIn, onPasswordReset, error, t, setAuthError }) {
    const [mode, setMode] = useState('signin'); // 'signin', 'signup', or 'reset'
    const [resetEmailSent, setResetEmailSent] = useState(false);

    const handleSetMode = (newMode) => {
        setAuthError(null);
        setResetEmailSent(false);
        setMode(newMode);
    }

    const switchModeText = mode === 'signin' ? t.signUp : t.signIn;
    const switchModeAction = () => handleSetMode(mode === 'signin' ? 'signup' : 'signin');

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-8">
                     <Icon name="dumbbell" className="w-12 h-12 mx-auto text-teal-400 bg-teal-900/30 p-2 rounded-xl border border-teal-500/20"/>
                    <h1 className="text-4xl font-bold text-white mt-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Momentum AI</h1>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
                    <AuthForm 
                        mode={mode} 
                        onSubmit={mode === 'signin' ? onSignIn : onSignUp}
                        onPasswordReset={onPasswordReset}
                        error={error} 
                        t={t}
                        setMode={handleSetMode}
                        setAuthError={setAuthError}
                        resetEmailSent={resetEmailSent}
                        setResetEmailSent={setResetEmailSent}
                    />

                    <div className="text-center mt-6 text-sm">
                        {mode === 'signin' && (
                            <button onClick={() => handleSetMode('reset')} className="text-slate-400 hover:text-teal-400 transition-colors mb-4">
                                {t.forgotPassword}
                            </button>
                        )}
                         {mode === 'reset' && !resetEmailSent && (
                            <button onClick={() => handleSetMode('signin')} className="text-slate-400 hover:text-teal-400 transition-colors mb-4">
                                {t.backToLogin}
                            </button>
                        )}
                    </div>
                    
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-800 text-slate-500">o</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button onClick={switchModeAction} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors">
                            {switchModeText}
                        </button>
                        <button onClick={onAnonymousSignIn} className="w-full text-center text-slate-400 font-semibold hover:text-white transition-colors">
                            {t.signInGuest}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}