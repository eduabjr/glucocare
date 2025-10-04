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
            
            // Mapeia os campos do SQLite para o formato do Firestore
            const firestoreUserData = {
                id: user.id,
                full_name: user.name,
                email: user.email,
                google_id: user.googleId,
                onboarding_completed: user.onboardingCompleted,
                biometric_enabled: user.biometricEnabled,
                weight: user.weight,
                height: user.height,
                birth_date: user.birthDate,
                diabetes_condition: user.condition, // Mapeia condition para diabetes_condition
                restriction: user.restriction,
                updated_at: new Date().toISOString(),
                email_verified: user.emailVerified || false
            };
            
            await setDoc(userRef, firestoreUserData, { merge: true });
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
        const firestoreData = userSnapshot.data();
        const remoteUpdatedAt = firestoreData.updated_at ? new Date(firestoreData.updated_at).getTime() : 0;
        if (remoteUpdatedAt > lastPulledAt) {
            // Mapeia os campos do Firestore para o formato do SQLite
            const userProfile: UserProfile = {
                id: firestoreData.id,
                name: firestoreData.full_name,
                email: firestoreData.email,
                googleId: firestoreData.google_id,
                onboardingCompleted: firestoreData.onboarding_completed,
                biometricEnabled: firestoreData.biometric_enabled,
                weight: firestoreData.weight,
                height: firestoreData.height,
                birthDate: firestoreData.birth_date,
                condition: firestoreData.diabetes_condition, // Mapeia diabetes_condition para condition
                restriction: firestoreData.restriction,
                emailVerified: firestoreData.email_verified || false
            };
            
            await saveOrUpdateUser(userProfile);
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