import * as admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        console.log('Firebase Admin initialized successfully');
      } catch (error) {
        console.error('Firebase Admin initialization error:', error);
      }
    } else {
      console.warn('Firebase Admin credentials missing. This is expected during static build if variables are not set in the CI environment.');
    }
  }
};

initializeFirebaseAdmin();

// Exporta nulo ou instâncias seguras para evitar erros de referência nula durante o build
export const adminDb = admin.apps.length ? admin.firestore() : null as any;
export const adminAuth = admin.apps.length ? admin.auth() : null as any;
