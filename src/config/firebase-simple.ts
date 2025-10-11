// Configuração simplificada do Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCvVmOXpVZsV6Bs3k73SUr-0G0j2tu7aLQ",
    authDomain: "glucocare-e68c8.firebaseapp.com",
    projectId: "glucocare-e68c8",
    storageBucket: "glucocare-e68c8.appspot.com",
    messagingSenderId: "501715449083",
    appId: "1:501715449083:android:8b781286cf0f02d752ac5e"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
