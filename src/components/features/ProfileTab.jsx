import React, { useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { InputField, BioageInput } from '../ui/LayoutComponents';
import { calculateCyclePhase } from '../../utils/helpers';

// --- COMPONENTES DE DISEÑO PARA EL PERFIL ---

const GlassCard = ({ icon, title, children }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md mb-6 overflow-hidden">
        <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
                <Icon name={icon} className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{title}</h3>
            </div>
        </div>
        <div className="p-4 space-y-4">
            {children}
        </div>
    </div>
);

const HeroProfileEditable = ({ profile, onProfileChange, t }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Icon name="user" className="w-10 h-10 text-white" />
        </div>
        <div className="w-full space-y-2">
            <InputField 
                name="name" 
                value={profile.name || ''} 
                onChange={onProfileChange} 
                className="!text-3xl !font-bold !p-0 !bg-transparent !border-none"
            />
            <InputField
                as="select"
                name="fitnessLevel"
                value={profile.fitnessLevel || 'beginner'}
                onChange={onProfileChange}
                className="!text-sm !font-semibold !p-1 !bg-teal-900/50 !border-teal-500/30 !text-teal-400"
            >
                <option value="beginner">{t.beginner || "Principiante"}</option>
                <option value="intermediate">{t.intermediate || "Intermedio"}</option>
                <option value="advanced">{t.advanced || "Avanzado"}</option>
            </InputField>
        </div>
    </div>
);


export default function ProfileTab(props) {
    const { 
        profile, onProfileChange, onSignOut, t, isAnonymous, onLinkAccount, linkAccountError,
        onAnalyzeBioage, bioageLoading, profileError, profileSuccess
    } = props;

    const handleComplexChange = (name, nestedValue) => {
        onProfileChange({ target: { name, value: { ...profile[name], ...nestedValue } } });
    };

    const handleBioChange = (e) => {
        const field = e.target.name.replace('bio_', '');
        handleComplexChange('bioage', { [field]: e.target.value });
    };
    
    const cyclePhase = useMemo(() => {
        if (profile.trackCycle && profile.menstrualCycle?.lastPeriod) {
            return calculateCyclePhase(
                profile.menstrualCycle.lastPeriod,
                profile.menstrualCycle.cycleLength || 28,
                profile.menstrualCycle.periodLength || 5
            );
        }
        return null;
    }, [profile.trackCycle, profile.menstrualCycle]);
    
    const bioageEvaluationSummary = useMemo(() => {
        if (!profile.bioageEstimation) return null;
        const { strengths, weaknesses, recommendations } = profile.bioageEstimation;
        let summary = [];
        if (strengths?.length > 0) summary.push(`${t.strengthsLabel || "Fortalezas"}: ${strengths.join(', ')}.`);
        if (weaknesses?.length > 0) summary.push(`${t.weaknessesLabel || "Debilidades"}: ${weaknesses.join(', ')}.`);
        if (recommendations?.length > 0) summary.push(`${t.recommendationsLabel || "Recomendaciones"}: ${recommendations.join(', ')}.`);
        return summary.join(' ');
    }, [profile.bioageEstimation, t]);

    return (
        <div className="pb-24 p-4 animate-fadeIn">
            <HeroProfileEditable profile={profile} onProfileChange={onProfileChange} t={t} />

            {isAnonymous && <GlassCard icon="shieldCheck" title={t.saveAccountPrompt}>{/* LinkAccountSection aqui si se necesita */}</GlassCard>}

            <GlassCard icon="user" title={t.biometrics || "Datos Básicos"}>
                <div className="grid grid-cols-2 gap-4">
                    <InputField name="birthdate" type="date" value={profile.birthdate || ''} onChange={onProfileChange} label={t.birthdateLabel || "Fecha de Nacimiento"} />
                    <InputField name="gender" as="select" value={profile.gender || 'female'} onChange={onProfileChange} label={t.genderLabel || "Género"}>
                        <option value="female">{t.female || "Mujer"}</option>
                        <option value="male">{t.male || "Hombre"}</option>
                    </InputField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <InputField name="height" type="number" value={profile.height || ''} onChange={onProfileChange} label={t.heightLabel || "Altura (cm)"} />
                    <InputField name="weight" type="number" value={profile.weight || ''} onChange={onProfileChange} label={t.weightLabel || "Peso (kg)"} />
                </div>
            </GlassCard>
            
            <GlassCard icon="target" title={t.myGoalTitle || "Mi Meta y Preferencias"}>
                 <InputField name="goal" as="select" value={profile.goal || 'fat_loss'} onChange={onProfileChange} label={t.mainGoal || "Objetivo Principal"}>
                     <option value="fat_loss">{t.goalFat || "Perder Grasa"}</option>
                     <option value="muscle">{t.goalMuscle || "Hipertrofia"}</option>
                     <option value="strength">{t.goalStrength || "Fuerza Máxima"}</option>
                     <option value="endurance">{t.goalCardio || "Resistencia"}</option>
                </InputField>
                <div className="grid grid-cols-2 gap-4">
                    <InputField name="daysPerWeek" as="select" value={profile.daysPerWeek || 3} onChange={onProfileChange} label={t.daysWeek || "Días/Semana"}>
                        {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} {t.days || "días"}</option>)}
                    </InputField>
                    <InputField name="timeAvailable" type="number" value={profile.timeAvailable} onChange={onProfileChange} label={t.timeAvailableLabel || "Tiempo disponible"} unit="min" />
                </div>
                <InputField as="textarea" name="injuries" value={profile.injuries || ''} onChange={onProfileChange} label={t.injuries || "Deseos / Consideraciones"} placeholder={t.myGoalPlaceholder} />
            </GlassCard>
            
            {profile.gender === 'female' && (
                <GlassCard title={t.cycleTitle || "Salud Femenina"} icon="heart">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-black/20">
                        <div>
                            <h4 className="text-sm font-bold text-slate-100">{t.cycleTrackingTitle}</h4>
                            <p className="text-xs text-slate-400">{t.cycleTrackingDesc}</p>
                        </div>
                        <input type="checkbox" name="trackCycle" checked={profile.trackCycle || false} onChange={onProfileChange} className="toggle-checkbox" />
                    </div>
                    {profile.trackCycle && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 mt-4">
                            <InputField type="date" name="lastPeriod" value={profile.menstrualCycle?.lastPeriod || ''} onChange={e => handleComplexChange('menstrualCycle', { lastPeriod: e.target.value })} label={t.lastPeriodLabel} />
                            <InputField type="number" name="cycleLength" value={profile.menstrualCycle?.cycleLength || ''} onChange={e => handleComplexChange('menstrualCycle', { cycleLength: e.target.value })} label={t.cycleLengthLabel} />
                            {cyclePhase && <div className="col-span-2 mt-1 text-xs text-center p-2 bg-violet-900/30 border border-violet-500/20 rounded-lg text-violet-200">
                                {t.currentPhase}: <span className="font-bold uppercase">{t[cyclePhase.phase] || cyclePhase.phase}</span>
                            </div>}
                        </div>
                    )}
                </GlassCard>
            )}

            <GlassCard title={t.bioageTitle || "Análisis Bio-Age"} icon="scanEye">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <BioageInput name="sq1rm" value={profile.bioage?.sq1rm} onChange={handleBioChange} unit="kg" label={t.squat1rm} />
                    <BioageInput name="plank" value={profile.bioage?.plank} onChange={handleBioChange} unit="seg" label={t.plank} />
                    <BioageInput name="pullups" value={profile.bioage?.pullups} onChange={handleBioChange} unit="reps" label={t.pullups} />
                    <BioageInput name="pushups" value={profile.bioage?.pushups} onChange={handleBioChange} unit="reps" label={t.pushups} />
                    <BioageInput name="waist" value={profile.bioage?.waist} onChange={handleBioChange} unit="cm" label={t.waist} />
                    <BioageInput name="vo2max" value={profile.bioage?.vo2max} onChange={handleBioChange} unit="ml" label={t.vo2max} />
                    <BioageInput name="rhr" value={profile.bioage?.rhr} onChange={handleBioChange} unit="bpm" label={t.rhr} />
                    <BioageInput name="hrr" value={profile.bioage?.hrr} onChange={handleBioChange} unit="bpm" label={t.hrr} />
                </div>
                <button onClick={() => onAnalyzeBioage()} disabled={bioageLoading} className="w-full py-3 mt-4 rounded-xl bg-white/5 border border-white/10 text-teal-400 hover:bg-white/10 transition-all font-bold text-xs flex items-center justify-center gap-2">
                    {bioageLoading ? <Icon name="loader" className="w-4 h-4 animate-spin"/> : <Icon name="brain" className="w-4 h-4"/>}
                    {bioageLoading ? t.processing : t.calcBioAge}
                </button>
                {profile.bioageEstimation && (
                     <div className="p-3 mt-4 bg-violet-900/20 border border-violet-500/30 rounded-xl animate-fadeIn space-y-2">
                        <div className="flex justify-around items-center text-center">
                            <div>
                                <div className="text-[10px] uppercase text-violet-400 font-bold">{t.realAge || "Edad Real"}</div>
                                <div className="text-2xl font-bold text-slate-300">{profile.age}</div>
                            </div>
                            <Icon name="arrowRight" className="text-violet-500/50 w-6 h-6"/>
                            <div>
                                <div className="text-[10px] uppercase text-teal-400 font-bold">{t.bioAgeResult || "Edad Bio"}</div>
                                <div className="text-3xl font-black text-teal-300">{profile.bioageEstimation.bioage}</div>
                            </div>
                        </div>
                        {bioageEvaluationSummary && <p className="text-xs text-slate-300 italic text-center border-t border-violet-500/20 pt-2">"{bioageEvaluationSummary}"</p>}
                    </div>
                )}
            </GlassCard>

            <div className="mt-8 text-center">
                <button onClick={onSignOut} className="text-slate-500 hover:text-red-400 text-xs font-bold transition-colors py-2 px-4 rounded-lg flex items-center gap-2 mx-auto">
                    <Icon name="logOut" className="w-4 h-4" />
                    {t.signOut || "Cerrar Sesión"}
                </button>
            </div>
            
            {/* Mensajes de feedback */}
            {profileError && <p className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-900/80 text-white text-xs py-2 px-4 rounded-lg shadow-lg backdrop-blur-md">{profileError}</p>}
            {profileSuccess && <p className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-600/80 text-white text-xs py-2 px-4 rounded-lg shadow-lg backdrop-blur-md">{profileSuccess}</p>}
        </div>
    );
}
