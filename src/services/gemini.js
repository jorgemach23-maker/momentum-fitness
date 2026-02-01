import { getFunctions, httpsCallable } from "firebase/functions";

// --- FUNCIÓN DE GENERACIÓN DE PLAN (SEGURA) ---
export const fetchGeminiWeeklyPlan = async (profile, recentRoutines, lang) => {
    const functions = getFunctions();
    const generatePlan = httpsCallable(functions, 'generateGeminiPlan');
    try {
        const result = await generatePlan({ profile, recentRoutines, lang });
        return result.data;
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
        return result.data;
    } catch (error) {
        console.error("Error al llamar a la Cloud Function 'analyzeBioage':", error);
        return { error: "No se pudo generar el análisis de BioAge." };
    }
};
