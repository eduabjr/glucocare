import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { createReading } from '../../services/glucoseService';

export default function FileImport() {
    const [importing, setImporting] = useState<boolean>(false);

    const importFile = async () => {
        setImporting(true);
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: 'text/csv',
                copyToCacheDirectory: true,
            });

            // 1. Verifica cancelamento
            if (res.canceled) {
                setImporting(false);
                return;
            }

            // 2. Verifica se há arquivos selecionados
            if (!res.assets || res.assets.length === 0) {
                throw new Error('Nenhum arquivo foi selecionado.');
            }

            // 3. Pega o primeiro arquivo (normalmente só um é selecionado)
            const file = res.assets[0];
            const fileUri = file.uri;
            const fileName = file.name;
            
            if (!fileUri || !fileName) {
                throw new Error('Dados do arquivo (URI ou Nome) não encontrados após seleção bem-sucedida.');
            }

            const content = await FileSystem.readAsStringAsync(fileUri);
            const lines = content.split('\n').filter(Boolean);
            let successCount = 0;

            for (const line of lines) {
                const parts = line.split(',');
                const dateString = parts[0]?.trim();
                const levelString = parts[1]?.trim();

                const level = Number(levelString);
                const date = dateString ? new Date(dateString) : new Date(NaN);

                if (dateString && !isNaN(level) && !isNaN(date.getTime())) {
                    await createReading({
                        measurement_time: date.toISOString(),
                        glucose_level: level,
                        meal_context: 'importado',
                        time_since_meal: 'n/a',
                        notes: `Importação CSV: ${fileName}`,
                    });
                    successCount++;
                } else {
                    console.warn(`Linha CSV ignorada: Formato inválido (${line})`);
                }
            }

            Alert.alert('Importação concluída', `${successCount} registros adicionados do arquivo ${fileName}.`);

        } catch (e: unknown) {
            console.error('Erro ao importar arquivo:', e);
            let errorMessage = 'Ocorreu um erro desconhecido. Verifique o console.';
            if (e instanceof Error) {
                errorMessage = e.message;
            } else if (typeof e === 'string') {
                errorMessage = e;
            }
            Alert.alert('Erro ao importar arquivo', errorMessage);
        } finally {
            setImporting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Importar Arquivo</Text>
            <TouchableOpacity style={styles.button} onPress={importFile} disabled={importing}>
                {importing ? <ActivityIndicator color="#fff" /> : <Text style={styles.bt}>Escolher Arquivo</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
    title: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    button: { backgroundColor: '#059669', padding: 12, borderRadius: 8, alignItems: 'center' },
    bt: { color: '#fff', fontWeight: '700' },
});