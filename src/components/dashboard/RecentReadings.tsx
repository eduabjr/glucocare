import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { listReadings } from '../../services/glucoseService';
// ✅ CAMINHO ADAPTADO: Usa '../utils/' porque 'utils' está dentro de 'components'
import { getReadingStatus } from '../utils/getReadingStatus'; 

// Definindo o tipo para leitura
interface Reading {
    id: string;
    glucose_level: number;
    measurement_time: string;
}

export default function RecentReadings() {
    const [readings, setReadings] = useState<Reading[]>([]);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        // Tipagem para listReadings() é importante para garantir a consistência
        const data: Reading[] = await listReadings(); 
        setReadings(data.slice(0, 5)); // só pega os 5 mais recentes
    };

    const renderItem = ({ item }: { item: Reading }) => (
        <View style={styles.item}>
            <Text>{new Date(item.measurement_time).toLocaleString()}</Text>
            <Text style={styles.level}>{item.glucose_level} mg/dL</Text>
            <Text>{getReadingStatus(item.glucose_level)}</Text> 
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Últimas Leituras</Text>

            {readings.length === 0 ? (
                <Text style={{ color: '#666' }}>Nenhuma medição registrada.</Text>
            ) : (
                <FlatList
                    data={readings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
    title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    item: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    level: { fontWeight: '700' },
});