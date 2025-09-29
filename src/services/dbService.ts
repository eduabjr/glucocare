import * as SQLite from 'expo-sqlite';
// Importa as instâncias de Firebase/Firestore
import { db, auth } from '../config/firebase'; 
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'; 
import { User as FirebaseAuthUser } from 'firebase/auth'; 

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
    condition: string; // Mapeado para diabetes_condition no SQLite
    restriction: string;
    syncedAt: string | null;
}

/**
 * Interface de Leitura. O campo 'timestamp' é preferido para manipulação lógica (número),
 * enquanto 'measurement_time' (string ISO) é usado para armazenamento no SQLite.
 */
export interface Reading {
    id: string;
    // Campo usado para salvar no SQLite (ISO string)
    measurement_time: string; 
    // Campo preferido para manipulação e sincronização no Firestore (milissegundos UNIX)
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

/**
 * Retorna a instância única do DB (Lazy initialization)
 */
export function getDB(): SQLite.Database {
    if (!dbInstance) {
        // Abre o banco de dados. Expo o criará se não existir.
        dbInstance = SQLite.openDatabase(DB_NAME);
    }
    return dbInstance;
}

/**
 * Inicializa tabelas do banco de dados local.
 */
export async function initDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const database = getDB();

        database.transaction(
            (tx: SQLite.SQLTransaction) => {
                // Tabela de Usuários (Apenas um registro por app)
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

                // Tabela de Leituras (Registros de glicose)
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS readings (
                        id TEXT PRIMARY KEY NOT NULL,
                        measurement_time TEXT, -- Data e hora no formato ISO 8601
                        glucose_level REAL,
                        meal_context TEXT,
                        time_since_meal TEXT,
                        notes TEXT,
                        synced_at TEXT DEFAULT NULL -- Última sincronização com Firestore
                    );`
                );

                // Tabela de Metadados de sincronização (opcional, mantida para futuras expansões)
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
        // Conversão de 0/1 para boolean
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
    // Ao normalizar do SQLite, calcula o timestamp (ms) a partir da string ISO
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
            // Marca o tempo de sincronização no servidor
            syncedAt: serverTimestamp(), 
        };

        await setDoc(userRef, profileData, { merge: true });

        // Atualiza a marca d'água de sincronização no SQLite (local)
        await new Promise<void>((resolve, reject) => {
            getDB().transaction(
                (tx: SQLite.SQLTransaction) => { 
                    const now = new Date().toISOString();
                    tx.executeSql(
                        `UPDATE users SET synced_at = ? WHERE id = ?;`,
                        [now, profile.id],
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
        // Usa uma subcoleção 'readings' dentro do documento do usuário
        const readingRef = doc(db, 'users', uid, 'readings', reading.id);
        
        const readingData = {
            id: reading.id,
            glucose_level: reading.glucose_level,
            meal_context: reading.meal_context,
            time_since_meal: reading.time_since_meal,
            notes: reading.notes,
            // Usa o timestamp (number) para fácil ordenação e análise no Firestore
            timestamp: reading.timestamp, 
            measurement_time_iso: reading.measurement_time, // Guarda a string ISO como referência
            syncedAt: serverTimestamp(), 
            userId: uid,
        };
        
        await setDoc(readingRef, readingData);

        // Atualiza a marca d'água de sincronização no SQLite (local)
        await new Promise<void>((resolve, reject) => {
            getDB().transaction(
                (tx: SQLite.SQLTransaction) => {
                    const now = new Date().toISOString();
                    tx.executeSql(
                        `UPDATE readings SET synced_at = ? WHERE id = ?;`,
                        [now, reading.id],
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
// FUNÇÕES DE MANIPULAÇÃO DE DADOS (SQLite + Sync)
// ----------------------

/**
 * Salva ou atualiza usuário no SQLite e chama a sincronização com o Firestore.
 */
export async function saveOrUpdateUser(profile: UserProfile): Promise<UserProfile | boolean> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx: SQLite.SQLTransaction) => {
                // Usa INSERT OR REPLACE para garantir que sempre haja apenas 1 registro de usuário
                tx.executeSql(
                    `INSERT OR REPLACE INTO users 
                     (id, full_name, email, google_id, onboarding_completed, biometric_enabled,
                     weight, height, birth_date, diabetes_condition, restriction, synced_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
                        profile.syncedAt || null, 
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
                        // Deve sempre encontrar o usuário que acabou de ser salvo, mas por segurança.
                        resolve(false); 
                    }
                } catch (err) {
                    console.warn('Atenção: Falha na sincronização do perfil. Salvo apenas localmente.', err);
                    // Se a sincronização falhar, ainda consideramos o salvamento local um sucesso
                    const user = await getUser();
                    resolve(user || false); 
                }
            }
        );
    });
}

/**
 * Inserir leitura no SQLite e chama a sincronização com o Firestore.
 */
export async function addReading(reading: Reading): Promise<boolean> {
    const database = getDB();

    // CONVERSÃO PRINCIPAL: Garante que a measurement_time seja uma string ISO
    // usando o 'timestamp' (milissegundos) que vem da fonte de dados (formulário ou arquivo).
    const isoTime = new Date(reading.timestamp).toISOString();
    
    // Objeto final para salvar localmente e sincronizar
    const readingToSave: Reading = {
        ...reading,
        measurement_time: isoTime,
    };

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx: SQLite.SQLTransaction) => {
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
 * Buscar usuário único no SQLite.
 */
export async function getUser(): Promise<UserProfile | null> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction((tx: SQLite.SQLTransaction) => {
            tx.executeSql(
                `SELECT * FROM users LIMIT 1;`,
                [],
                (_, { rows }: { rows: SQLite.SQLResultSetRowList }) => { 
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
 * Listar todas as leituras do SQLite, ordenadas por data.
 */
export async function listReadings(): Promise<Reading[]> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx: SQLite.SQLTransaction) => {
                tx.executeSql(
                    // Ordena pelo campo measurement_time (string ISO) convertido para datetime
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
 * Excluir leitura por ID no SQLite.
 */
export async function deleteReading(id: string): Promise<boolean> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx: SQLite.SQLTransaction) => {
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

// ----------------------
// FUNÇÕES DE LIMPEZA DE ESTADO
// ----------------------

/**
 * Remove o único usuário (perfil) do banco de dados local (SQLite).
 * Usado primariamente no logout.
 */
export async function clearUser(): Promise<boolean> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx: SQLite.SQLTransaction) => {
                tx.executeSql(
                    `DELETE FROM users;`,
                    [],
                    (_, result) => {
                        resolve(true); 
                    },
                    (_, error) => {
                        console.error("clearUser - erro SQL:", error);
                        reject(error);
                        return false;
                    }
                );
            },
            (error) => {
                console.error("clearUser - erro transaction:", error);
                reject(error);
            },
            () => {
                resolve(true);
            }
        );
    });
}
