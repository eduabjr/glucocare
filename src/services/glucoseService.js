// src/services/glucoseService.js

import 'react-native-get-random-values'; // CORREÇÃO: Adicionada para suportar uuidv4
import { getDB, initDB } from './dbService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Valida valor de glicemia (retorna número ou throws)
 */
function validateGlucoseValue(value) {
  const n = Number(value);
  if (Number.isNaN(n)) throw new Error('Valor inválido');
  if (n <= 0 || n > 1000) throw new Error('Valor fora do intervalo esperado');
  return n;
}

export async function createReading({
  measurement_time = new Date().toISOString(),
  glucose_level,
  meal_context = null,
  time_since_meal = null,
  notes = null,
}) {
  try {
    await initDB();
    const db = getDB();
    // O erro "crypto.getRandomValues() not supported" ocorria nesta linha:
    const id = uuidv4();
    const normalizedTime = new Date(measurement_time).toISOString();
    const level = validateGlucoseValue(glucose_level);

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO readings (id, measurement_time, glucose_level, meal_context, time_since_meal, notes) VALUES (?, ?, ?, ?, ?, ?);`,
          [id, normalizedTime, level, meal_context, time_since_meal, notes],
          (_, result) => resolve({ id, measurement_time: normalizedTime, glucose_level: level }),
          (_, error) => {
            console.error('createReading - sql error:', error);
            reject(error);
          }
        );
      });
    });
  } catch (err) {
    console.error('createReading - erro:', err);
    throw err;
  }
}

export async function addReading(value) {
  // conveniência para chamadas simples
  const level = validateGlucoseValue(value);
  return createReading({ measurement_time: new Date().toISOString(), glucose_level: level });
}

export async function listReadings() {
  await initDB();
  const db = getDB();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM readings ORDER BY measurement_time DESC;',
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error('listReadings - sql error:', error);
          reject(error);
        }
      );
    });
  });
}