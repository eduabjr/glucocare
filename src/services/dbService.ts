import * as SQLite from 'expo-sqlite';

// Definindo o nome do banco
const DB_NAME = 'glucocare.db';
let db: SQLite.Database | null = null;

// Tipo para um usuário
// CORREÇÃO CRÍTICA: name, email, googleId devem ser estritamente 'string' para satisfazer o ProfileSetupScreen.
// Tratamos o NULL/undefined do DB para '' (string vazia) em normalizeUserRow.
interface UserProfile {
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
interface Reading {
  id: string;
  measurement_time: string;
  glucose_level: number;
  meal_context: string | null;
  time_since_meal: string | null;
  notes: string | null;
}

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
 * AJUSTE FINAL: Usa String(value || '') para garantir que o resultado é sempre uma string.
 */
function normalizeUserRow(row: any): UserProfile {
  return {
    id: row.id,
    // Usamos o Nullish coalescing (??) para pegar null ou undefined, e convertemos para string
    name: String(row.full_name ?? ''), 
    email: String(row.email ?? ''), 
    googleId: String(row.google_id ?? ''), 
    onboardingCompleted: !!row.onboarding_completed,
    biometricEnabled: !!row.biometric_enabled,
    weight: row.weight ?? null, // Nullish coalescing para number | null
    height: row.height ?? null, // Nullish coalescing para number | null
    birthDate: String(row.birth_date ?? ''), // Garante string
    condition: String(row.diabetes_condition ?? ''), // Garante string
    restriction: String(row.restriction ?? ''), // Garante string
  };
}

/**
 * Salvar ou atualizar usuário
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
            profile.birthDate || null, // Se for '' (string vazia), insere NULL no DB
            profile.condition || null, // Se for '' (string vazia), insere NULL no DB
            profile.restriction || null, // Se for '' (string vazia), insere NULL no DB
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