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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// CORREÇÃO 2: Importa o tipo correto DateTimePickerEvent
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; 
import { Picker } from '@react-native-picker/picker';
import { v4 as uuidv4 } from 'uuid';

import { addReading, updateReading } from '../services/dbService';
import { ThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name="blood-bag" 
              size={36} 
              color={theme.primary} 
            />
          </View>
          <Text style={styles.title}>{isEditing ? 'Editar Medição' : 'Nova Medição'}</Text>
          <Text style={styles.subtitle}>
            {isEditing ? 'Atualize os dados da sua medição' : 'Registre sua medição para acompanhamento'}
          </Text>
        </View>

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
          <TouchableOpacity style={styles.actionButtonWrapper} onPress={() => navigation.goBack()}>
            <LinearGradient
              colors={['#fef2f2', '#fee2e2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonWrapper} onPress={handleSave}>
            <LinearGradient
              colors={['#ecfdf5', '#d1fae5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.saveText}>{isEditing ? 'Atualizar Medição' : 'Salvar Medição'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  
  scrollContainer: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },

  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    backgroundColor: theme.primary + '20',
    borderRadius: 36,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 3, textAlign: 'center', color: theme.text },
  subtitle: { fontSize: 13, color: theme.secundaryText, marginBottom: 8, textAlign: 'center' },

  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },

  label: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 5, color: theme.text },
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
    marginTop: 3,
    marginBottom: 5,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.secundaryText,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.background,
  },

  buttonsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10,
    paddingHorizontal: 6,
  },
  actionButtonWrapper: {
    flex: 1,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    marginHorizontal: 6,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  cancelText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
  saveText: { color: '#059669', fontWeight: '600', fontSize: 14 },
});
