// Configuração do Firebase - pode ser atualizada quando necessário
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração atual do Firebase (será atualizada quando você baixar o novo google-services.json)
const firebaseConfig = {
    apiKey: "AIzaSyCvVmOXpVZsV6Bs3k73SUr-0G0j2tu7aLQ",
    authDomain: "glucocare-e68c8.firebaseapp.com",
    projectId: "glucocare-e68c8",
    storageBucket: "glucocare-e68c8.appspot.com",
    messagingSenderId: "501715449083",
    appId: "1:501715449083:android:8b781286cf0f02d752ac5e"
};

// Inicialização segura do Firebase
let app: FirebaseApp;
let auth: any;
let db: any;

try {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log('🔥 Firebase inicializado com sucesso');
    } else {
        app = getApps()[0];
        auth = getAuth(app);
        db = getFirestore(app);
    }
} catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    // Fallback para inicialização básica
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
}

export { auth, db };

// Função para aguardar inicialização
export const waitForFirebase = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        const checkAuth = () => {
            try {
                if (auth && db) {
                    console.log('✅ Firebase inicializado com sucesso');
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

export default app!;
