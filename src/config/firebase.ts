// src/config/firebase.ts

// 1. Importe os métodos necessários do SDK
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// 2. Insira suas credenciais do Firebase
// ⚠️ ATENÇÃO: Substitua os placeholders abaixo pelas suas chaves reais do seu projeto Firebase.
const firebaseConfig: FirebaseOptions = {
    apiKey: "SUA_API_KEY_AQUI", // Ex: AKsyCaB38T...
    authDomain: "seu-projeto-1234.firebaseapp.com",
    projectId: "seu-projeto-1234",
    storageBucket: "seu-projeto-1234.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

// 3. Inicializa o aplicativo Firebase
const app = initializeApp(firebaseConfig);

// 4. Obtém o serviço de Autenticação
export const auth = getAuth(app);

// 5. (Opcional) Você pode exportar outros serviços aqui, como Firestore:
// import { getFirestore } from 'firebase/firestore';
// export const db = getFirestore(app);

// Se precisar do objeto app em outro lugar
export default app;