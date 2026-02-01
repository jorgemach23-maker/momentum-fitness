import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Card, InputField, BioageInput } from '../ui/LayoutComponents';
import { PasswordInput } from '../ui/PasswordInput';
import { calculateCyclePhase } from '../../utils/helpers';

const LinkAccountSection = ({ onLinkAccount, t, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        const result = await onLinkAccount(email, password);
        setLoading(false);
        if (result) {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <Card className="p-6 border-green-500/30 bg-green-900/20">
                <div className="text-center">
                    <Icon name="checkCircle" className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white">{t.accountLinkedTitle}</h3>
                    <p className="text-green-200/80 text-sm">{t.accountLinkedMessage}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 border-teal-500/30 bg-slate-800/50">
            <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icon name="shieldCheck" className="w-4 h-4"/> {t.saveAccountPrompt}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{t.saveAccountMessage}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    required
                />
                <PasswordInput 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    t={t}
                />
                <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold py-2.5 rounded-lg text-sm shadow-lg shadow-teal-900/30 transition-all flex items-center justify-center gap-2">
                    {loading ? <><Icon name="loader" className="animate-spin w-5 h-5"/> {t.processing}</> : t.saveAccountButton}
                </button>
                {error && !loading && <p className="text-red-400 text-xs text-center pt-2 animate-fadeIn">{error}</p>}
            </form>
        </Card>
    );
};

const BioageProfileSection = ({ profile, onChange, onAnalyzeBioage, bioageLoading, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const bio = profile.bioage || {};
  const handleBioChange = (e) => { const field = e.target.name.replace('bio_', ''); onChange({ target: { name: 'bioage', value: { ...bio, [field]: e.target.value } } }); };
  
  const bioageEvaluationSummary = useMemo(() => {
    if (!profile.bioageEstimation) return null;
    const { strengths, weaknesses, recommendations } = profile.bioageEstimation;
    let summary = [];
    if (strengths && strengths.length > 0) summary.push(`Fortalezas: ${strengths.join(', ')}.`);
    if (weaknesses && weaknesses.length > 0) summary.push(`Debilidades: ${weaknesses.join(', ')}.`);
    if (recommendations && recommendations.length > 0) summary.push(`Recomendaciones: ${recommendations.join(', ')}.`);
    return summary.join(' ');
  }, [profile.bioageEstimation]);

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80 overflow-hidden shadow-lg transition-all duration-300">
       <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20"><Icon name="scanEye" className="w-5 h-5" /></div><div className="text-left"><h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{t.bioageTitle}</h3></div></div>
          <Icon name={isOpen ? "chevronUp" : "chevronDown"} className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
       </button>
       {isOpen && (
          <div className="p-5 pt-0 animate-fadeIn border-t border-slate-700/50">
             <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4"><BioageInput name="sq1rm" value={bio.sq1rm} onChange={handleBioChange} unit="kg" label="Squat 1RM" /><BioageInput name="plank" value={bio.plank} onChange={handleBioChange} unit="seg" label="Plank" /></div>
                <div className="grid grid-cols-2 gap-4"><BioageInput name="pullups" value={bio.pullups} onChange={handleBioChange} unit="reps" label="Dominadas" /><BioageInput name="pushups" value={bio.pushups} onChange={handleBioChange} unit="reps" label="Flexiones" /></div>
                <div className="grid grid-cols-2 gap-3"><BioageInput name="waist" value={bio.waist} onChange={handleBioChange} unit="cm" label="Cintura" /><BioageInput name="vo2max" value={bio.vo2max} onChange={handleBioChange} unit="ml" label="VO2 Max" /></div>
                <div className="grid grid-cols-2 gap-3"><BioageInput name="rhr" value={bio.rhr} onChange={handleBioChange} unit="bpm" label="FC Reposo" /><BioageInput name="hrr" value={bio.hrr} onChange={handleBioChange} unit="bpm" label="Recuperación" /></div>
                <button onClick={() => onAnalyzeBioage(profile)} disabled={bioageLoading} className="w-full py-3 rounded-xl bg-slate-800 border border-teal-500/30 text-teal-400 hover:bg-slate-700/80 transition-all font-bold text-xs flex items-center justify-center gap-2">{bioageLoading ? <Icon name="loader" className="w-4 h-4 animate-spin"/> : <Icon name="brain" className="w-4 h-4"/>} {bioageLoading ? t.processing : t.calcBioAge}</button>
                
                {profile.bioageEstimation && (
                  <div className="mt-4 p-4 bg-violet-900/20 border border-violet-500/30 rounded-xl animate-fadeIn">
                    <div className="flex justify-between items-center mb-2">
                       <div>
                          <div className="text-[10px] uppercase text-violet-400 font-bold">{t.realAge}</div>
                          <div className="text-xl font-mono text-slate-300">{profile.age} <span className="text-xs">años</span></div>
                       </div>
                       <Icon name="arrowRight" className="text-violet-500/50 w-6 h-6"/>
                       <div className="text-right">
                          <div className="text-[10px] uppercase text-teal-400 font-bold">{t.bioAgeResult}</div>
                          <div className="text-3xl font-black text-teal-300 drop-shadow-sm">{profile.bioageEstimation.bioage} <span className="text-base font-normal text-teal-500/80">años</span></div>
                       </div>
                    </div>
                    {bioageEvaluationSummary && (
                        <div className="text-xs text-slate-300 italic border-t border-violet-500/20 pt-2 mt-2 leading-relaxed">
                            "{bioageEvaluationSummary}"
                        </div>
                    )}
                  </div>
                )}
             </div>
          </div>
       )}
    </div>
  );
};

// ... (El resto del código se mantiene igual)

export default function ProfileTab({ profile, onProfileChange, onProfileSave, onSignOut, profileSuccess, profileError, onAnalyzeBioage, bioageLoading, t, isAnonymous, onLinkAccount, linkAccountError }) {
  // ... (El resto del código se mantiene igual)
}
