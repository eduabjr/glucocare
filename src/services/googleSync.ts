import { getDB, initDB } from './dbService';

// Tipos de compatibilidade para SQLite
type SQLTransaction = any;
type SQLError = any;
type SQLResultSetRowList = any;

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_FILE_NAME = 'glucocare_readings.json';

// Tipos para os dados de leitura
interface Reading {
  id: string;
  measurement_time: string;
  glucose_level: number;
  meal_context: string | null;
  time_since_meal: string | null;
  notes: string | null;
}

/**
 * 🔹 Upload leituras para o Google Drive
 */
async function uploadReadingsToDrive(accessToken: string): Promise<boolean> {
  try {
    if (!accessToken) throw new Error("Token de acesso inválido");

    await initDB();
    const db = getDB();

    // Buscar leituras do banco de dados
    const readings: Reading[] = await new Promise((resolve, reject) => {
      db.transaction((tx: SQLTransaction) => {
        tx.executeSql(
          'SELECT * FROM readings ORDER BY measurement_time DESC;',
          [],
          (_, { rows }: { rows: SQLResultSetRowList }) => resolve(rows._array),
          (_, err: SQLError) => {
            console.error("Erro ao executar SQL:", err);
            reject(err);
            return true;
          }
        );
      });
    });

    if (!readings || readings.length === 0) {
      console.log("Nenhuma leitura encontrada para upload");
      return true;
    }

    // Preparar dados para upload
    const dataToUpload = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      readings: readings,
      count: readings.length
    };

    const body = JSON.stringify(dataToUpload, null, 2);

    // Fazer upload para o Google Drive
    const res = await fetch(DRIVE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Drive upload falhou (status ${res.status}): ${text}`);
    }

    // Após o upload, salva o timestamp da sincronização
    await saveSyncTimestamp(db, new Date().toISOString());
    return true;
  } catch (err) {
    console.error('uploadReadingsToDrive - erro:', err);
    throw err;
  }
}

/**
 * 🔹 Salva timestamp de sincronização no SQLite
 */
async function saveSyncTimestamp(db: any, isoString: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLTransaction) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?);`,
          ['last_sync', isoString],
          () => resolve(true),
          (_, err: SQLError) => {
            console.warn("saveSyncTimestamp falhou:", err);
            reject(err);
            return true;
          }
        );
      },
      (err: SQLError) => {
        console.error("Erro na transação saveSyncTimestamp:", err);
        reject(err);
      },
      () => {
        console.log("Timestamp de sincronização salvo com sucesso");
        resolve(true);
      }
    );
  });
}

export default {
  uploadReadingsToDrive,
  saveSyncTimestamp,
};