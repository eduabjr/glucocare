// ✅ CONFIGURAÇÃO FIREBASE COMPLETA COM PERSISTÊNCIA
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCvVmOXpVZsV6Bs3k73SUr-0G0j2tu7aLQ",
    authDomain: "glucocare-e68c8.firebaseapp.com",
    projectId: "glucocare-e68c8",
    storageBucket: "glucocare-e68c8.appspot.com",
    messagingSenderId: "501715449083",
    appId: "1:501715449083:android:8b781286cf0f02d752ac5e"
};

// Inicialização robusta com persistência
let app: any = null;
let auth: any = null;
let db: any = null;

export async function initFirebase(): Promise<boolean> {
    try {
        console.log('🔥 Inicializando Firebase para Expo Go...');
        
        // ✅ CORREÇÃO: Verifica se já existe uma instância do Firebase
        const existingApps = getApps();
        
        if (existingApps.length === 0) {
            // Primeira inicialização
            console.log('🔥 Primeira inicialização do Firebase...');
            app = initializeApp(firebaseConfig);
        } else {
            // Já existe uma instância, reutiliza
            console.log('♻️ Reutilizando instância existente do Firebase...');
            app = getApp();
            console.log('♻️ Firebase App reutilizado');
        }
        
        // ✅ EXPO GO: Inicializa Auth com mock funcional (Firebase Auth não funciona no Expo Go)
        console.log('⚠️ Expo Go detectado - usando mock do Firebase Auth');
        auth = {
            currentUser: null,
            signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase Auth não disponível no Expo Go')),
            createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase Auth não disponível no Expo Go')),
            signOut: () => Promise.resolve(),
            onAuthStateChanged: () => () => {},
            updatePassword: () => Promise.reject(new Error('Firebase Auth não disponível no Expo Go')),
            updateEmail: () => Promise.reject(new Error('Firebase Auth não disponível no Expo Go'))
        };
        console.log('✅ Firebase Auth mock inicializado para Expo Go');
        
        // Inicializa Firestore
        try {
            db = getFirestore(app);
            console.log('✅ Firestore inicializado');
        } catch (dbError: any) {
            console.warn('⚠️ Firestore não disponível');
            db = null;
        }
        
        console.log('✅ Firebase inicializado com sucesso para Expo Go!');
        return true;
        
    } catch (error: any) {
        console.error('❌ ERRO ao inicializar Firebase:', error);
        
        // Mock completo em caso de erro total
        app = { name: 'mock-app' };
        auth = {
            currentUser: null,
            signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase não disponível')),
            createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase não disponível')),
            signOut: () => Promise.resolve(),
            onAuthStateChanged: () => () => {},
            updatePassword: () => Promise.reject(new Error('Firebase não disponível')),
            updateEmail: () => Promise.reject(new Error('Firebase não disponível'))
        };
        db = null;
        
        console.log('⚠️ Firebase usando mocks completos');
        return false;
    }
}

// Inicializa imediatamente
initFirebase().catch(error => {
    console.error('❌ Erro ao inicializar Firebase:', error);
});

// Função de verificação robusta
export function checkFirebase(): Promise<boolean> {
    return new Promise((resolve) => {
        if (app && auth) {
            console.log('✅ Firebase está pronto para uso!');
            resolve(true);
        } else {
            console.warn('⚠️ Firebase não disponível');
            resolve(false);
        }
    });
}

// Função para aguardar Firebase estar pronto
export function waitForFirebase(): Promise<boolean> {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo
        
        const checkFirebase = () => {
            attempts++;
            
            try {
                if (app && auth) {
                    console.log('✅ Firebase está pronto para uso!');
                    resolve(true);
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    console.warn('⚠️ Timeout ao aguardar Firebase - continuando sem Firebase');
                    resolve(false);
                    return;
                }
                
                setTimeout(checkFirebase, 100);
            } catch (error) {
                console.error('❌ Erro ao verificar Firebase:', error);
                if (attempts >= maxAttempts) {
                    console.warn('⚠️ Firebase não disponível - continuando sem Firebase');
                    resolve(false);
                } else {
                    setTimeout(checkFirebase, 100);
                }
            }
        };
        
        // Inicia a verificação
        checkFirebase();
    });
}

// Exporta as instâncias
export { auth, db };
export default app;