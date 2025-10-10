// Inicialização segura do Firebase
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCvVmOXpVZsV6Bs3k73SUr-0G0j2tu7aLQ",
    authDomain: "glucocare-e68c8.firebaseapp.com",
    projectId: "glucocare-e68c8",
    storageBucket: "glucocare-e68c8.appspot.com",
    messagingSenderId: "501715449083",
    appId: "1:501715449083:android:8b781286cf0f02d752ac5e"
};

// Verifica se já existe uma instância do Firebase
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Inicializa Auth
export const auth = getAuth(app);

// Inicializa Firestore
export const db = getFirestore(app);

// Função para aguardar inicialização
export const waitForFirebase = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        const checkAuth = () => {
            try {
                if (auth && db) {
                    console.log('✅ Firebase Auth e Firestore inicializados');
                    resolve(true);
                } else {
                    setTimeout(checkAuth, 100);
                }
            } catch (error) {
                console.error('❌ Erro ao verificar Firebase:', error);
                setTimeout(checkAuth, 100);
            }
        };
        checkAuth();
    });
};

export default app;
