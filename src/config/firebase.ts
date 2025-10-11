// ✅ ARQUIVO DE COMPATIBILIDADE - RE-EXPORTA CONFIGURAÇÃO FIREBASE
// Este arquivo resolve os imports que referenciam '../config/firebase'
// Mantém compatibilidade com código existente

export { auth, db, waitForFirebase } from './firebase-config';
export { default as app } from './firebase-config';

