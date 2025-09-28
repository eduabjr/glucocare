import * as SQLite from 'expo-sqlite';
// ✅ CORREÇÃO 1: Importação ajustada para o caminho mais provável
import { db, auth } from '../config/firebase'; 
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'; 
import { User as FirebaseAuthUser } from 'firebase/auth'; 
// ✅ CORREÇÃO 2: Importe a tipagem para transação do SQLite
import { SQLTransaction, SQLResultSetRowList } from 'expo-sqlite'; 

// Definindo o nome do banco
const DB_NAME = 'glucocare.db';
let dbInstance: SQLite.Database | null = null; 

// ----------------------
// TIPAGEM
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

/**
 * Interface de Leitura adaptada para o uso da propriedade 'timestamp'
 * para importação de arquivos (usada no fileParsingService).
 */
export interface Reading {
    id: string;
    // Campo usado para salvar no SQLite (ISO string)
    measurement_time: string; 
    // Novo campo: Usado pelo parser de arquivos (milissegundos UNIX)
    timestamp: number; 
    glucose_level: number;
    meal_context: string | null;
    time_since_meal: string | null;
    notes: string | null;
    syncedAt: string | null; 
}

// ----------------------
// FUNÇÕES DE SERVIÇO BÁSICAS
// ----------------------

/**
 * Retorna instância única do DB
 */
export function getDB(): SQLite.Database {
    if (!dbInstance) {
        dbInstance = SQLite.openDatabase(DB_NAME);
    }
    return dbInstance;
}

/**
 * Inicializa tabelas do banco
 */
export async function initDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const database = getDB();

        database.transaction(
            (tx: SQLTransaction) => { // Tx tipado
                // Usuários
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY NOT NULL,
                        full_name TEXT,
                        email TEXT,
                        google_id TEXT,
                        onboarding_completed INTEGER DEFAULT 0,
                        biometric_enabled INTEGER DEFAULT 0,
                        weight REAL,
                        height REAL,
                        birth_date TEXT,
                        diabetes_condition TEXT,
                        restriction TEXT,
                        synced_at TEXT DEFAULT NULL 
                    );`
                );

                // Leituras
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS readings (
                        id TEXT PRIMARY KEY NOT NULL,
                        measurement_time TEXT,
                        glucose_level REAL,
                        meal_context TEXT,
                        time_since_meal TEXT,
                        notes TEXT,
                        synced_at TEXT DEFAULT NULL 
                    );`
                );

                // Metadados de sincronização
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS sync_meta (
                        key TEXT PRIMARY KEY NOT NULL,
                        value TEXT
                    );`
                );
            },
            (err) => {
                console.error('initDB - erro transaction:', err);
                reject(err);
            },
            () => {
                console.log('Banco inicializado com sucesso ✅');
                resolve(true);
            }
        );
    });
}

// ----------------------
// FUNÇÕES DE NORMALIZAÇÃO
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
    // 💡 Ao normalizar do SQLite, preenchemos o timestamp para ser consistente
    const timestamp = row.measurement_time ? new Date(row.measurement_time).getTime() : Date.now();
    
    return {
        id: row.id,
        measurement_time: String(row.measurement_time),
        timestamp: timestamp, // Preenchemos o campo timestamp a partir da string
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

/**
 * Retorna o UID do usuário logado no Firebase Auth.
 */
function getFirebaseUID(): string | null {
    return auth.currentUser?.uid || null;
}

/**
 * Sincroniza o objeto UserProfile com o Cloud Firestore.
 */
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
    const uid = getFirebaseUID();

    if (!uid) {
        console.warn("Usuário não autenticado no Firebase. Sincronização de perfil ignorada.");
        return;
    }

    try {
        const userRef = doc(db, 'users', uid);

        const profileData = {
            full_name: profile.name,
            email: profile.email,
            google_id: profile.googleId,
            onboarding_completed: profile.onboardingCompleted,
            biometric_enabled: profile.biometricEnabled,
            weight: profile.weight,
            height: profile.height,
            birth_date: profile.birthDate,
            diabetes_condition: profile.condition,
            restriction: profile.restriction,
            syncedAt: serverTimestamp(), 
        };

        await setDoc(userRef, profileData, { merge: true });

        // Atualiza a marca d'água de sincronização no SQLite
        await new Promise<void>((resolve, reject) => {
            getDB().transaction(
                (tx: SQLTransaction) => { 
                    tx.executeSql(
                        `UPDATE users SET synced_at = ? WHERE id = ?;`,
                        [new Date().toISOString(), profile.id],
                        () => resolve(), 
                        (_, err) => { reject(err); return false; } 
                    );
                },
                (err) => reject(err), 
                () => resolve() 
            );
        });

        console.log(`Perfil do usuário ${uid} sincronizado no Firestore.`);
    } catch (error) {
        console.error("Erro ao sincronizar perfil do usuário com Firestore:", error);
        throw error;
    }
}


/**
 * Sincroniza o objeto Reading com o Cloud Firestore.
 */
export async function syncReadingToFirestore(reading: Reading): Promise<void> {
    const uid = getFirebaseUID();

    if (!uid) {
        console.warn("Usuário não autenticado no Firebase. Sincronização de leitura ignorada.");
        return;
    }

    try {
        const readingRef = doc(db, 'users', uid, 'readings', reading.id);
        
        // 💡 CONVERSÃO: O Firestore deve usar a hora Unix (number) ou o ISO String.
        // Já que a interface Reading usa 'timestamp' (number) e 'measurement_time' (string),
        // vamos usar o 'timestamp' para o Firestore, que é mais fácil de ordenar.
        const readingData = {
            id: reading.id,
            glucose_level: reading.glucose_level,
            meal_context: reading.meal_context,
            time_since_meal: reading.time_since_meal,
            notes: reading.notes,
            timestamp: reading.timestamp, // Usa o timestamp (number)
            measurement_time_iso: reading.measurement_time, // Guarda a string como referência
            syncedAt: serverTimestamp(), 
            userId: uid,
        };
        
        await setDoc(readingRef, readingData);

        // Atualiza a marca d'água de sincronização no SQLite
        await new Promise<void>((resolve, reject) => {
            getDB().transaction(
                (tx: SQLTransaction) => {
                    tx.executeSql(
                        `UPDATE readings SET synced_at = ? WHERE id = ?;`,
                        [new Date().toISOString(), reading.id],
                        () => resolve(), 
                        (_, err) => { reject(err); return false; } 
                    );
                },
                (err) => reject(err), 
                () => resolve() 
            );
        });

        console.log(`Leitura ${reading.id} sincronizada no Firestore.`);
    } catch (error) {
        console.error("Erro ao sincronizar leitura com Firestore:", error);
        throw error;
    }
}

// ----------------------
// FUNÇÕES DE MANIPULAÇÃO DE DADOS
// ----------------------

/**
 * Salvar ou atualizar usuário (Chama Sincronização)
 */
export async function saveOrUpdateUser(profile: UserProfile): Promise<UserProfile | boolean> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx: SQLTransaction) => {
                // CORREÇÃO: Adiciona 'synced_at' à lista de colunas e parâmetros do INSERT OR REPLACE
                tx.executeSql(
                    `INSERT OR REPLACE INTO users 
                     (id, full_name, email, google_id, onboarding_completed, biometric_enabled,
                      weight, height, birth_date, diabetes_condition, restriction, synced_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, // Adicionado um '?'
                    [
                        profile.id,
                        profile.name || null,
                        profile.email || null,
                        profile.googleId || null,
                        profile.onboardingCompleted ? 1 : 0,
                        profile.biometricEnabled ? 1 : 0,
                        profile.weight || null,
                        profile.height || null,
                        profile.birthDate || null, 
                        profile.condition || null, 
                        profile.restriction || null, 
                        profile.syncedAt || null, // Novo parâmetro
                    ]
                );
            },
            (err) => {
                console.error('saveOrUpdateUser - erro transaction:', err);
                reject(err);
            },
            async () => {
                try {
                    const user = await getUser(); 
                    if (user) {
                        // Chama a sincronização APÓS salvar localmente
                        await syncUserProfileToFirestore(user); 
                        resolve(user);
                    } else {
                        resolve(false); 
                    }
                } catch (err) {
                    console.error('saveOrUpdateUser - erro ao buscar ou sincronizar:', err);
                    // Se a sincronização falhar, ainda consideramos o salvamento local um sucesso
                    const user = await getUser();
                    resolve(user || false); 
                }
            }
        );
    });
}

/**
 * Inserir leitura (Chama Sincronização)
 */
export async function addReading(reading: Reading): Promise<boolean> {
    const database = getDB();

    // 💡 CONVERSÃO PRINCIPAL: Garante que a measurement_time seja uma string ISO
    // usando o 'timestamp' (milissegundos) que vem do fileParsingService.
    const isoTime = new Date(reading.timestamp).toISOString();
    
    // Sobrescreve o campo measurement_time na Reading antes de sincronizar/salvar
    const readingToSave: Reading = {
        ...reading,
        measurement_time: isoTime,
    };

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx: SQLTransaction) => {
                tx.executeSql(
                    `INSERT INTO readings 
                         (id, measurement_time, glucose_level, meal_context, time_since_meal, notes)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        readingToSave.id,
                        readingToSave.measurement_time, // String ISO
                        readingToSave.glucose_level,
                        readingToSave.meal_context || null,
                        readingToSave.time_since_meal || null,
                        readingToSave.notes || null,
                    ]
                );
            },
            (err) => {
                console.error('addReading - erro transaction:', err);
                reject(err);
            },
            async () => {
                try {
                    // Chama a sincronização APÓS salvar localmente
                    await syncReadingToFirestore(readingToSave); 
                    resolve(true);
                } catch (error) {
                    // A falha na sincronização não impede o sucesso local
                    console.warn('Atenção: Falha na sincronização da leitura. Salvo apenas localmente.');
                    resolve(true);
                }
            }
        );
    });
}

/**
 * Buscar usuário único
 */
export async function getUser(): Promise<UserProfile | null> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction((tx: SQLTransaction) => {
            tx.executeSql(
                `SELECT * FROM users LIMIT 1;`,
                [],
                (_, { rows }: { rows: SQLResultSetRowList }) => {
                    if (rows.length > 0) {
                        resolve(normalizeUserRow(rows._array[0])); 
                    } else {
                        resolve(null); 
                    }
                },
                (_, err) => {
                    console.error('getUser - erro:', err);
                    reject(err);
                    return false;
                }
            );
        });
    });
}

/**
 * Listar leituras
 */
export async function listReadings(): Promise<Reading[]> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx: SQLTransaction) => {
                tx.executeSql(
                    `SELECT * FROM readings ORDER BY datetime(measurement_time) DESC;`,
                    [],
                    (_, result) => {
                        // Mapeia os resultados para o tipo Reading
                        const readings = (result.rows._array || []).map(normalizeReadingRow);
                        resolve(readings);
                    }
                );
            },
            (err) => {
                console.error('listReadings - erro transaction:', err);
                reject(err);
            }
        );
    });
}

/**
 * Excluir leitura por ID
 */
export async function deleteReading(id: string): Promise<boolean> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx: SQLTransaction) => {
                tx.executeSql(
                    'DELETE FROM readings WHERE id = ?;',
                    [id],
                    (_, result) => {
                        // Verifica se alguma linha foi afetada
                        resolve(result.rowsAffected > 0); 
                    },
                    (_, error) => {
                        console.error("deleteReading - erro SQL:", error);
                        reject(error);
                        return false;
                    }
                );
            },
            (error) => {
                console.error("deleteReading - erro transaction:", error);
                reject(error);
            },
            () => {
                resolve(true);
            } 
        );
    });
}
