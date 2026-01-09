
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

const getSavedConfig = () => {
    try {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('firebase_manual_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.apiKey) return parsed;
            }
        }
    } catch (e) {
        console.error("Erro ao ler config do localStorage");
    }
    return null;
};

const config = getSavedConfig() || {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""
};

// Verifica se a configuração é minimamente utilizável
export const getFirebaseConfigStatus = () => {
    const hasMinConfig = !!(config && config.apiKey && config.apiKey.length > 10);
    return { isValid: hasMinConfig, config };
};

// Inicialização segura com try-catch
let firebaseApp: any = null;
const { isValid } = getFirebaseConfigStatus();

if (isValid) {
    try {
        firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    } catch (error) {
        console.error("Firebase Init Error:", error);
    }
}

// Exports seguros
export const auth = firebaseApp ? getAuth(firebaseApp) : null as any;
export const db = firebaseApp ? getFirestore(firebaseApp) : null as any;
export const storage = firebaseApp ? getStorage(firebaseApp) : null as any;
