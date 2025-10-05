// src/utils/firestoreTest.ts
// Script para testar a conexão com o Firestore

import { db } from '../config/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

/**
 * Testa a conexão com o Firestore
 */
export async function testFirestoreConnection(): Promise<boolean> {
    try {
        console.log('🧪 Testando conexão com Firestore...');
        
        // Teste 1: Criar um documento de teste
        const testDocRef = doc(db, 'test', 'connection-test');
        const testData = {
            timestamp: new Date().toISOString(),
            message: 'Teste de conexão com Firestore',
            status: 'success'
        };
        
        console.log('📝 Criando documento de teste...');
        await setDoc(testDocRef, testData);
        console.log('✅ Documento criado com sucesso');
        
        // Teste 2: Ler o documento criado
        console.log('📖 Lendo documento de teste...');
        const docSnap = await getDoc(testDocRef);
        
        if (docSnap.exists()) {
            console.log('✅ Documento lido com sucesso:', docSnap.data());
        } else {
            console.log('❌ Documento não encontrado');
            return false;
        }
        
        // Teste 3: Limpar o documento de teste
        console.log('🗑️ Limpando documento de teste...');
        await deleteDoc(testDocRef);
        console.log('✅ Documento removido com sucesso');
        
        console.log('🎉 Teste de conexão com Firestore: SUCESSO');
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste de conexão com Firestore:', error);
        return false;
    }
}

/**
 * Testa a criação de um usuário no Firestore
 */
export async function testUserCreation(userId: string, userData: any): Promise<boolean> {
    try {
        console.log('👤 Testando criação de usuário...');
        
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, userData);
        
        console.log('✅ Usuário criado com sucesso');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        return false;
    }
}

/**
 * Testa a leitura de um usuário do Firestore
 */
export async function testUserReading(userId: string): Promise<any> {
    try {
        console.log('📖 Testando leitura de usuário...');
        
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            console.log('✅ Usuário lido com sucesso:', userSnap.data());
            return userSnap.data();
        } else {
            console.log('❌ Usuário não encontrado');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Erro ao ler usuário:', error);
        return null;
    }
}





