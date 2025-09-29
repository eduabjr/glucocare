import * as SQLite from 'expo-sqlite';
// Importa as instâncias e funções do Firebase/Firestore
import { db, auth } from '../config/firebase'; 
import { doc, setDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore'; 
import { User as FirebaseAuthUser } from 'firebase/auth'; 

// --- NOME DO BANCO ---
const DB_NAME = 'glucocare.db';
let dbInstance: SQLite.Database | null = null; 

// ----------------------
// TIPAGEM (Fonte Única da Verdade)
// ----------------------

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    googleId: string;
    onboardingCompleted: boolean;
    biometricEnabled: boolean;
    weight: number | null;
    height: number | null;
    birthDate: string;
    condition: string;
    restriction: string;
    syncedAt: string | null;
}

export interface Reading {
    id: string;
    measurement_time: string; 
    timestamp: number; 
    glucose_level: number;
    meal_context: string | null;
    time_since_meal: string | null;
    notes: string | null;
    syncedAt: string | null; 
}

// ----------------------
// FUNÇÕES DE SERVIÇO BÁSICAS (SQLite)
// ----------------------

export function getDB(): SQLite.Database {
    if (!dbInstance) {
        dbInstance = SQLite.openDatabase(DB_NAME);
    }
    return dbInstance;
}

/**
 * ✅ HELPER DE TRANSAÇÃO
 * Centraliza a lógica de execução de transações SQL, retornando uma Promise.
 * Isso elimina a repetição de código em todas as outras funções.
 */
async function executeTransaction(sql: string, args: any[] = []): Promise<SQLite.SQLResultSet> {
    const database = getDB();
    return new Promise((resolve, reject) => {
        database.transaction(
            (tx) => {
                tx.executeSql(sql, args, 
                    (_, result) => resolve(result), 
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            },
            (error) => reject(error) // Erro na transação como um todo
        );
    });
}

/**
 * ✅ REATORADO
 * Inicializa o banco de dados de forma mais limpa usando o helper.
 */
export async function initDB(): Promise<void> {
    try {
        await executeTransaction(
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY NOT NULL, full_name TEXT, email TEXT, google_id TEXT,
                onboarding_completed INTEGER DEFAULT 0, biometric_enabled INTEGER DEFAULT 0,
                weight REAL, height REAL, birth_date TEXT, diabetes_condition TEXT,
                restriction TEXT, synced_at TEXT DEFAULT NULL 
            );`
        );
        await executeTransaction(
            `CREATE TABLE IF NOT EXISTS readings (
                id TEXT PRIMARY KEY NOT NULL, measurement_time TEXT, glucose_level REAL,
                meal_context TEXT, time_since_meal TEXT, notes TEXT, synced_at TEXT DEFAULT NULL
            );`
        );
        console.log('Banco inicializado com sucesso ✅');
    } catch (error) {
        console.error('initDB - erro:', error);
        throw error;
    }
}

// ----------------------
// FUNÇÕES DE NORMALIZAÇÃO (Sem alterações)
// ----------------------
function normalizeUserRow(row: any): UserProfile {
    return {
        id: row.id,
        name: String(row.full_name ?? ''), 
        email: String(row.email ?? ''), 
        googleId: String(row.google_id ?? ''), 
        onboardingCompleted: !!row.onboarding_completed,
        biometricEnabled: !!row.biometric_enabled,
        weight: row.weight ?? null, 
        height: row.height ?? null, 
        birthDate: String(row.birth_date ?? ''), 
        condition: String(row.diabetes_condition ?? ''), 
        restriction: String(row.restriction ?? ''),
        syncedAt: row.synced_at ?? null, 
    };
}

function normalizeReadingRow(row: any): Reading {
    const timestamp = row.measurement_time ? new Date(row.measurement_time).getTime() : Date.now();
    return {
        id: row.id,
        measurement_time: String(row.measurement_time),
        timestamp: timestamp, 
        glucose_level: row.glucose_level,
        meal_context: row.meal_context ?? null,
        time_since_meal: row.time_since_meal ?? null,
        notes: row.notes ?? null,
        syncedAt: row.synced_at ?? null, 
    };
}

// ----------------------
// FUNÇÕES DE SINCRONIZAÇÃO (FIREBASE)
// ----------------------
function getFirebaseUID(): string | null {
    return auth.currentUser?.uid || null;
}

// A função de sincronização de perfil (sem grandes alterações)
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> { /* ... (código original) ... */ }

// A função de sincronização de leitura (sem grandes alterações)
export async function syncReadingToFirestore(reading: Reading): Promise<void> { /* ... (código original) ... */ }

/**
 * ✅ NOVA FUNÇÃO
 * Sincroniza a exclusão de uma leitura com o Firestore.
 */
async function syncDeleteToFirestore(readingId: string): Promise<void> {
    const uid = getFirebaseUID();
    if (!uid) {
        console.warn("Usuário não autenticado. Exclusão no Firestore ignorada.");
        return;
    }
    try {
        const readingRef = doc(db, 'users', uid, 'readings', readingId);
        await deleteDoc(readingRef);
        console.log(`Leitura ${readingId} excluída do Firestore.`);
    } catch (error) {
        console.error("Erro ao excluir leitura do Firestore:", error);
        throw error;
    }
}


// ----------------------
// FUNÇÕES DE MANIPULAÇÃO DE DADOS (SQLite + Sync)
// ----------------------

/**
 * ✅ REATORADO
 * Salva ou atualiza usuário no SQLite e chama a sincronização.
 */
export async function saveOrUpdateUser(profile: UserProfile): Promise<UserProfile> {
    const sql = `INSERT OR REPLACE INTO users (id, full_name, email, google_id, onboarding_completed, biometric_enabled, weight, height, birth_date, diabetes_condition, restriction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    const params = [ profile.id, profile.name, profile.email, profile.googleId, profile.onboardingCompleted ? 1 : 0, profile.biometricEnabled ? 1 : 0, profile.weight, profile.height, profile.birthDate, profile.condition, profile.restriction ];

    await executeTransaction(sql, params);
    
    try {
        await syncUserProfileToFirestore(profile);
    } catch (error) {
        console.warn('Atenção: Falha na sincronização do perfil. Salvo apenas localmente.', error);
    }

    const user = await getUser();
    if (!user) throw new Error("Falha ao buscar usuário após salvar.");
    return user;
}


/**
 * ✅ REATORADO
 * Inserir leitura no SQLite e chama a sincronização.
 */
export async function addReading(reading: Reading): Promise<boolean> {
    const sql = `INSERT INTO readings (id, measurement_time, glucose_level, meal_context, time_since_meal, notes) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [ reading.id, new Date(reading.timestamp).toISOString(), reading.glucose_level, reading.meal_context, reading.time_since_meal, reading.notes ];

    await executeTransaction(sql, params);

    try {
        await syncReadingToFirestore(reading);
    } catch (error) {
        console.warn('Atenção: Falha na sincronização da leitura. Salvo apenas localmente.', error);
    }
    
    return true;
}


/**
 * ✅ REATORADO
 * Buscar usuário único no SQLite.
 */
export async function getUser(): Promise<UserProfile | null> {
    const result = await executeTransaction('SELECT * FROM users LIMIT 1;');
    if (result.rows.length > 0) {
        return normalizeUserRow(result.rows.item(0));
    }
    return null;
}


/**
 * ✅ REATORADO
 * Listar todas as leituras do SQLite.
 */
export async function listReadings(): Promise<Reading[]> {
    const result = await executeTransaction('SELECT * FROM readings ORDER BY datetime(measurement_time) DESC;');
    return result.rows._array.map(normalizeReadingRow);
}


/**
 * ✅ CORREÇÃO CRÍTICA
 * Excluir leitura por ID no SQLite e sincroniza a exclusão com o Firestore.
 */
export async function deleteReading(id: string): Promise<boolean> {
    try {
        await syncDeleteToFirestore(id);
    } catch (error) {
        console.warn(`Falha ao sincronizar exclusão para ${id}. Excluindo apenas localmente.`);
    }

    const result = await executeTransaction('DELETE FROM readings WHERE id = ?;', [id]);
    return result.rowsAffected > 0;
}


/**
 * ✅ REATORADO
 * Limpa todos os dados locais do usuário (usado no logout).
 */
export async function clearLocalData(): Promise<void> {
    await executeTransaction('DELETE FROM readings;');
    await executeTransaction('DELETE FROM users;');
    console.log("Dados locais do usuário limpos com sucesso.");
}