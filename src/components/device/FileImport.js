import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { createReading } from '../../services/glucoseService';

export default function FileImport() {
  const [importing, setImporting] = useState(false);

  const importFile = async () => {
    setImporting(true);
    try {
      // Usa type: 'text/csv' para garantir que apenas arquivos CSV sejam selecionáveis
      const res = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true, // Garante que o arquivo esteja em um URI acessível
      });

      // Verifica se o usuário cancelou a ação
      if (res.canceled === true) {
        setImporting(false);
        return;
      }

      // Usa res.assets para compatibilidade com versões mais recentes do Expo
      if (res.assets && res.assets.length > 0) {
        const file = res.assets[0];

        if (!file.uri) {
          throw new Error('URI do arquivo não encontrado após seleção.');
        }

        const content = await FileSystem.readAsStringAsync(file.uri);
        // Divide o conteúdo por nova linha e remove linhas vazias
        const lines = content.split('\n').filter(Boolean);
        let successCount = 0;

        for (let line of lines) {
          // Espera formato CSV: "data_hora,nivel_glicose"
          const [dateString, levelString] = line.split(',');
          
          const level = Number(levelString);
          const date = new Date(dateString);

          // Validação básica
          if (dateString && !isNaN(level) && !isNaN(date.getTime())) {
            await createReading({
              measurement_time: date.toISOString(),
              glucose_level: level,
              meal_context: 'importado',
              time_since_meal: 'n/a',
              notes: `Importação CSV: ${file.name}`,
            });
            successCount++;
          } else {
            console.warn(`Linha CSV ignorada: Formato inválido (${line})`);
          }
        }
        Alert.alert('Importação concluída', `${successCount} registros adicionados.`);
      }

    } catch (e) {
      console.error('Erro ao importar arquivo:', e);
      Alert.alert('Erro ao importar arquivo', e.message || 'Ocorreu um erro desconhecido. Verifique o console.');
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