import * as SQLite from 'expo-sqlite';

// Definindo o nome do banco
const DB_NAME = 'glucocare.db';
let db: SQLite.Database | null = null;

// Tipo para um usuário
// CORREÇÃO: name, email, googleId são estritamente 'string' para satisfazer o ProfileSetupScreen.
// A lógica de normalização (normalizeUserRow) garante que os valores NULL do DB se tornem '' (string vazia).
export interface UserProfile {
    id: string;
    name: string; // Estritamente string
    email: string; // Estritamente string
    googleId: string; // Estritamente string
    onboardingCompleted: boolean;
    biometricEnabled: boolean;
    weight: number | null;
    height: number | null;
    birthDate: string; // Estritamente string
    condition: string; // Estritamente string
    restriction: string; // Estritamente string
}

// Tipo para uma leitura
export interface Reading {
    id: string;
    measurement_time: string;
    glucose_level: number;
    meal_context: string | null;
    time_since_meal: string | null;
    notes: string | null;
}

// ----------------------
// FUNÇÕES DE SERVIÇO
// ----------------------

/**
 * Retorna instância única do DB
 */
export function getDB(): SQLite.Database {
    if (!db) {
        db = SQLite.openDatabase(DB_NAME);
    }
    return db;
}

/**
 * Inicializa tabelas do banco
 */
export async function initDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const database = getDB();

        database.transaction(
            (tx) => {
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
                        restriction TEXT
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
                        notes TEXT
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

/**
 * Normaliza linha de usuário -> objeto usado no app
 * Garante que todas as propriedades 'string' sejam strings, convertendo NULL para ''
 */
function normalizeUserRow(row: any): UserProfile {
    return {
        id: row.id,
        // Usamos Nullish coalescing (??) para pegar null ou undefined, e convertemos para string
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
    };
}

/**
 * Salvar ou atualizar usuário
 * Retorna UserProfile ou false (se a busca por getUser falhar após a transação)
 */
export async function saveOrUpdateUser(profile: UserProfile): Promise<UserProfile | boolean> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx) => {
                tx.executeSql(
                    `INSERT OR REPLACE INTO users 
                      (id, full_name, email, google_id, onboarding_completed, biometric_enabled,
                       weight, height, birth_date, diabetes_condition, restriction)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                    [
                        profile.id,
                        profile.name || null, // Se for '' (string vazia), insere NULL no DB
                        profile.email || null, // Se for '' (string vazia), insere NULL no DB
                        profile.googleId || null, // Se for '' (string vazia), insere NULL no DB
                        profile.onboardingCompleted ? 1 : 0,
                        profile.biometricEnabled ? 1 : 0,
                        profile.weight || null,
                        profile.height || null,
                        profile.birthDate || null, 
                        profile.condition || null, 
                        profile.restriction || null, 
                    ]
                );
            },
            (err) => {
                console.error('saveOrUpdateUser - erro transaction:', err);
                reject(err);
            },
            async () => {
                try {
                    // Pega o usuário recém-salvo e normaliza 
                    const user = await getUser(); 
                    if (user) {
                        resolve(user); // retorna já normalizado e tipado corretamente
                    } else {
                        resolve(false);  
                    }
                } catch (err) {
                    // Se a busca falhar, ainda resolve (mas com false)
                    console.error('saveOrUpdateUser - erro ao buscar usuário após salvar:', err);
                    resolve(false);  
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
        database.transaction((tx) => {
            tx.executeSql(
                `SELECT * FROM users LIMIT 1;`,
                [],
                (_, { rows }: { rows: SQLite.SQLResultSetRowList }) => {
                    if (rows.length > 0) {
                        // Chama normalizeUserRow que garante que strings são strings (não null/undefined)
                        resolve(normalizeUserRow(rows._array[0])); 
                    } else {
                        resolve(null); // Resolve como null se não encontrar usuário
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
 * Inserir leitura
 */
export async function addReading(reading: Reading): Promise<boolean> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx) => {
                tx.executeSql(
                    `INSERT INTO readings 
                       (id, measurement_time, glucose_level, meal_context, time_since_meal, notes)
                       VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        reading.id,
                        reading.measurement_time,
                        reading.glucose_level,
                        reading.meal_context || null,
                        reading.time_since_meal || null,
                        reading.notes || null,
                    ]
                );
            },
            (err) => {
                console.error('addReading - erro transaction:', err);
                reject(err);
            },
            () => resolve(true)
        );
    });
}

/**
 * Listar leituras
 */
export async function listReadings(): Promise<Reading[]> {
    const database = getDB();

    return new Promise((resolve, reject) => {
        database.transaction(
            (tx) => {
                tx.executeSql(
                    `SELECT * FROM readings ORDER BY datetime(measurement_time) DESC;`,
                    [],
                    (_, result) => {
                        resolve(result.rows._array || []);
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
            (tx) => {
                tx.executeSql(
                    'DELETE FROM readings WHERE id = ?;',
                    [id],
                    (_, result) => {
                        // Verifica se alguma linha foi afetada. Se rowsAffected for > 0, foi um sucesso.
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
                resolve(true); // Se a transação fechar sem erro SQL, considera sucesso
            } 
        );
    });
}