import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { v4 as uuidv4 } from 'uuid';
import * as SecureStore from 'expo-secure-store';

import { addReading } from '../services/dbService';
import { uploadReadingsToDrive } from '../services/googleSync';

export default function AddReadingScreen({ navigation }) {
  const [glucose, setGlucose] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [mealContext, setMealContext] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setGlucose('');
    setMealContext('');
    setNotes('');
    setDate(new Date());
    Keyboard.dismiss();
  };

  const handleSave = async () => {
    try {
      const n = Number(glucose);

      if (!glucose || Number.isNaN(n)) {
        Alert.alert('Erro', 'Digite um valor numérico válido.');
        return;
      }
      if (n < 30 || n > 600) {
        Alert.alert('Erro', 'Valor fora do intervalo permitido (30–600 mg/dL).');
        return;
      }
      if (!mealContext) {
        Alert.alert('Erro', 'Selecione o contexto da medição.');
        return;
      }

      // Gera UUID com fallback
      let id;
      try {
        id = uuidv4();
      } catch {
        id = `id-${Date.now()}`;
      }

      const reading = {
        id,
        measurement_time: date.toISOString(),
        glucose_level: n,
        meal_context: mealContext,
        time_since_meal: null,
        notes: notes.trim() || null,
      };

      // 🔹 Salva no SQLite
      await addReading(reading);

      // 🔹 Se o usuário tem token Google → sincroniza automaticamente
      const token = await SecureStore.getItemAsync('google_token');
      if (token) {
        try {
          await uploadReadingsToDrive(token);
          console.log('Medições sincronizadas com Google Drive!');
        } catch (err) {
          console.warn('Falha ao sincronizar com Drive:', err);
        }
      }

      Alert.alert('Sucesso', 'Medição salva com sucesso!');
      resetForm();
      navigation.goBack();
    } catch (err) {
      console.error('handleSave AddReading - erro:', err);
      Alert.alert('Erro', 'Falha inesperada ao salvar medição.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Nova Medição</Text>
      <Text style={styles.subtitle}>Registre sua medição para acompanhamento</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nível de Glicose (mg/dL) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 120"
          keyboardType="numeric"
          value={glucose}
          onChangeText={setGlucose}
        />
        <Text style={styles.limitText}>
          ⚠️ Intervalo permitido: mínimo 30 — máximo 600 mg/dL
        </Text>

        <Text style={styles.label}>Data e Hora *</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
          <Text>{date.toLocaleString()}</Text>
        </TouchableOpacity>
        {showDate && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(event, selected) => {
              setShowDate(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        <Text style={styles.label}>Contexto da Medição *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={mealContext}
            onValueChange={(itemValue) => setMealContext(itemValue)}
          >
            <Picker.Item label="Selecione o contexto" value="" />
            <Picker.Item label="Jejum" value="jejum" />
            <Picker.Item label="Pré-refeição" value="pre-refeicao" />
            <Picker.Item label="Pós-refeição" value="pos-refeicao" />
            <Picker.Item label="Antes de dormir" value="antes-dormir" />
            <Picker.Item label="Madrugada" value="madrugada" />
          </Picker>
        </View>

        <Text style={styles.label}>Observações</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Ex: Senti tontura, fiz exercício..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={styles.saveText}>Salvar Medição</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f6ff' }, // fundo padrão

  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'center', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },

  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6, color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },

  limitText: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 4,
    marginBottom: 6,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },

  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#e5e7eb', marginRight: 10 },
  saveButton: { backgroundColor: '#2563eb', marginLeft: 10 },

  cancelText: { color: '#111827', fontWeight: '600', fontSize: 15 },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
