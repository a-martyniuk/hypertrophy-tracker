import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const clean = (val?: string) => (val ? val.trim() : undefined);

const firebaseConfig = {
    apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: clean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: clean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: clean(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: clean(import.meta.env.VITE_FIREBASE_APP_ID)
};

export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'tu_api_key'
);

if (!isFirebaseConfigured) {
    console.warn('[Firebase] Credenciales no configuradas. El modo Invitado (Local) estará activo.');
}

// Initialize Firebase only once or with fallback
const app = getApps().length > 0
    ? getApp()
    : initializeApp(
        isFirebaseConfigured
            ? (firebaseConfig as Record<string, string>)
            : {
                apiKey: 'demo-api-key',
                authDomain: 'demo-app.firebaseapp.com',
                projectId: 'demo-app',
                storageBucket: 'demo-app.appspot.com',
                messagingSenderId: '000000000000',
                appId: '1:000000000000:web:000000000000'
            }
    );

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
