import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, EmailAuthProvider, linkWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, serverTimestamp, query, writeBatch, Timestamp, deleteDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { buildHistoryContext, TRANSLATIONS, calculateSmartRest } from '../utils/helpers';
import { fetchGeminiWeeklyPlan, fetchGeminiBioageAnalysis } from '../services/gemini';

// --- Force Hot-Reload ---
const appId = (typeof __app_id !== 'undefined' ? __app_id : 'momentum-fitness-ai').replace(/[/.]/g, '_');

// --- Helper for deep object comparison ---
const deepEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);

// --- INDIVIDUAL LOGIC HOOKS ---

const useAuth = (t) => {
    const [userId, setUserId] = useState(null);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserId(user ? user.uid : null);
            setIsAnonymous(user ? user.isAnonymous : false);
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleSignIn = useCallback(async (email, password) => {
        setAuthError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
            console.error("Sign-in error:", e.code);
            if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(e.code)) {
                setAuthError(t.errorInvalidCreds);
            } else {
                setAuthError(t.errorAuth);
            }
        }
    }, [t]);

    const handleSignUp = useCallback(async (email, password) => {
        setAuthError(null);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (e) {
            console.error("Sign-up error:", e.code);
            setAuthError(e.code === 'auth/email-already-in-use' ? t.errorEmailInUse : t.errorAuth);
        }
    }, [t]);

    const handleAnonymousSignIn = useCallback(async () => {
        setAuthError(null);
        try {
            await signInAnonymously(auth);
        } catch (e) {
            console.error("Anonymous sign-in error:", e);
            setAuthError(t.errorAuth);
        }
    }, [t]);

    const handleSignOut = useCallback(async () => {
        setAuthError(null);
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Sign-out error:", e);
            setAuthError(t.errorAuth);
        }
    }, [t]);

    const handleLinkAccount = useCallback(async (email, password) => {
        if (!auth.currentUser) throw new Error("No user is currently signed in.");
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
    }, []);

    const handlePasswordReset = useCallback(async (email) => {
        await sendPasswordResetEmail(auth, email);
    }, []);

    return { userId, isAnonymous, isAuthReady, authError, setAuthError, handleSignIn, handleSignUp, handleAnonymousSignIn, handleSignOut, handleLinkAccount, handlePasswordReset };
};

const useProfile = (userId, isAuthReady, t) => {
    const defaultProfile = { gender: 'Hombre', age: 30, height: 175, weight: 75, bodyFat: 15, muscleMass: 40, daysPerWeek: 3, mainGoal: 'Perder grasa corporal', experienceLevel: 'Intermedio', injuries: '', muscleFocus: 'recomendado', timeAvailable: 45, currentPlanId: null, bioage: {}, bioageEstimation: null, menstrualCycle: { lastPeriod: '', cycleLength: 28 } };
    const [profile, setProfile] = useState(defaultProfile);
    const [savedProfile, setSavedProfile] = useState(defaultProfile); // Guarda el estado del perfil en Firestore
    const [profileSuccess, setProfileSuccess] = useState(null);
    const [profileError, setProfileError] = useState(null);
    const [bioageLoading, setBioageLoading] = useState(false);
    
    const profileDocRef = useMemo(() => 
        (userId && db) ? doc(db, 'artifacts', appId, 'users', userId, 'profile', 'userProfile') : null
    , [userId]);

    useEffect(() => {
        if (!isAuthReady || !userId || !profileDocRef) {
            return;
        }
        let isMounted = true;

        const getProfile = async () => {
            try {
                const docSnap = await getDoc(profileDocRef);
                if (isMounted) {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const fullProfile = { ...defaultProfile, ...data, bioage: data.bioage || {}, bioageEstimation: data.bioageEstimation || null, menstrualCycle: data.menstrualCycle || { lastPeriod: '', cycleLength: 28 } };
                        setProfile(fullProfile);
                        setSavedProfile(fullProfile); // Inicializa el perfil guardado
                    } else {
                        await setDoc(profileDocRef, defaultProfile);
                        setProfile(defaultProfile);
                        setSavedProfile(defaultProfile);
                    }
                }
            } catch (e) {
                console.error("Error fetching profile:", e);
            }
        };
        getProfile();
        return () => { isMounted = false; };
    }, [isAuthReady, userId, profileDocRef]);

    const handleProfileChange = (e) => {
        const { name, value, type } = e.target;
        
        setProfile(prev => {
            let processedValue = value;
            if (name === 'bioage' || name === 'menstrualCycle') {
                return { ...prev, [name]: value };
            }
            if (name === 'daysPerWeek' && value !== '') {
                processedValue = Math.max(1, Math.min(7, parseInt(value, 10) || 1));
            } else if (type === 'number') {
                processedValue = (value === '' ? '' : parseFloat(value));
            }
            return { ...prev, [name]: processedValue };
        });
    };
    
    const handleProfileSave = useCallback(async (updatedProfile) => {
        if (!profileDocRef || !updatedProfile) return;
        
        // Compara el perfil a guardar con el último perfil guardado
        if (deepEqual(updatedProfile, savedProfile)) {
            return; // No hay cambios, no se guarda
        }

        setProfileError(null);
        setProfileSuccess(null);
        try {
            await setDoc(profileDocRef, updatedProfile, { merge: true });
            setSavedProfile(updatedProfile); // Actualiza el perfil guardado
            setProfileSuccess(t.msgProfileSaved);
        } catch (e) {
            setProfileError(t.errorSave);
        }
        setTimeout(() => {setProfileSuccess(null); setProfileError(null)}, 3000);
    }, [profileDocRef, t, savedProfile]);

    const handleAnalyzeBioage = useCallback(async (currentProfile, language) => {
        setBioageLoading(true);
        setProfileError(null);
        try {
            const result = await fetchGeminiBioageAnalysis(currentProfile, language);
            const updatedProfile = { ...currentProfile, bioageEstimation: result };
            setProfile(updatedProfile); // Actualiza el estado local inmediatamente
            // El guardado se gestionará al cambiar de pestaña
        } catch (err) {
            console.error(err);
            setProfileError("Error al calcular BioAge.");
        } finally {
            setBioageLoading(false);
        }
    }, []);
    
    return { profile, setProfile, handleProfileChange, handleProfileSave, handleAnalyzeBioage, bioageLoading, profileSuccess, profileError, profileDocRef };
};
const useHistory = (userId, isAuthReady, profile, t, setProgressText, setLoading, setSuccessMessage, setError, setShowAdjustment, profileDocRef, setProfile, setGenerationProgress, setCurrentRoutineId, setView, setIsSessionActive) => {
    const [history, setHistory] = useState([]);
    
    const routinesColRef = useMemo(() => 
        (userId && db) ? collection(db, 'artifacts', appId, 'users', userId, 'routines') : null
    , [userId]);

    useEffect(() => {
        if (!isAuthReady || !userId || !routinesColRef) {
            setHistory([]);
            return;
        }
        let isMounted = true;

        const unsubscribe = onSnapshot(query(routinesColRef), (snapshot) => {
            if (isMounted) {
                const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistory(historyData);
            }
        }, (err) => {
            console.error(err);
        });

        return () => { isMounted = false; unsubscribe(); };
    }, [isAuthReady, userId, routinesColRef]);

    const handleGenerateWeeklyPlan = async (language) => {
        if (!routinesColRef || !profileDocRef) return;
        setLoading(true);
        setError(null);
        setGenerationProgress(0); // Reset progress
        const progressSteps = [t.analyzing, t.designing, t.optimizing, t.finalizing];
        let step = 0;
        setProgressText(progressSteps[step]);
        const progressInterval = setInterval(() => {
            step = (step + 1) % progressSteps.length;
            setProgressText(progressSteps[step]);
            setGenerationProgress(prev => Math.min(prev + 10, 90)); // Simulate progress
        }, 2500);

        try {
            const recentHistory = history.filter(r => r.status === 'completed').slice(0, 5);
            const newPlan = await fetchGeminiWeeklyPlan(profile, recentHistory, language);
            clearInterval(progressInterval);
            setGenerationProgress(100);

            if (!newPlan || !Array.isArray(newPlan) || newPlan.length === 0) {
                throw new Error("La IA no generó un plan válido. Por favor, inténtalo de nuevo.");
            }

            setProgressText(t.processing);

            const deleteBatch = writeBatch(db);
            const snapshot = await getDocs(query(routinesColRef));
            snapshot.docs.forEach(doc => {
                if (doc.data().status !== 'completed') {
                    deleteBatch.delete(doc.ref);
                }
            });
            await deleteBatch.commit();

            const newPlanId = `plan_${Date.now()}`;
            const newBatch = writeBatch(db);
            newPlan.forEach((routine, index) => {
                const docRef = doc(routinesColRef);
                newBatch.set(docRef, { ...routine, planId: newPlanId, weekDay: index, status: 'pending', createdAt: serverTimestamp() });
            });
            
            await setDoc(profileDocRef, { currentPlanId: newPlanId }, { merge: true });
            newBatch.commit(); // Commit before updating local state
            
            setProfile(prev => ({ ...prev, currentPlanId: newPlanId }));

            // Force manual refresh to avoid race condition
            const updatedSnapshot = await getDocs(query(routinesColRef));
            const newHistory = updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistory(newHistory);
            
            setSuccessMessage(t.msgPlanGen);
            
        } catch (err) {
            console.error("Error generating weekly plan:", err);
            const errorMessage = err.message.includes("La IA no generó") ? err.message : t.errorSave;
            setError(errorMessage);
            clearInterval(progressInterval);
            setGenerationProgress(0);
        } finally {
            setLoading(false);
            setProgressText("");
            setTimeout(() => setSuccessMessage(null), 3500);
        }
    };

    const handleAdjustNextSession = async (language, routine, adjustments) => { 
        if (!routinesColRef || !routine) return;
        setLoading(true);
        setError(null);
        setProgressText(t.recalcParams);

        try {
            // const adjustedRoutine = await fetchGeminiSessionAdjustment(profile, routine, adjustments, language);
            const adjustedRoutine = routine; // Placeholder since the function is removed
             if (!adjustedRoutine || typeof adjustedRoutine !== 'object' || !adjustedRoutine.rutinaPrincipal) {
                throw new Error("La IA no generó un ajuste válido. Por favor, inténtalo de nuevo.");
            }

            const routineRef = doc(routinesColRef, routine.id);
            await setDoc(routineRef, { ...adjustedRoutine, status: 'pending', modifiedAt: serverTimestamp() }, { merge: true });
            
            setShowAdjustment(false);
            setSuccessMessage(t.msgSessionUpd);

        } catch (err) {
            console.error("Error adjusting session:", err);
            const errorMessage = err.message.includes("La IA no generó") ? err.message : t.errorSave;
            setError(errorMessage);
        } finally {
            setLoading(false);
            setProgressText("");
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const handleRepeatSession = useCallback(async (routineToRepeat) => {
        if (!routinesColRef || !routineToRepeat) return;

        setLoading(true);
        setError(null);
        
        try {
            // Create a new ID for the repeated routine
            const newRoutineId = doc(routinesColRef).id;
            const newRoutine = {
                ...routineToRepeat,
                id: newRoutineId, // Assign new ID
                status: 'pending', // Reset status to pending
                createdAt: serverTimestamp(), // New creation timestamp
                completedAt: null, // Clear completion data
                feedback: null,
                notes: null,
                mode: null,
                planId: routineToRepeat.planId || `repeated_${Date.now()}` // Keep planId or generate a new one
            };

            // Remove properties that should not be copied or need to be regenerated
            delete newRoutine.completedOnDay;
            delete newRoutine.modifiedAt;
            
            const routineRef = doc(routinesColRef, newRoutineId);
            await setDoc(routineRef, newRoutine); // Save the new routine to Firestore

            // Update local history state
            setHistory(prevHistory => [...prevHistory, newRoutine]);

            // Start the new session
            setCurrentRoutineId(newRoutineId);
            setView('routine');
            setIsSessionActive(true);
            setSuccessMessage(t.msgSessionRepeat); // Need to add this translation
            
        } catch (err) {
            console.error("Error repeating session:", err);
            setError(t.errorSave);
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    }, [routinesColRef, setHistory, setCurrentRoutineId, setView, setIsSessionActive, t]);

    return { history, setHistory, handleGenerateWeeklyPlan, handleAdjustNextSession, handleRepeatSession, routinesColRef };
};

export const useAppLogic = () => {
    const [language, setLanguage] = useState('es');
    const t = useMemo(() => TRANSLATIONS[language] || TRANSLATIONS.es, [language]);
    const [activeTab, _setActiveTab] = useState('training');
    const [view, setView] = useState('main');
    const [currentRoutineId, setCurrentRoutineId] = useState(null);
    const [showSplash, setShowSplash] = useState(true);
    const [progressText, setProgressText] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [isSignOutWarningVisible, setIsSignOutWarningVisible] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    // Declaraciones de estado para la sesión activa movidas aquí
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [restSeconds, setRestSeconds] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const sessionIntervalRef = useRef(null);
    const restIntervalRef = useRef(null);

    const { userId, isAnonymous, isAuthReady, authError, setAuthError, handleSignIn, handleSignUp, handleAnonymousSignIn, handleSignOut, handleLinkAccount, handlePasswordReset } = useAuth(t);
    const { profile, setProfile, handleProfileChange, handleProfileSave, handleAnalyzeBioage, bioageLoading, profileSuccess, profileError, profileDocRef } = useProfile(userId, isAuthReady, t);
    const [error, setError] = useState(null);
    const { history, setHistory, handleGenerateWeeklyPlan, handleAdjustNextSession, handleRepeatSession, routinesColRef } = useHistory(userId, isAuthReady, profile, t, setProgressText, setLoading, setSuccessMessage, setError, setShowAdjustment, profileDocRef, setProfile, setGenerationProgress, setCurrentRoutineId, setView, setIsSessionActive);
    const [linkAccountError, setLinkAccountError] = useState(null);


    const [scrolled, setScrolled] = useState(false);
    const headerRef = useRef(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importTextError, setImportTextError] = useState('');
    const [backupJson, setBackupJson] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const currentRoutine = useMemo(() => history.find(r => r.id === currentRoutineId), [history, currentRoutineId]);
    const combinedError = useMemo(() => error || profileError, [error, profileError]);

    const onProfileSave = useCallback(() => handleProfileSave(profile), [handleProfileSave, profile]);
    
    const setActiveTab = useCallback((tab) => {
        if (activeTab === 'profile') {
            onProfileSave();
        }
        _setActiveTab(tab);
    }, [activeTab, onProfileSave]);

    useEffect(() => {
        if (isAuthReady) {
            const timer = setTimeout(() => setShowSplash(false), 1200);
            return () => clearTimeout(timer);
        }
    }, [isAuthReady]);
    
    useEffect(() => {
        if (!userId && isAuthReady) {
            setActiveTab('training');
            setView('main');
            setCurrentRoutineId(null);
        }
    }, [userId, isAuthReady, setActiveTab]);

    const handleScroll = (e) => setScrolled(e.target.scrollTop > 20);
    const toggleLanguage = () => setLanguage(prev => prev === 'es' ? 'en' : 'es');

    const onLinkAccount = useCallback(async (email, password) => {
        setLinkAccountError(null);
        try {
            await handleLinkAccount(email, password);
            return true;
        } catch (e) {
            console.error("Link account error:", e.code);
            if (e.code === 'auth/email-already-in-use') {
                setLinkAccountError(t.errorEmailInUse);
            } else if (['auth/invalid-credential', 'auth/wrong-password'].includes(e.code)) {
                setLinkAccountError(t.errorInvalidCreds);
            } else {
                setLinkAccountError(t.errorAuth);
            }
            return false;
        }
    }, [t, handleLinkAccount]);

    const onPasswordReset = useCallback(async (email) => {
        setAuthError(null);
        try {
            await handlePasswordReset(email);
            return true;
        } catch (e) {
            console.error("Password reset error:", e.code);
            if (e.code === 'auth/user-not-found') {
                setAuthError(t.errorInvalidCreds); 
            } else {
                setAuthError(t.errorAuth);
            }
            return false;
        }
    }, [t, handlePasswordReset, setAuthError]);
    
    const onSignOut = useCallback(() => {
        if (isAnonymous) {
            setIsSignOutWarningVisible(true);
        } else {
            handleSignOut();
        }
    }, [isAnonymous, handleSignOut]);

    const handleForceSignOut = useCallback(() => {
        setIsSignOutWarningVisible(false);
        handleSignOut();
    }, [handleSignOut]);

    // Modified handleSaveAndSignOut to navigate to profile tab
    const handleSaveAndSignOut = useCallback(() => {
        setIsSignOutWarningVisible(false);
        setActiveTab('profile'); // Navigate to profile tab so user can create an account and save data
    }, [setActiveTab]);

    const handleViewRoutine = useCallback((routine) => {
        if(routine && routine.id) {
            setCurrentRoutineId(routine.id);
            setView('routine');
            setIsSessionActive(true);
        }
    }, []);

    const handleBackToMain = useCallback(() => {
        setView('main');
        setCurrentRoutineId(null);
        setIsSessionActive(false);
        setIsResting(false);
        setRestSeconds(0);
        setSessionSeconds(0);
    }, []);

    const handleRoutineFeedback = useCallback(async (routineId, feedback, notes, mode) => {
        if (!routinesColRef || !routineId) {
            handleBackToMain();
            return;
        }

        const completedRoutineData = {
            status: 'completed',
            completedAt: Timestamp.now(), // Use Timestamp.now() for local state
            feedback,
            notes,
            mode,
            completedOnDay: (new Date().getDay() + 6) % 7
        };

        setHistory(prevHistory =>
            prevHistory.map(r =>
                r.id === routineId
                    ? { ...r, ...completedRoutineData }
                    : r
            )
        );
        handleBackToMain();
        setSuccessMessage(t.msgSessionReg);
        setTimeout(() => setSuccessMessage(null), 3000);

        try {
            const routineRef = doc(routinesColRef, routineId);
            await setDoc(routineRef, { ...completedRoutineData, completedAt: serverTimestamp() }, { merge: true }); // Use serverTimestamp() for Firestore
        } catch (e) {
            console.error("Error saving feedback to Firebase:", e);
            setError(t.errorHistorySave);

            setHistory(prevHistory =>
                prevHistory.map(r =>
                    r.id === routineId
                        ? { ...r, status: 'pending', completedAt: null, feedback: null, notes: null, mode: null }
                        : r
                )
            );
            setTimeout(() => setError(null), 4000);
        }
    }, [routinesColRef, handleBackToMain, setHistory, t, setError, setSuccessMessage]);

    const handleExerciseComplete = useCallback((exercise) => {
        clearInterval(restIntervalRef.current);
        if (exercise) {
            const smartRest = calculateSmartRest(profile, exercise);
            setRestSeconds(smartRest);
            setIsResting(true);
        } else {
            setIsResting(false);
            setRestSeconds(0);
        }
    }, [profile]);

    useEffect(() => {
        if (isSessionActive) {
            sessionIntervalRef.current = setInterval(() => { setSessionSeconds(prev => prev + 1); }, 1000);
        } else {
            clearInterval(sessionIntervalRef.current);
        }
        return () => clearInterval(sessionIntervalRef.current);
    }, [isSessionActive]);

    useEffect(() => {
        if (isResting && isSessionActive) {
            restIntervalRef.current = setInterval(() => {
                setRestSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(restIntervalRef.current);
                        setIsResting(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(restIntervalRef.current);
            if(restSeconds > 0) { setRestSeconds(0); setIsResting(false); }
        }
        return () => clearInterval(restIntervalRef.current);
    }, [isResting, isSessionActive]);

    const onGeneratePlan = useCallback(() => handleGenerateWeeklyPlan(language), [handleGenerateWeeklyPlan, language]);
    const onAnalyzeBioage = useCallback(() => handleAnalyzeBioage(profile, language), [handleAnalyzeBioage, profile, language]);
    const onAdjustNextSession = useCallback((routine, adjustments) => handleAdjustNextSession(language, routine, adjustments), [handleAdjustNextSession, language]);

    const onRepeatSession = useCallback((routine) => handleRepeatSession(routine), [handleRepeatSession]);

    const handleGenerateBackup = useCallback(() => {
        const backupData = { profile, history };
        setBackupJson(JSON.stringify(backupData, null, 2));
    }, [profile, history]);

    const handleCloseBackupModal = () => setBackupJson(null);

    const handleCopyToClipboard = useCallback(() => {
        if (backupJson) {
            navigator.clipboard.writeText(backupJson).then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            });
        }
    }, [backupJson]);

    const handleImportFromText = useCallback(async (jsonString) => {
        try {
            const data = JSON.parse(jsonString);
            if (!data.profile || !data.history) throw new Error("Invalid backup format.");
            await handleProfileSave(data.profile);
            if (routinesColRef) {
                const batch = writeBatch(db);
                data.history.forEach(routine => {
                    const docRef = routine.id ? doc(routinesColRef, routine.id) : doc(routinesColRef);
                    if (routine.createdAt && !routine.createdAt.seconds) { routine.createdAt = Timestamp.fromDate(new Date(routine.createdAt)); }
                    if (routine.completedAt && !routine.completedAt.seconds) { routine.completedAt = Timestamp.fromDate(new Date(routine.completedAt)); }
                    batch.set(docRef, routine, { merge: true });
                });
                await batch.commit();
            }
            setIsImportModalOpen(false);
        } catch (e) {
            setImportTextError(`Error: ${e.message}`);
        }
    }, [routinesColRef, handleProfileSave]);

    return {
        t, activeTab, view, currentRoutine, showSplash, scrolled, headerRef, isImportModalOpen, importTextError, backupJson, copySuccess, isSessionActive,
        sessionSeconds, restSeconds, progressText, loading, successMessage, showAdjustment,
        userId, isAuthReady, authError, isAnonymous, linkAccountError, isSignOutWarningVisible,
        profile, bioageLoading, profileSuccess, profileError,
        history, generationProgress, error: combinedError,
        toggleLanguage, setActiveTab, handleScroll, setProgressText, setShowAdjustment, setAuthError, setIsSignOutWarningVisible,
        onSignIn: handleSignIn,
        onSignUp: handleSignUp,
        onAnonymousSignIn: handleAnonymousSignIn,
        onSignOut: onSignOut,
        onForceSignOut: handleForceSignOut,
        onSaveAndSignOut: handleSaveAndSignOut, // Export the new handler
        onLinkAccount,
        onPasswordReset,
        handleViewRoutine, handleBackToMain, handleRoutineFeedback, handleExerciseComplete, setRestSeconds, setIsSessionActive,
        onProfileChange: handleProfileChange, onProfileSave, onAnalyzeBioage,
        onGeneratePlan, onAdjustNextSession, onRepeatSession,
        onGenerateBackup: handleGenerateBackup, onCloseBackupModal: handleCloseBackupModal, onCopyToClipboard: handleCopyToClipboard, setIsImportModalOpen,
        onImportFromText: handleImportFromText
    };
};