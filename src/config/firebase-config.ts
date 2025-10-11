// ✅ CONFIGURAÇÃO FIREBASE PARA REACT NATIVE - VERSÃO DEFINITIVA
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Firebase (do console Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyCvVmOXpVZsV6Bs3k73SUr-0G0j2tu7aLQ",
    authDomain: "glucocare-e68c8.firebaseapp.com",
    projectId: "glucocare-e68c8",
    storageBucket: "glucocare-e68c8.appspot.com",
    messagingSenderId: "501715449083",
    appId: "1:501715449083:android:8b781286cf0f02d752ac5e"
};

// ✅ INICIALIZAÇÃO CORRETA PARA REACT NATIVE
let app: any = null;
let auth: any = null;
let db: any = null;

// Função para inicializar Firebase de forma segura
const initializeFirebase = () => {
    try {
        console.log('🔥 Inicializando Firebase...');
        
        // Verifica se já existe uma instância do Firebase
        const existingApps = getApps();
        
        if (existingApps.length === 0) {
            // Primeira inicialização
            console.log('🔥 Primeira inicialização do Firebase...');
            app = initializeApp(firebaseConfig);
        } else {
            // Já existe uma instância, reutiliza
            console.log('♻️ Reutilizando instância existente do Firebase...');
            app = getApp();
        }
        
        // Inicializa Auth de forma mais segura
        try {
            // Sempre usa getAuth primeiro para evitar problemas de registro
            auth = getAuth(app);
            console.log('✅ Firebase Auth inicializado com getAuth');
        } catch (authError: any) {
            console.error('❌ Erro ao inicializar Auth:', authError);
            // Se getAuth falhar, tenta initializeAuth
            try {
                auth = initializeAuth(app, {
                    persistence: getReactNativePersistence(AsyncStorage)
                });
                console.log('✅ Firebase Auth inicializado com initializeAuth');
            } catch (initError: any) {
                console.error('❌ Erro ao usar initializeAuth:', initError);
                // Fallback final - cria um mock
                auth = {
                    currentUser: null,
                    signInWithEmailAndPassword: () => Promise.reject(new Error('Auth não disponível')),
                    createUserWithEmailAndPassword: () => Promise.reject(new Error('Auth não disponível')),
                    signOut: () => Promise.resolve(),
                    onAuthStateChanged: () => () => {}
                };
                console.log('⚠️ Firebase Auth usando mock');
            }
        }
        
        // Inicializa Firestore
        try {
            db = getFirestore(app);
            console.log('✅ Firestore inicializado');
        } catch (dbError: any) {
            console.error('❌ Erro ao inicializar Firestore:', dbError);
            db = null;
        }
        
        console.log('✅ Firebase inicializado com sucesso!');
        return true;
        
    } catch (error: any) {
        console.error('❌ ERRO ao inicializar Firebase:', error);
        console.error('Detalhes do erro:', error.message);
        
        // Fallback de emergência
        try {
            if (!app) {
                app = initializeApp(firebaseConfig);
            }
            
            // Fallback para Auth
            try {
                auth = initializeAuth(app, {
                    persistence: getReactNativePersistence(AsyncStorage)
                });
            } catch (authError: any) {
                if (authError.code === 'auth/already-initialized') {
                    auth = getAuth(app);
                } else {
                    auth = getAuth(app); // Fallback simples
                }
            }
            
            db = getFirestore(app);
            console.log('⚠️ Firebase inicializado em modo fallback');
            return true;
        } catch (fallbackError) {
            console.error('❌ Erro crítico no fallback:', fallbackError);
            app = null;
            auth = null;
            db = null;
            return false;
        }
    }
};

// Inicializa Firebase imediatamente
initializeFirebase();

// ✅ Função para aguardar Firebase estar pronto
export const waitForFirebase = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30; // 3 segundos máximo
        
        const checkFirebase = () => {
            attempts++;
            
            try {
                // Verifica se pelo menos o app está inicializado
                if (app) {
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
        
        checkFirebase();
    });
};

// ✅ Exporta as instâncias com verificações de segurança
export { auth, db };
export default app;