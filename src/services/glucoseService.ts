import 'react-native-get-random-values'; // CORREÇÃO: Adicionada para suportar uuidv4
import { getDB, initDB } from './dbService';
import { v4 as uuidv4 } from 'uuid';

// Tipos de compatibilidade
type SQLTransaction = any;
type SQLError = any;

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
      db.transaction((tx: SQLTransaction) => {
        tx.executeSql(
          `INSERT INTO readings (id, measurement_time, glucose_level, meal_context, time_since_meal, notes) VALUES (?, ?, ?, ?, ?, ?);`,
          [id, normalizedTime, level, meal_context, time_since_meal, notes],
          (_, _result) => resolve({ 
            id, 
            measurement_time: normalizedTime, 
            glucose_level: level, 
            meal_context, 
            time_since_meal, 
            notes 
          }),
          (_, error: SQLError) => {
            console.error('createReading - sql error:', error);
            reject(error);
            return true;
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
  try {
    await initDB();
    const db = getDB();

    return new Promise((resolve, reject) => {
      db.transaction((tx: SQLTransaction) => {
        tx.executeSql(
          'SELECT * FROM readings ORDER BY measurement_time DESC;',
          [],
          (_, result) => {
            const readings: GlucoseReading[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              readings.push(result.rows.item(i));
            }
            resolve(readings);
          },
          (_, error: SQLError) => {
            console.error('listReadings - sql error:', error);
            reject(error);
            return true;
          }
        );
      });
    });
  } catch (err) {
    console.error('listReadings - erro:', err);
    throw err;
  }
}

/**
 * Remove uma leitura de glicemia
 */
export async function deleteReading(id: string): Promise<boolean> {
  try {
    await initDB();
    const db = getDB();

    return new Promise((resolve, reject) => {
      db.transaction((tx: SQLTransaction) => {
        tx.executeSql(
          'DELETE FROM readings WHERE id = ?;',
          [id],
          (_, _result) => {
            console.log('Leitura removida com sucesso');
            resolve(true);
          },
          (_, error: SQLError) => {
            console.error('deleteReading - sql error:', error);
            reject(error);
            return true;
          }
        );
      });
    });
  } catch (err) {
    console.error('deleteReading - erro:', err);
    throw err;
  }
}

/**
 * Atualiza uma leitura existente
 */
export async function updateReading(id: string, updates: Partial<GlucoseReading>): Promise<boolean> {
  try {
    await initDB();
    const db = getDB();

    const fields = [];
    const values = [];

    if (updates.glucose_level !== undefined) {
      fields.push('glucose_level = ?');
      values.push(validateGlucoseValue(updates.glucose_level));
    }
    if (updates.meal_context !== undefined) {
      fields.push('meal_context = ?');
      values.push(updates.meal_context);
    }
    if (updates.time_since_meal !== undefined) {
      fields.push('time_since_meal = ?');
      values.push(updates.time_since_meal);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }

    if (fields.length === 0) {
      return true; // Nada para atualizar
    }

    values.push(id);

    return new Promise((resolve, reject) => {
      db.transaction((tx: SQLTransaction) => {
        tx.executeSql(
          `UPDATE readings SET ${fields.join(', ')} WHERE id = ?;`,
          values,
          (_, _result) => {
            console.log('Leitura atualizada com sucesso');
            resolve(true);
          },
          (_, error: SQLError) => {
            console.error('updateReading - sql error:', error);
            reject(error);
            return true;
          }
        );
      });
    });
  } catch (err) {
    console.error('updateReading - erro:', err);
    throw err;
  }
}