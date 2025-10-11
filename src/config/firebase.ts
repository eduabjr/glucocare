// src/config/firebase.ts

// 1. Importe os métodos necessários do SDK
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
// ✅ NOVO: Importe os métodos do Firestore
import { getFirestore, Firestore } from 'firebase/firestore'; 

// 2. Insira suas credenciais do Firebase
// ⚠️ ATENÇÃO: Estes são os VALORES REAIS do seu projeto 'glucocare-e68c8'.
const firebaseConfig: FirebaseOptions = {
    // Chave de API da Web (COPIADA DO GOOGLE SERVICES JSON)
    apiKey: "AIzaSyCvVmOXpVZsV6Bs3k73SUr-0G0j2tu7aLQ", 
    
    // Domínio de Autenticação (ID do Projeto correto)
    authDomain: "glucocare-e68c8.firebaseapp.com", 
    
    // ID do Projeto
    projectId: "glucocare-e68c8",
    
    // Bucket de Armazenamento (ID do Projeto correto)
    storageBucket: "glucocare-e68c8.appspot.com", 
    
    // Número do Projeto (COPIADO DO GOOGLE SERVICES JSON)
    messagingSenderId: "501715449083", 
    
    // ID do App (COPIADO DO GOOGLE SERVICES JSON)
    appId: "1:501715449083:android:8b781286cf0f02d752ac5e" 
};

// 3. Inicializa o aplicativo Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('🔥 Firebase inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
}

// 4. Exporta os serviços
export { auth, db };

// Função para verificar se o Firebase está inicializado
export const isFirebaseInitialized = () => {
  try {
    return app !== null && auth !== null && db !== null;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
};

// Se precisar do objeto app em outro lugar
export default app;
