
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

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

// Fallback configuration
const config = getSavedConfig() || {
    apiKey: "",
    projectId: "",
    storageBucket: ""
};

// Check if configuration is minimally usable
export const getFirebaseConfigStatus = () => {
    const hasMinConfig = !!(config && config.apiKey && config.apiKey.length > 10);
    return { isValid: hasMinConfig, config };
};

// Safe initialization logic
const initializeFirebase = (): FirebaseApp | null => {
    const { isValid } = getFirebaseConfigStatus();
    if (!isValid) return null;

    try {
        // If already initialized, return existing app
        if (getApps().length > 0) {
            return getApp();
        }
        // Initialize new app
        return initializeApp(config);
    } catch (error) {
        console.error("Firebase Init Error:", error);
        return null;
    }
};

const firebaseApp = initializeFirebase();

// Internal helper to get service or null
const getService = <T>(serviceFn: (app: FirebaseApp) => T): T => {
    if (!firebaseApp) return null as any;
    try {
        return serviceFn(firebaseApp);
    } catch (e) {
        console.error("Firebase Service Init Error:", e);
        return null as any;
    }
};

/**
 * EXPORTS
 * We maintain these as direct exports for compatibility, 
 * but they are now safely computed from the internal firebaseApp instance.
 */
export const auth: Auth = getService(getAuth);
export const db: Firestore = getService(getFirestore);
export const storage: FirebaseStorage = getService(getStorage);

export default firebaseApp;
