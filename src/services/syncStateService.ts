import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_PULLED_AT_KEY = 'last_pulled_at';

export async function getLastPulledAt(): Promise<number> {
    try {
        const value = await AsyncStorage.getItem(LAST_PULLED_AT_KEY);
        return value ? parseInt(value, 10) : 0;
    } catch (error) {
        console.error('Error getting last pulled at timestamp:', error);
        return 0;
    }
}

export async function setLastPulledAt(timestamp: number): Promise<void> {
    try {
        await AsyncStorage.setItem(LAST_PULLED_AT_KEY, timestamp.toString());
    } catch (error) {
        console.error('Error setting last pulled at timestamp:', error);
    }
}
