import { getDB, initDB } from './dbService';
import * as SQLite from 'expo-sqlite';  // Corrigido para usar expo-sqlite corretamente

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
      db.transaction((tx: SQLite.SQLTransaction) => {  // Usando o tipo correto SQLTransaction
        tx.executeSql(
          'SELECT * FROM readings ORDER BY measurement_time DESC;',
          [],
          (_, { rows }: { rows: SQLite.SQLResultSetRowList }) => resolve(rows._array),  // Tipagem de rows
          (_, err: SQLite.SQLError) => {
            console.error("Erro ao executar SQL:", err);
            reject(err);  // Agora o erro é tratado corretamente
            return true;  // Retorna true para indicar que o erro foi tratado
          }
        );
      });
    });

    const fileContent = JSON.stringify(readings, null, 2);
    const boundary = 'glucocare_boundary';
    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
    };

    const body =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\n` +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      `\r\n--${boundary}--`;

    // Verifica se o arquivo já existe no Google Drive
    const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
    const searchResp = await fetch(`${DRIVE_FILES_URL}?q=${q}&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let fileId: string | null = null;
    if (searchResp.ok) {
      const searchData = await searchResp.json();
      if (searchData.files && searchData.files.length > 0) {
        fileId = searchData.files[0].id;
      }
    }

    // Decide se cria ou atualiza o arquivo
    const url = fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
      : DRIVE_UPLOAD_URL;

    const res = await fetch(url, {
      method: fileId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
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
async function saveSyncTimestamp(db: SQLite.Database, isoString: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLite.SQLTransaction) => {  // Usando o tipo correto SQLTransaction
        tx.executeSql(
          `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?);`,
          ['last_sync', isoString]
        );
      },
      (err: SQLite.SQLError) => {  // Tipagem explícita de err
        console.warn("saveSyncTimestamp falhou:", err);
        reject(err);
        return true;  // Retorna true para indicar que o erro foi tratado
      },
      () => resolve(true)
    );
  });
}

export default {
  uploadReadingsToDrive,
  saveSyncTimestamp,
};
