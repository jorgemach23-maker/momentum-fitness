import React, { useState, useEffect, useRef } from 'react';
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
                          <div className="text-3xl font-black text-teal-300 drop-shadow-sm">{profile.bioageEstimation.edadBiologica} <span className="text-base font-normal text-teal-500/80">años</span></div>
                       </div>
                    </div>
                    {profile.bioageEstimation.evaluacion && (
                        <div className="text-xs text-slate-300 italic border-t border-violet-500/20 pt-2 mt-2 leading-relaxed">
                        "{profile.bioageEstimation.evaluacion}"
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

const AccordionSection = ({ icon, title, iconColor, children, defaultOpen = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border border-white/5 bg-slate-900/40 overflow-hidden shadow-lg transition-all duration-300 ${className}`}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-white/5 ${iconColor} border border-white/5`}>
            <Icon name={icon} className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{title}</h3>
          </div>
        </div>
        <Icon name={isOpen ? "chevronUp" : "chevronDown"} className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
      </button>
      {isOpen && (
        <div className="p-6 pt-0 animate-fadeIn border-t border-slate-800/50">
          <div className="mt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const CycleSyncSection = ({ profile, onChange, t }) => {
    if (profile.gender !== 'Mujer') return null;
    const cycle = profile.menstrualCycle || { lastPeriod: '', cycleLength: 28 };
    const currentPhase = calculateCyclePhase(cycle.lastPeriod, cycle.cycleLength);
    const handleCycleChange = (e) => onChange({ target: { name: 'menstrualCycle', value: { ...cycle, [e.target.name]: e.target.value } } });
    
    return (
        <AccordionSection 
            icon="flower" 
            title={t.cycleTitle || "Salud Femenina"} 
            iconColor="text-pink-400"
            className="border-pink-500/10"
        >
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.lastPeriod || "Última fecha"}</label>
                        <input type="date" name="lastPeriod" value={cycle.lastPeriod} onChange={handleCycleChange} className="w-full bg-slate-900/70 border border-slate-700 text-slate-100 rounded-lg py-2.5 px-3 text-sm outline-none focus:ring-1 focus:ring-pink-500/50" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.cycleLength || "Duración"}</label>
                        <input type="number" name="cycleLength" value={cycle.cycleLength} onChange={handleCycleChange} className="w-full bg-slate-900/70 border border-slate-700 text-slate-100 rounded-lg py-2.5 px-3 text-sm outline-none focus:ring-1 focus:ring-pink-500/50" />
                    </div>
                </div>
                {currentPhase && (
                    <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4 shadow-inner">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                            <h4 className="text-sm font-black text-pink-200 uppercase tracking-tight">{currentPhase.label}</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{currentPhase.desc}</p>
                    </div>
                )}
            </div>
        </AccordionSection>
    );
};

export default function ProfileTab({ profile, onProfileChange, onProfileSave, onSignOut, profileSuccess, profileError, onAnalyzeBioage, bioageLoading, t, isAnonymous, onLinkAccount, linkAccountError }) {
  const saveTimeout = useRef(null);

  // Auto-save logic: Guardar cuando el perfil cambia (con debounce)
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    
    saveTimeout.current = setTimeout(() => {
      onProfileSave(profile);
    }, 1500); // Guardar después de 1.5s de inactividad

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [profile, onProfileSave]);

  return (
    <div className="animate-fadeIn pb-20 space-y-4">
      {isAnonymous && <LinkAccountSection onLinkAccount={onLinkAccount} t={t} error={linkAccountError} />}

      <div className="space-y-4">
        {/* SECCIÓN DATOS BÁSICOS (ACORDEÓN) */}
        <AccordionSection icon="user" title={t.biometrics || "Datos básicos"} iconColor="text-teal-400" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-6">
            <InputField label={t.gender} icon="user" type="select" name="gender" value={profile.gender} onChange={onProfileChange} options={[{value:'Hombre',label:t.male},{value:'Mujer',label:t.female}]} />
            <InputField label={t.age} icon="calendar" type="number" name="age" value={profile.age} onChange={onProfileChange} />
            <InputField label={t.height} icon="ruler" type="number" name="height" value={profile.height} onChange={onProfileChange} />
            <InputField label={t.weight} icon="weight" type="number" name="weight" value={profile.weight} onChange={onProfileChange} />
          </div>
          <div className="mt-6 pt-6 border-t border-slate-700/50 grid grid-cols-2 gap-6">
             <BioageInput name="bodyFat" value={profile.bodyFat} onChange={onProfileChange} unit="%" label={t.bodyFat} tooltip="Opcional: Grasa" isBio={false} />
             <BioageInput name="muscleMass" value={profile.muscleMass} onChange={onProfileChange} unit="%" label={t.muscleMass} tooltip="Opcional: Músculo" isBio={false} />
          </div>
        </AccordionSection>
        
        <CycleSyncSection profile={profile} onChange={onProfileChange} t={t} />
        
        <BioageProfileSection profile={profile} onChange={onProfileChange} onAnalyzeBioage={onAnalyzeBioage} bioageLoading={bioageLoading} t={t} />

        {/* SECCIÓN MI META (ACORDEÓN) */}
        <AccordionSection icon="target" title={t.myGoal || "Mi meta"} iconColor="text-violet-400">
          <div className="space-y-6">
             <InputField label={t.mainGoal} icon="star" type="select" name="mainGoal" value={profile.mainGoal} onChange={onProfileChange} options={[{value: 'Perder grasa corporal', label: t.goalFat},{value: 'Crecimiento muscular (Hipertrofia)', label: t.goalMuscle || 'Crecimiento Muscular'},{value: 'Incremento de fuerza', label: t.goalStrength || 'Fuerza'},{value: 'Mejora de rendimiento cardiovascular', label: t.goalCardio || 'Cardio'}]} />
             <InputField label={t.expLevel} icon="activity" type="select" name="experienceLevel" value={profile.experienceLevel} onChange={onProfileChange} options={[{value: 'Principiante', label: t.beginner},{value: 'Intermedio', label: t.intermediate},{value: 'Avanzado', label: t.advanced}]} />
             <div className="grid grid-cols-2 gap-6"><InputField label={t.daysWeek} icon="calendar" type="number" name="daysPerWeek" value={profile.daysPerWeek} onChange={onProfileChange} /><InputField label={t.timeAvailable} icon="clock" type="number" name="timeAvailable" value={profile.timeAvailable} onChange={onProfileChange} /></div>
             <InputField label={t.considerations || "Deseos / Consideraciones"} icon="alert" type="text" name="injuries" value={profile.injuries} onChange={onProfileChange} placeholder={t.phInjuries} isTextArea={true} />
          </div>
        </AccordionSection>

        {/* FEEDBACK DE GUARDADO AUTOMÁTICO */}
        <div className="flex flex-col gap-2 pt-2">
            {profileSuccess && <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-teal-400/80 text-[10px] font-bold uppercase tracking-widest text-center animate-pulse flex items-center justify-center gap-2"><Icon name="cloudUpload" className="w-3 h-3"/> {t.profileAutoSaved || 'Expediente actualizado'}</div>}
            {profileError && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium text-center shadow-sm">{profileError}</div>}
        </div>
      </div>

      <div className="pt-8">
        <button onClick={onSignOut} className="w-full p-4 bg-slate-900/40 hover:bg-red-900/20 border border-white/5 rounded-2xl text-xs font-bold flex items-center justify-center gap-3 transition-all text-slate-500 hover:text-red-400 active:scale-95 shadow-lg group">
            <Icon name="logOut" className="w-4 h-4 group-hover:rotate-12 transition-transform" /> {t.signOut}
        </button>
      </div>

    </div>
  );
}
