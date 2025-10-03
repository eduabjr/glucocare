import 'react-native-get-random-values'; // CORREÇÃO: Adicionada para suportar uuidv4
import { getDB, initDB } from './dbService';
import { v4 as uuidv4 } from 'uuid';
import * as SQLite from 'expo-sqlite';  // Corrigido para importar corretamente

// Tipo para a leitura de glicemia
interface GlucoseReading {
  id: string;
  measurement_time: string;
  glucose_level: number;
  meal_context: string | null;
  time_since_meal: string | null;
  notes: string | null;
}

/**
 * Valida valor de glicemia (retorna número ou throws)
 */
function validateGlucoseValue(value: any): number {
  const n = Number(value);
  if (Number.isNaN(n)) throw new Error('Valor inválido');
  if (n <= 0 || n > 1000) throw new Error('Valor fora do intervalo esperado');
  return n;
}

/**
 * Cria uma nova leitura de glicemia
 */
export async function createReading({
  measurement_time = new Date().toISOString(),
  glucose_level,
  meal_context = null,
  time_since_meal = null,
  notes = null,
}: {
  measurement_time?: string;
  glucose_level: number;
  meal_context?: string | null;
  time_since_meal?: string | null;
  notes?: string | null;
}): Promise<GlucoseReading> {
  try {
    await initDB();
    const db = getDB();
    const id = uuidv4();
    const normalizedTime = new Date(measurement_time).toISOString();
    const level = validateGlucoseValue(glucose_level);

    return new Promise((resolve, reject) => {
      db.transaction((tx: SQLite.SQLTransaction) => {  // Usando o tipo correto SQLTransaction
        tx.executeSql(
          `INSERT INTO readings (id, measurement_time, glucose_level, meal_context, time_since_meal, notes) VALUES (?, ?, ?, ?, ?, ?);`,
          [id, normalizedTime, level, meal_context, time_since_meal, notes],
          (_, _result) => resolve({ id, measurement_time: normalizedTime, glucose_level: level, meal_context, time_since_meal, notes }), // Garantir que todas as propriedades sejam passadas
          (_, error: SQLite.SQLError) => {
            console.error('createReading - sql error:', error);
            reject(error);
            return true;  // Retorna true para indicar que o erro foi tratado
          }
        );
      });
    });
  } catch (err) {
    console.error('createReading - erro:', err);
    throw err;
  }
}

/**
 * Adiciona uma leitura de glicemia com um valor simples
 */
export async function addReading(value: number): Promise<GlucoseReading> {
  // Conveniência para chamadas simples
  const level = validateGlucoseValue(value);
  return createReading({ measurement_time: new Date().toISOString(), glucose_level: level });
}

/**
 * Lista todas as leituras de glicemia
 */
export async function listReadings(): Promise<GlucoseReading[]> {
  await initDB();
  const db = getDB();
  return new Promise((resolve, reject) => {
    db.transaction((tx: SQLite.SQLTransaction) => {  // Usando o tipo correto SQLTransaction
      tx.executeSql(
        'SELECT * FROM readings ORDER BY measurement_time DESC;',
        [],
        (_, { rows }: { rows: SQLite.SQLResultSetRowList }) => resolve(rows._array),  // Tipagem de rows
        (_, error: SQLite.SQLError) => {
          console.error('listReadings - sql error:', error);
          reject(error);
          return true;  // Retorna true para indicar que o erro foi tratado
        }
      );
    });
  });
}
