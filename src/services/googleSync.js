// Arquivo: ../services/googleSync.js

import { getDB, initDB } from './dbService';
import * as SecureStore from 'expo-secure-store';

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_FILE_NAME = 'glucocare_readings.json';

/**
 * 🔹 Upload leituras para o Google Drive
 */
async function uploadReadingsToDrive(accessToken) {
  try {
    // Verificação do token
    if (!accessToken) throw new Error("Token de acesso inválido");

    await initDB();
    const db = getDB();

    const readings = await new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM readings ORDER BY measurement_time DESC;',
          [],
          (_, { rows }) => resolve(rows._array),
          (_, err) => reject(err)
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

    // 🔍 Verifica se o arquivo já existe
    const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
    const searchResp = await fetch(`${DRIVE_FILES_URL}?q=${q}&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let fileId = null;
    if (searchResp.ok) {
      const searchData = await searchResp.json();
      if (searchData.files && searchData.files.length > 0) {
        fileId = searchData.files[0].id;
      }
    }

    // 🔄 Decide se cria (POST) ou atualiza (PATCH)
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

    // Após o upload, salvamos o timestamp da sincronização
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
async function saveSyncTimestamp(db, isoString) {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?);`,
          ['last_sync', isoString]
        );
      },
      (err) => {
        console.warn("saveSyncTimestamp falhou:", err);
        reject(err);
      },
      () => resolve(true)
    );
  });
}

// ⚠️ EXPORTAÇÃO CORRIGIDA: Exporta as funções como um objeto, permitindo a chamada
// GoogleSyncService.uploadReadingsToDrive()
export default {
  uploadReadingsToDrive,
  saveSyncTimestamp,
};