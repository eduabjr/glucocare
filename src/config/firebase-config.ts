// ✅ CONFIGURAÇÃO FIREBASE PARA REACT NATIVE - VERSÃO DEFINITIVA
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
let app;
let auth;
let db;

try {
    // Verifica se já existe uma instância do Firebase
    if (getApps().length === 0) {
        // Primeira inicialização
        console.log('🔥 Inicializando Firebase pela primeira vez...');
        app = initializeApp(firebaseConfig);
        
        // ✅ Inicializa Auth (React Native usa persistência automática via AsyncStorage)
        auth = getAuth(app);
        
        db = getFirestore(app);
        console.log('✅ Firebase inicializado com sucesso!');
    } else {
        // Já existe uma instância, reutiliza
        console.log('♻️ Reutilizando instância existente do Firebase...');
        app = getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        console.log('✅ Firebase conectado!');
    }
} catch (error: any) {
    console.error('❌ ERRO CRÍTICO ao inicializar Firebase:', error);
    console.error('Detalhes do erro:', error.message);
    
    // ⚠️ Fallback de emergência
    if (!app && getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else if (!app) {
        app = getApp();
    }
    
    // Tenta obter auth e db mesmo com erro
    try {
        auth = getAuth(app);
        db = getFirestore(app);
        console.log('⚠️ Firebase inicializado em modo fallback');
    } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError);
    }
}

// ✅ Função para aguardar Firebase estar pronto
export const waitForFirebase = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo
        
        const checkFirebase = () => {
            attempts++;
            
            try {
                if (auth && db && app) {
                    console.log('✅ Firebase está pronto para uso!');
                    resolve(true);
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    console.error('⚠️ Timeout ao aguardar Firebase');
                    resolve(false);
                    return;
                }
                
                setTimeout(checkFirebase, 100);
            } catch (error) {
                console.error('❌ Erro ao verificar Firebase:', error);
                if (attempts >= maxAttempts) {
                    resolve(false);
                } else {
                    setTimeout(checkFirebase, 100);
                }
            }
        };
        
        checkFirebase();
    });
};

// ✅ Exporta as instâncias
export { auth, db };
export default app;
