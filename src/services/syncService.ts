import { db } from '../config/firebase';
import { doc, setDoc, writeBatch, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { getUser, listReadings, executeTransaction, saveOrUpdateUser, addReading, deleteReading, UserProfile } from './dbService';
import { getLastPulledAt, setLastPulledAt } from './syncStateService';
import { Reading } from './dbService';

async function pushUsers() {
    // For now, we only have one user, so we get it directly.
    const user = await getUser();
    if (user && user.pending_sync) {
        try {
            const userRef = doc(db, 'users', user.id);
            await setDoc(userRef, { ...user, updated_at: new Date().toISOString() }, { merge: true });
            await executeTransaction('UPDATE users SET pending_sync = 0 WHERE id = ?', [user.id]);
            console.log('👤 User profile pushed to Firestore');
        } catch (error) {
            console.error('Error pushing user profile:', error);
            throw error;
        }
    }
}

async function pushReadings() {
    const readings = await listReadings();
    const pendingReadings = readings.filter(r => r.pending_sync);

    if (pendingReadings.length === 0) {
        return;
    }

    const user = await getUser();
    if (!user) {
        console.error("Cannot push readings without a user.");
        return;
    }

    const batch = writeBatch(db);
    const successfullyPushedIds: string[] = [];

    for (const reading of pendingReadings) {
        const readingRef = doc(db, 'users', user.id, 'readings', reading.id);
        if (reading.deleted) {
            batch.delete(readingRef);
        } else {
            batch.set(readingRef, { ...reading, updated_at: new Date().toISOString() });
        }
        successfullyPushedIds.push(reading.id);
    }

    try {
        await batch.commit();
        console.log(`📚 ${pendingReadings.length} readings pushed to Firestore.`);

        // Clear pending_sync flag for pushed readings
        const placeholders = successfullyPushedIds.map(() => '?').join(',');
        await executeTransaction(`UPDATE readings SET pending_sync = 0 WHERE id IN (${placeholders})`, successfullyPushedIds);

    } catch (error) {
        console.error('Error pushing readings:', error);
        throw error;
    }
}

async function pullChanges() {
    const lastPulledAt = await getLastPulledAt();
    const user = await getUser();

    if (!user) {
        console.error("Cannot pull changes without a user.");
        return;
    }

    // Pull user profile changes
    const userRef = doc(db, 'users', user.id);
    // ✅ CORREÇÃO: Para um documento específico, usamos getDoc, não getDocs com query
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
        const remoteUser = userSnapshot.data() as UserProfile;
        const remoteUpdatedAt = remoteUser.updated_at ? new Date(remoteUser.updated_at).getTime() : 0;
        if (remoteUpdatedAt > lastPulledAt) {
            await saveOrUpdateUser(remoteUser as any);
            console.log('👤 User profile pulled from Firestore');
        }
    }


    // Pull readings changes
    const readingsRef = collection(db, 'users', user.id, 'readings');
    const q = query(readingsRef, where("updated_at", ">", new Date(lastPulledAt)));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return;
    }

    for (const doc of querySnapshot.docs) {
        const reading = doc.data() as Reading;
        if (reading.deleted) {
            await deleteReading(reading.id);
        } else {
            await addReading(reading);
        }
    }

    console.log(`📚 ${querySnapshot.size} readings pulled from Firestore.`);

    await setLastPulledAt(Date.now());
}


export async function syncOfflineData() {
    console.log('🔄 Starting offline data sync...');
    try {
        await pushUsers();
        await pushReadings();
        await pullChanges();
        console.log('✅ Offline data sync finished.');
    } catch (error) {
        console.error('❌ Offline data sync failed.', error);
    }
}