import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { Card, InputField, BioageInput } from '../ui/LayoutComponents';
import { PasswordInput } from '../ui/PasswordInput';
import { calculateCyclePhase } from '../../utils/helpers';

// Componente de Acordeón Reutilizable
const AccordionSection = ({ title, icon, children, isOpen, onToggle, t }) => {
    return (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 overflow-hidden shadow-lg transition-all duration-300 mb-4">
            <button 
                type="button" 
                onClick={onToggle} 
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        <Icon name={icon} className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{title}</h3>
                    </div>
                </div>
                <Icon 
                    name="chevronDown" 
                    className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
                />
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-5 pt-0 border-t border-slate-700/50">
                    <div className="mt-4 animate-fadeIn">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

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
            <Card className="p-6 border-green-500/30 bg-green-900/20 mb-6">
                <div className="text-center">
                    <Icon name="checkCircle" className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white">{t.accountLinkedTitle || "¡Cuenta Vinculada!"}</h3>
                    <p className="text-green-200/80 text-sm">{t.accountLinkedMessage || "Tus datos ahora están seguros en la nube."}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 border-teal-500/30 bg-slate-800/50 mb-6">
            <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icon name="shieldCheck" className="w-4 h-4"/> {t.saveAccountPrompt || "Protege tu Progreso"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{t.saveAccountMessage || "Crea una cuenta para no perder tus datos si cambias de dispositivo."}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder || "tu@email.com"}
                    className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    required
                />
                <PasswordInput 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder || "Contraseña segura"}
                    t={t}
                />
                <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold py-2.5 rounded-lg text-sm shadow-lg shadow-teal-900/30 transition-all flex items-center justify-center gap-2">
                    {loading ? <><Icon name="loader" className="animate-spin w-5 h-5"/> {t.processing || "Procesando..."}</> : (t.saveAccountButton || "Crear Cuenta")}
                </button>
                {error && !loading && <p className="text-red-400 text-xs text-center pt-2 animate-fadeIn">{error}</p>}
            </form>
        </Card>
    );
};

export default function ProfileTab({ profile, onProfileChange, onProfileSave, onSignOut, profileSuccess, profileError, onAnalyzeBioage, bioageLoading, t, isAnonymous, onLinkAccount, linkAccountError }) {
    const [localProfile, setLocalProfile] = useState({ ...profile });
    const [openSections, setOpenSections] = useState({ basic: true, goals: false, cycle: false, bioage: false });
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved
    const saveTimeoutRef = useRef(null);

    // Actualizar localProfile cuando cambia profile (pero evitar loop infinito si es por nuestro guardado)
    // Solo si es significativamente diferente o es carga inicial
    useEffect(() => {
        // Simple check para no sobrescribir cambios locales pendientes
        // En una app real usaríamos deep equal o timestamps
        if (saveStatus === 'idle') {
            setLocalProfile(prev => ({ ...prev, ...profile }));
        }
    }, [profile]);

    // Efecto de autoguardado (Debounce)
    useEffect(() => {
        // No guardar en la carga inicial si no hubo cambios
        if (saveStatus === 'idle') return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setSaveStatus('saving');

        saveTimeoutRef.current = setTimeout(() => {
            onProfileSave(localProfile);
            // El estado 'saved' se seteará cuando profileSuccess cambie
        }, 1500); // 1.5s delay

        return () => clearTimeout(saveTimeoutRef.current);
    }, [localProfile]);

    // Feedback visual de guardado exitoso
    useEffect(() => {
        if (profileSuccess && saveStatus === 'saving') {
            setSaveStatus('saved');
            const timer = setTimeout(() => setSaveStatus('idle'), 2000);
            return () => clearTimeout(timer);
        }
    }, [profileSuccess]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Marcar que hubo un cambio para activar el efecto de guardado
        if (saveStatus === 'idle') setSaveStatus('saving'); 

        let newProfile;
        if (name === 'menstrualCycle') {
            newProfile = { ...localProfile, menstrualCycle: { ...localProfile.menstrualCycle, ...value } };
        } else if (name === 'bioage') {
            newProfile = { ...localProfile, bioage: { ...localProfile.bioage, ...value } };
        } else {
            newProfile = { ...localProfile, [name]: type === 'checkbox' ? checked : value };
        }
        
        setLocalProfile(newProfile);
        
        if (onProfileChange) {
            onProfileChange({ target: { name, value: type === 'checkbox' ? checked : value } });
        }
    };

    const handleBioChange = (e) => { 
        if (saveStatus === 'idle') setSaveStatus('saving');
        const field = e.target.name.replace('bio_', ''); 
        const newProfile = { ...localProfile, bioage: { ...localProfile.bioage, [field]: e.target.value } };
        setLocalProfile(newProfile);
        if (onProfileChange) {
             handleChange({ target: { name: 'bioage', value: newProfile.bioage } });
        }
    };

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const cyclePhase = useMemo(() => {
        if (localProfile.trackCycle && localProfile.menstrualCycle?.lastPeriod) {
            return calculateCyclePhase(
                localProfile.menstrualCycle.lastPeriod,
                localProfile.menstrualCycle.cycleLength || 28,
                localProfile.menstrualCycle.periodLength || 5
            );
        }
        return null;
    }, [localProfile.trackCycle, localProfile.menstrualCycle]);

    const bioageEvaluationSummary = useMemo(() => {
        if (!localProfile.bioageEstimation) return null;
        const { strengths, weaknesses, recommendations } = localProfile.bioageEstimation;
        let summary = [];
        if (strengths && strengths.length > 0) summary.push(`${t.strengthsLabel || "Fortalezas"}: ${strengths.join(', ')}.`);
        if (weaknesses && weaknesses.length > 0) summary.push(`${t.weaknessesLabel || "Debilidades"}: ${weaknesses.join(', ')}.`);
        if (recommendations && recommendations.length > 0) summary.push(`${t.recommendationsLabel || "Recomendaciones"}: ${recommendations.join(', ')}.`);
        return summary.join(' ');
    }, [localProfile.bioageEstimation, t]);

    const bio = localProfile.bioage || {};

    return (
        <div className="pb-24 space-y-6 p-4">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {t.profileTitle || "Tu Perfil"}
                        {saveStatus === 'saving' && <span className="text-[10px] font-normal text-teal-400 animate-pulse bg-teal-900/30 px-2 py-0.5 rounded-full">{t.processing || "Guardando..."}</span>}
                        {saveStatus === 'saved' && <span className="text-[10px] font-normal text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">{t.saved || "¡Guardado!"}</span>}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">{t.profileSub || "Mantén tus datos actualizados"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onSignOut} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:bg-red-900/50 hover:text-red-300 hover:border-red-700 transition-colors" aria-label={t.signOut || "Cerrar sesión"}>
                        <Icon name="logOut" className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {isAnonymous && <LinkAccountSection onLinkAccount={onLinkAccount} t={t} error={linkAccountError} />}

            {/* SECCIÓN 1: DATOS BÁSICOS */}
            <AccordionSection 
                title={t.biometrics || "Datos Básicos"} 
                icon="user" 
                isOpen={openSections.basic} 
                onToggle={() => toggleSection('basic')}
                t={t}
            >
                <div className="space-y-4">
                    <InputField name="name" value={localProfile.name || ''} onChange={handleChange} label={t.nameLabel || "Nombre"} />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <InputField name="age" type="number" value={localProfile.age || ''} onChange={handleChange} label={t.ageLabel || "Edad"} />
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">{t.genderLabel || "Género"}</label>
                            <select name="gender" value={localProfile.gender || 'female'} onChange={handleChange} className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-800/50 disabled:text-slate-500">
                                <option value="female">{t.female || "Mujer"}</option>
                                <option value="male">{t.male || "Hombre"}</option>
                                <option value="other">{t.other || "Otro"}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField name="height" type="number" value={localProfile.height || ''} onChange={handleChange} label={t.heightLabel || "Altura (cm)"} />
                        <InputField name="weight" type="number" value={localProfile.weight || ''} onChange={handleChange} label={t.weightLabel || "Peso (kg)"} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField name="bodyFat" type="number" value={localProfile.bodyFat || ''} onChange={handleChange} label={t.bodyFatLabel || "% Grasa"} />
                        <InputField name="muscleMass" type="number" value={localProfile.muscleMass || ''} onChange={handleChange} label={t.muscleMassLabel || "% Músculo"} />
                    </div>
                </div>
            </AccordionSection>

            {/* SECCIÓN 2: MIS METAS Y PREFERENCIAS */}
            <AccordionSection 
                title={t.myGoalTitle || "Mi Meta y Preferencias"} 
                icon="target" 
                isOpen={openSections.goals} 
                onToggle={() => toggleSection('goals')}
                t={t}
            >
                <div className="space-y-4">
                    {/* Objetivo Principal */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">{t.mainGoal || "Objetivo Principal"}</label>
                        <select name="goal" value={localProfile.goal || 'fat_loss'} onChange={handleChange} className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-800/50 disabled:text-slate-500">
                            <option value="fat_loss">{t.goalFat || "Perder Grasa"}</option>
                            <option value="muscle">{t.goalMuscle || "Hipertrofia"}</option>
                            <option value="strength">{t.goalStrength || "Fuerza Máxima"}</option>
                            <option value="endurance">{t.goalCardio || "Resistencia"}</option>
                        </select>
                    </div>

                    {/* Nivel de Experiencia */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">{t.fitnessLevel || "Nivel de Experiencia"}</label>
                        <select name="fitnessLevel" value={localProfile.fitnessLevel || 'beginner'} onChange={handleChange} className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-800/50 disabled:text-slate-500">
                            <option value="beginner">{t.beginner || "Principiante"}</option>
                            <option value="intermediate">{t.intermediate || "Intermedio"}</option>
                            <option value="advanced">{t.advanced || "Avanzado"}</option>
                        </select>
                    </div>

                    {/* Días y Tiempo Disponible */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">{t.daysWeek || "Días/Semana"}</label>
                            <select name="daysPerWeek" value={localProfile.daysPerWeek || 3} onChange={handleChange} className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-800/50 disabled:text-slate-500">
                                {[1,2,3,4,5,6,7].map(d => (
                                    <option key={d} value={d}>{d} {t.days || "días"}</option>
                                ))}
                            </select>
                        </div>
                        <InputField 
                            name="timeAvailable" 
                            type="number" 
                            value={localProfile.timeAvailable || 60} 
                            onChange={handleChange} 
                            label={t.timeAvailable || "Minutos/Sesión"} 
                        />
                    </div>

                    {/* Consideraciones / Lesiones / Deseos */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">{t.injuries || "Deseos / Consideraciones"}</label>
                        <textarea 
                            name="injuries" 
                            value={localProfile.injuries || ''} 
                            onChange={handleChange} 
                            placeholder={t.myGoalPlaceholder || "Ej: Dolor de rodilla, quiero enfocarme en glúteos..."} 
                            className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-800/50 disabled:text-slate-500" 
                            rows="3"
                        ></textarea>
                    </div>
                </div>
            </AccordionSection>

            {/* SECCIÓN 3: SALUD FEMENINA (Solo si es mujer) */}
            {localProfile.gender === 'female' && (
                <AccordionSection 
                    title={t.cycleTitle || "Salud Femenina"} 
                    icon="heart" 
                    isOpen={openSections.cycle} 
                    onToggle={() => toggleSection('cycle')}
                    t={t}
                >
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-100">{t.cycleTrackingTitle || "Seguimiento Ciclo"}</h3>
                                <p className="text-xs text-slate-400">{t.cycleTrackingDesc || "Adaptar entreno a hormonas"}</p>
                            </div>
                            <input 
                                type="checkbox" 
                                name="trackCycle" 
                                checked={localProfile.trackCycle || false} 
                                onChange={handleChange} 
                                className="toggle-checkbox" 
                            />
                        </div>

                        {localProfile.trackCycle && (
                            <div className="space-y-4 animate-fadeIn">
                                <InputField name="menstrualCycle.lastPeriod" type="date" value={localProfile.menstrualCycle?.lastPeriod || ''} onChange={(e) => handleChange({ target: { name: 'menstrualCycle', value: { lastPeriod: e.target.value } } })} label={t.lastPeriodLabel || "Último Periodo"} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField name="menstrualCycle.cycleLength" type="number" value={localProfile.menstrualCycle?.cycleLength || ''} onChange={(e) => handleChange({ target: { name: 'menstrualCycle', value: { cycleLength: e.target.value } } })} label={t.cycleLengthLabel || "Ciclo (días)"} />
                                    <InputField name="menstrualCycle.periodLength" type="number" value={localProfile.menstrualCycle?.periodLength || ''} onChange={(e) => handleChange({ target: { name: 'menstrualCycle', value: { periodLength: e.target.value } } })} label={t.periodLengthLabel || "Sangrado (días)"} />
                                </div>
                                {cyclePhase && <div className="mt-2 text-xs text-center p-3 bg-violet-900/30 border border-violet-500/20 rounded-lg text-violet-200">
                                    {t.currentPhase || "Fase Actual"}: <span className="font-bold text-violet-100 uppercase">{t[cyclePhase.phase] || cyclePhase.phase}</span>
                                    <div className="text-[10px] opacity-70 mt-1">{t.day || "Día"} {cyclePhase.dayOfCycle}</div>
                                </div>}
                            </div>
                        )}
                    </div>
                </AccordionSection>
            )}

            {/* SECCIÓN 4: BIOAGE (Perfil Avanzado) */}
            <AccordionSection 
                title={t.bioageTitle || "Perfil Avanzado (Bioage)"} 
                icon="scanEye" 
                isOpen={openSections.bioage} 
                onToggle={() => toggleSection('bioage')}
                t={t}
            >
                <div className="space-y-6">
                    <p className="text-xs text-slate-400 -mt-2 mb-2">{t.bioageDesc || "Datos clínicos para mayor precisión."}</p>
                    <div className="grid grid-cols-2 gap-4"><BioageInput name="sq1rm" value={bio.sq1rm} onChange={handleBioChange} unit="kg" label={t.squat1rm || "Squat 1RM"} /><BioageInput name="plank" value={bio.plank} onChange={handleBioChange} unit="seg" label={t.plank || "Plank"} /></div>
                    <div className="grid grid-cols-2 gap-4"><BioageInput name="pullups" value={bio.pullups} onChange={handleBioChange} unit="reps" label={t.pullups || "Dominadas"} /><BioageInput name="pushups" value={bio.pushups} onChange={handleBioChange} unit="reps" label={t.pushups || "Flexiones"} /></div>
                    <div className="grid grid-cols-2 gap-3"><BioageInput name="waist" value={bio.waist} onChange={handleBioChange} unit="cm" label={t.waist || "Cintura"} /><BioageInput name="vo2max" value={bio.vo2max} onChange={handleBioChange} unit="ml" label={t.vo2max || "VO2 Max"} /></div>
                    <div className="grid grid-cols-2 gap-3"><BioageInput name="rhr" value={bio.rhr} onChange={handleBioChange} unit="bpm" label={t.rhr || "FC Reposo"} /><BioageInput name="hrr" value={bio.hrr} onChange={handleBioChange} unit="bpm" label={t.hrr || "Recuperación"} /></div>
                    
                    <button onClick={() => onAnalyzeBioage(localProfile)} disabled={bioageLoading} className="w-full py-3 rounded-xl bg-slate-800 border border-teal-500/30 text-teal-400 hover:bg-slate-700/80 transition-all font-bold text-xs flex items-center justify-center gap-2">
                        {bioageLoading ? <Icon name="loader" className="w-4 h-4 animate-spin"/> : <Icon name="brain" className="w-4 h-4"/>} 
                        {bioageLoading ? (t.processing || "Procesando...") : (t.calcBioAge || "Calcular Edad Biológica")}
                    </button>
                    
                    {localProfile.bioageEstimation && (
                        <div className="mt-4 p-4 bg-violet-900/20 border border-violet-500/30 rounded-xl animate-fadeIn">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <div className="text-[10px] uppercase text-violet-400 font-bold">{t.realAge || "Edad Real"}</div>
                                    <div className="text-xl font-mono text-slate-300">{localProfile.age} <span className="text-xs">años</span></div>
                                </div>
                                <Icon name="arrowRight" className="text-violet-500/50 w-6 h-6"/>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase text-teal-400 font-bold">{t.bioAgeResult || "Edad Bio"}</div>
                                    <div className="text-3xl font-black text-teal-300 drop-shadow-sm">{localProfile.bioageEstimation.bioage} <span className="text-base font-normal text-teal-500/80">años</span></div>
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
            </AccordionSection>
            
            {profileError && <p className="text-red-400 text-xs text-center pt-2">{profileError}</p>}
        </div>
    );
}
