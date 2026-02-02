# App Blueprint

## Overview

This document outlines the plan to restore the Momentum AI application to its original design and functionality, while maintaining the recent backend upgrades, including the integration with Firebase and the secure Gemini API.

## Plan

1.  **Analyze the current `src/App.jsx`:** I will carefully review the current application to fully understand its structure, design, and functionality.
2.  **Restore previous functionality:** I will focus on re-implementing the core features that were present in the original version, ensuring they are compatible with the latest version of React and the new backend. This includes:
    *   **Data Management:** I will bring back the import/export functionality, allowing users to back up and restore their data.
    *   **Bioage Analysis:** I will restore the advanced bioage calculation and display, providing users with a comprehensive overview of their physiological profile.
    *   **Cycle Sync:** I will re-enable the menstrual cycle tracking feature for female users, ensuring that the training adapts to their hormonal changes.
3.  **Update the UI:** I will make the necessary adjustments to the UI to ensure that it not only aligns with the original glassmorphism design but also provides a modern and intuitive user experience. This includes:
    *   **Header:** I will redesign the header to make it more dynamic and visually appealing.
    *   **Buttons:** I will update the buttons to give them a modern look and feel, with improved visual feedback.
    *   **Feedback Section:** I will refine the feedback section to make it more user-friendly and intuitive.
4.  **Implement 'Repeat Session' functionality:**
    *   Added `handleRepeatSession` to `src/hooks/useAppLogic.js` to duplicate a completed routine, reset its status to 'pending', and initiate a new training session.
    *   Updated `src/App.jsx` to pass `onRepeatSession` to `HistoryTab`.
    *   Modified `src/components/features/HistoryTab.jsx` to call `onRepeatSession` when the 'REPETIR ESTA SESIÓN' button is clicked.
    *   Added translation `msgSessionRepeat` to `locales/es.json` and `locales/en.json`.
5.  **Fix `ReferenceError` in `useAppLogic`:**
    *   Reordered state declarations in `src/hooks/useAppLogic.js` to ensure `isSessionActive`, `currentRoutineId`, `view`, and their respective setters are initialized before being passed to `useHistory`.
6.  **Final Review:** I will perform a comprehensive review of the application to ensure that all functionalities are working correctly and that the UI is consistent and polished.
