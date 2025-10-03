import * as SQLite from 'expo-sqlite';
// Importa as instâncias e funções do Firebase/Firestore



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
    googleId?: string;
    onboardingCompleted?: boolean;
    biometricEnabled?: boolean;
    weight?: number | null;
    height?: number | null;
    birthDate?: string;
    condition?: string;
    restriction?: string;
    updated_at?: string;
    pending_sync?: boolean;
}

export interface Reading {
    id: string;
    measurement_time: string; 
    timestamp: number; 
    glucose_level: number;
    meal_context: string | null;
    time_since_meal: string | null;
    notes: string | null;
    updated_at?: string;
    deleted?: boolean;
    pending_sync?: boolean;
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
export async function executeTransaction(sql: string, args: any[] = []): Promise<SQLite.SQLResultSet> {
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
                restriction TEXT, updated_at TEXT, pending_sync INTEGER DEFAULT 0 
            );`
        );
        await executeTransaction(
            `CREATE TABLE IF NOT EXISTS readings (
                id TEXT PRIMARY KEY NOT NULL, measurement_time TEXT, glucose_level REAL,
                meal_context TEXT, time_since_meal TEXT, notes TEXT, 
                updated_at TEXT, deleted INTEGER DEFAULT 0, pending_sync INTEGER DEFAULT 0
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
        updated_at: row.updated_at,
        pending_sync: !!row.pending_sync,
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
        updated_at: row.updated_at,
        deleted: !!row.deleted,
        pending_sync: !!row.pending_sync,
    };
}




// ----------------------
// FUNÇÕES DE MANIPULAÇÃO DE DADOS (SQLite + Sync)
// ----------------------

/**
 * ✅ REATORADO
 * Salva ou atualiza usuário no SQLite e chama a sincronização.
 */
export async function saveOrUpdateUser(profile: UserProfile): Promise<UserProfile> {
    const sql = `INSERT OR REPLACE INTO users (id, full_name, email, google_id, onboarding_completed, biometric_enabled, weight, height, birth_date, diabetes_condition, restriction, updated_at, pending_sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    const updated_at = new Date().toISOString();
    const params = [ 
        profile.id, 
        profile.name, 
        profile.email, 
        profile.googleId, 
        profile.onboardingCompleted ? 1 : 0, 
        profile.biometricEnabled ? 1 : 0, 
        profile.weight, 
        profile.height, 
        profile.birthDate, 
        profile.condition, 
        profile.restriction,
        updated_at,
        1 // pending_sync = true
    ];

    await executeTransaction(sql, params);

    const user = await getUser();
    if (!user) throw new Error("Falha ao buscar usuário após salvar.");
    return user;
}


/**
 * ✅ REATORADO
 * Inserir leitura no SQLite e chama a sincronização.
 */
export async function addReading(reading: Reading): Promise<boolean> {
    const sql = `INSERT INTO readings (id, measurement_time, glucose_level, meal_context, time_since_meal, notes, updated_at, pending_sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const updated_at = new Date().toISOString();
    const params = [ reading.id, new Date(reading.timestamp).toISOString(), reading.glucose_level, reading.meal_context, reading.time_since_meal, reading.notes, updated_at, 1 ];

    await executeTransaction(sql, params);

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
    const result = await executeTransaction('SELECT * FROM readings WHERE deleted = 0 ORDER BY datetime(measurement_time) DESC;');
    return result.rows._array.map(normalizeReadingRow);
}


/**
 * ✅ CORREÇÃO CRÍTICA
 * Excluir leitura por ID no SQLite e sincroniza a exclusão com o Firestore.
 */
export async function deleteReading(id: string): Promise<boolean> {
    const sql = `UPDATE readings SET deleted = 1, pending_sync = 1, updated_at = ? WHERE id = ?`;
    const updated_at = new Date().toISOString();
    const result = await executeTransaction(sql, [updated_at, id]);
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