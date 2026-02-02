import { useEffect, useCallback, useState } from 'react';

export const useBackButtonHandler = (
    view,
    activeTab,
    isSessionActive,
    currentExerciseIndex,
    setCurrentExerciseIndex,
    handleBackToMain,
    setActiveTab,
    t
) => {
    const [showExitAppModal, setShowExitAppModal] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleHardwareBackPress = useCallback((e) => {
        e.preventDefault(); // Prevent default browser back behavior

        if (view === 'routine' && isSessionActive) {
            // Inside an active session
            if (currentExerciseIndex > 0) {
                // Go to previous exercise
                setCurrentExerciseIndex(prev => prev - 1);
            } else {
                // First exercise, go back to main routine view
                handleBackToMain();
            }
        } else if (activeTab === 'profile' || activeTab === 'history') {
            // In profile or history, go to training tab (main view)
            setActiveTab('training');
            handleBackToMain(); // Ensure view is 'main' if it was changed internally
        } else if (activeTab === 'training' && view === 'main') {
            // In the main training view, prompt to exit app
            setShowExitAppModal(true);
        }
    }, [view, activeTab, isSessionActive, currentExerciseIndex, setCurrentExerciseIndex, handleBackToMain, setActiveTab]);

    useEffect(() => {
        // This is a common pattern for PWAs to handle Android's hardware back button
        // For browsers, it might behave differently or be less relevant
        window.addEventListener('popstate', handleHardwareBackPress);
        return () => {
            window.removeEventListener('popstate', handleHardwareBackPress);
        };
    }, [handleHardwareBackPress]);

    const handleConfirmExitApp = () => {
        setShowExitAppModal(false);
        // For PWAs, closing the app directly is not standard.
        // A common approach is to just let the user navigate away or close the tab/window.
        // However, if the intent is to simulate a "hard exit", we can try:
        window.close(); // This only works if the window was opened by script or is a PWA.
        // Alternatively, if this is a standalone PWA, the browser might handle it.
        // For a more robust solution, especially in a true native wrapper, a specific native API would be used.
        // For now, we'll try window.close()
    };

    const handleCancelExitApp = () => {
        setShowExitAppModal(false);
    };

    const promptInstallPWA = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredPrompt(null);
        }
    };

    return { showExitAppModal, handleConfirmExitApp, handleCancelExitApp, promptInstallPWA };
};
