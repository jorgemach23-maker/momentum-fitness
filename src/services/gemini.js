import { getFunctions, httpsCallable } from "firebase/functions";

// --- FUNCIÓN DE GENERACIÓN DE PLAN (SEGURA) ---
export const fetchGeminiWeeklyPlan = async (profile, recentRoutines, lang) => {
    const functions = getFunctions();
    const generatePlan = httpsCallable(functions, 'generateGeminiPlan');
    try {
        console.log("LLAMANDO A LA CLOUD FUNCTION 'generateGeminiPlan'...");
        const result = await generatePlan({ profile, recentRoutines, lang });
        
        console.log("RESPUESTA RECIBIDA DE LA CLOUD FUNCTION (RAW):", result);
        console.log("DATOS DEL PLAN (JSON):", result.data);
        
        // Verificación rápida si data es un string JSON en lugar de objeto
        let finalData = result.data;
        if (typeof finalData === 'string') {
            try {
                finalData = JSON.parse(finalData);
                console.log("DATOS PARSEADOS MANUALMENTE:", finalData);
            } catch (e) {
                console.warn("La respuesta parecía un string pero no era JSON válido:", e);
            }
        }

        return finalData;
    } catch (error) {
        console.error("Error al llamar a la Cloud Function 'generateGeminiPlan':", error);
        return [{ 
            diaEnfoque: "Error de Conexión", 
            rutinaPrincipal: [{ 
                tipo_bloque: "Principal", 
                ejercicio: "No se pudo conectar con el servidor de IA.", 
                series: 1, reps: "1", carga_sugerida: "0", descanso_segs: 0 
            }] 
        }];
    }
};

// --- FUNCIÓN DE ANÁLISIS DE BIOAGE (SEGURA) ---
export const fetchGeminiBioageAnalysis = async (profile, lang) => {
    const functions = getFunctions();
    const analyzeBioage = httpsCallable(functions, 'analyzeBioage');
    try {
        const result = await analyzeBioage({ profile, lang });
        console.log("RESPUESTA BIOAGE:", result.data);
        return result.data;
    } catch (error) {
        console.error("Error al llamar a la Cloud Function 'analyzeBioage':", error);
        return { error: "No se pudo generar el análisis de BioAge." };
    }
};

// --- FUNCIÓN DE AJUSTE DE SESIÓN (RESTABLECIDA) ---
export const fetchGeminiSessionAdjustment = async (profile, routine, adjustments, lang) => {
    const functions = getFunctions();
    const adjustSession = httpsCallable(functions, 'adjustSession');
    try {
        console.log("LLAMANDO A AJUSTAR SESIÓN...", { routine, adjustments });
        const result = await adjustSession({ profile, routine, adjustments, lang });
        console.log("RESPUESTA AJUSTE:", result.data);
        return result.data;
    } catch (error) {
        console.error("Error al llamar a la Cloud Function 'adjustSession':", error);
        return null;
    }
};
