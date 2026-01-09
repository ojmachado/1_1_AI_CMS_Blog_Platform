
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Fallback para variáveis de ambiente se disponíveis
const config = getSavedConfig() || {
    apiKey: "",
    projectId: "",
    storageBucket: ""
};

// Verifica se a configuração é minimamente utilizável
export const getFirebaseConfigStatus = () => {
    const hasMinConfig = !!(config && config.apiKey && config.apiKey.length > 10);
    return { isValid: hasMinConfig, config };
};

// Inicialização segura
let firebaseApp: any = null;
const { isValid } = getFirebaseConfigStatus();

if (isValid) {
    try {
        firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    } catch (error) {
        console.error("Firebase Init Error:", error);
    }
}

// Exports seguros - garantem que o app não quebre se o Firebase não estiver configurado
export const auth = firebaseApp ? getAuth(firebaseApp) : null as any;
export const db = firebaseApp ? getFirestore(firebaseApp) : null as any;
export const storage = firebaseApp ? getStorage(firebaseApp) : null as any;
