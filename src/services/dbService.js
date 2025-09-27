// src/services/dbService.js
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'glucocare.db';
let db = null;

/**
 * Retorna instância única do DB
 */
export function getDB() {
  if (!db) {
    db = SQLite.openDatabase(DB_NAME);
  }
  return db;
}

/**
 * Inicializa tabelas do banco
 */
export async function initDB() {
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
 */
function normalizeUserRow(row) {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    googleId: row.google_id,
    onboardingCompleted: !!row.onboarding_completed,
    biometricEnabled: !!row.biometric_enabled,
    weight: row.weight,
    height: row.height,
    birthDate: row.birth_date,
    condition: row.diabetes_condition,
    restriction: row.restriction,
  };
}

/**
 * Salvar ou atualizar usuário
 */
export async function saveOrUpdateUser(profile) {
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
          resolve(user); // retorna já normalizado
        } catch (err) {
          resolve(true); // fallback
        }
      }
    );
  });
}

/**
 * Buscar usuário único
 */
export async function getUser() {
  const database = getDB();

  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM users LIMIT 1;`,
        [],
        (_, { rows }) => {
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
 * Inserir leitura
 */
export async function addReading(reading) {
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
export async function listReadings() {
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
