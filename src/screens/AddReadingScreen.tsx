import { useState, useContext, useEffect } from 'react';
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
// CORREÇÃO 2: Importa o tipo correto DateTimePickerEvent
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; 
import { Picker } from '@react-native-picker/picker';
import { v4 as uuidv4 } from 'uuid';

import { addReading, updateReading } from '../services/dbService';
import { ThemeContext } from '../context/ThemeContext';

type MealContext = '' | 'jejum' | 'pre-refeicao' | 'pos-refeicao' | 'antes-dormir' | 'madrugada';

type AddReadingScreenProps = {
  navigation: { 
    goBack: () => void;
    getParam?: (param: string) => any;
  };
  route?: {
    params?: {
      readingToEdit?: any;
    };
  };
};

export default function AddReadingScreen({ navigation, route }: AddReadingScreenProps) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  // ✅ NOVO: Detecta se está editando uma medição
  const readingToEdit = route?.params?.readingToEdit;
  const isEditing = !!readingToEdit;

  const [glucose, setGlucose] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState<boolean>(false);
  const [mealContext, setMealContext] = useState<MealContext>('');
  const [notes, setNotes] = useState<string>('');

  // ✅ NOVO: Carrega dados da medição para edição
  useEffect(() => {
    if (isEditing && readingToEdit) {
      setGlucose(String(readingToEdit.glucose_level || ''));
      setDate(readingToEdit.measurement_time ? new Date(readingToEdit.measurement_time) : new Date());
      setMealContext(readingToEdit.meal_context || '');
      setNotes(readingToEdit.notes || '');
    }
  }, [isEditing, readingToEdit]);

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

      const reading = {
        id: isEditing ? readingToEdit.id : (() => {
          // Gera UUID com fallback apenas para novas medições
          try {
            return uuidv4();
          } catch {
            return `id-${Date.now()}`;
          }
        })(),
        measurement_time: date.toISOString(),
        glucose_level: n,
        meal_context: mealContext,
        time_since_meal: null,
        notes: notes.trim() || null,
        timestamp: date.getTime(), 
      };

      // ✅ NOVO: Salva ou atualiza conforme o modo
      if (isEditing) {
        await updateReading(readingToEdit.id, reading as any);
        Alert.alert('Sucesso', 'Medição atualizada com sucesso!');
      } else {
        await addReading(reading as any);
        Alert.alert('Sucesso', 'Medição salva com sucesso!');
      }

      resetForm();
      navigation.goBack();
    } catch (err) {
      console.error('handleSave AddReading - erro:', err);
      Alert.alert('Erro', `Falha inesperada ao ${isEditing ? 'atualizar' : 'salvar'} medição.`);
    }
  };

  // CORREÇÃO 2: Usa o tipo correto DateTimePickerEvent (e resolve aviso 'event')
  const onDateChange = (_event: DateTimePickerEvent, selectedDate: Date | undefined) => { 
    if (selectedDate) {
      setShowDate(false);
      setDate(selectedDate);
    } else {
      setShowDate(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Editar Medição' : 'Nova Medição'}</Text>
      <Text style={styles.subtitle}>
        {isEditing ? 'Atualize os dados da sua medição' : 'Registre sua medição para acompanhamento'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nível de Glicose (mg/dL) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 120"
          keyboardType="numeric"
          value={glucose}
          onChangeText={setGlucose}
          placeholderTextColor={theme.secundaryText}
        />
        <Text style={styles.limitText}>
          ⚠️ Intervalo permitido: mínimo 30 — máximo 600 mg/dL
        </Text>

        <Text style={styles.label}>Data e Hora *</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
          <Text style={{color: theme.text}}>{date.toLocaleString()}</Text>
        </TouchableOpacity>
        {showDate && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onDateChange}
          />
        )}

        <Text style={styles.label}>Contexto da Medição *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={mealContext}
            onValueChange={(itemValue: string) => setMealContext(itemValue as MealContext)}
            style={{color: theme.text}}
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
          placeholderTextColor={theme.secundaryText}
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
          <Text style={styles.saveText}>{isEditing ? 'Atualizar Medição' : 'Salvar Medição'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.background }, // fundo padrão

  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'center', color: theme.text },
  subtitle: { fontSize: 14, color: theme.secundaryText, marginBottom: 16, textAlign: 'center' },

  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },

  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6, color: theme.text },
  input: {
    borderWidth: 1,
    borderColor: theme.secundaryText,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: theme.background,
    color: theme.text,
  },

  limitText: {
    fontSize: 12,
    color: theme.error,
    marginTop: 4,
    marginBottom: 6,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.secundaryText,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.background,
  },

  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: theme.secundary, marginRight: 10 },
  saveButton: { backgroundColor: theme.primary, marginLeft: 10 },

  cancelText: { color: theme.text, fontWeight: '600', fontSize: 15 },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
