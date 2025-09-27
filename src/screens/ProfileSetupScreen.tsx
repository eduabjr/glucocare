import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';
import { initDB, saveOrUpdateUser, getUser } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import GoogleSyncService from '../services/googleSync';

// Tipagem para o perfil do usuário
interface Profile {
  id: string;
  name: string;
  birthDate: string;
  condition: string;
  height: number;
  weight: number;
  restriction: string[];
}

export default function ProfileSetupScreen({ navigation }: { navigation: any }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<Date>(new Date(1990, 0, 1));
  const [showDate, setShowDate] = useState<boolean>(false);
  const [condition, setCondition] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [restrictions, setRestrictions] = useState<string[]>([]);

  const restrictionOptions = [
    'Lactose',
    'Glúten',
    'Amendoim',
    'Ovos',
    'Peixes',
    'Crustáceos',
    'Frutos Secos',
  ];

  // Carregar perfil existente
  useEffect(() => {
    (async () => {
      try {
        await initDB();
        const user = await getUser();

        if (user) {
          setUserId(user.id);
          setName(user.name || '');
          setBirthDate(user.birthDate ? new Date(user.birthDate) : new Date(1990, 0, 1));
          setCondition(user.condition || '');
          setHeight(user.height ? String(user.height) : '');
          setWeight(user.weight ? String(user.weight) : '');
          setRestrictions(user.restriction ? user.restriction.split(',') : []);
        } else {
          const saved = await SecureStore.getItemAsync('user_profile');
          if (saved) {
            const profile = JSON.parse(saved);
            setUserId(profile.id || uuidv4());
            setName(profile.name || '');
            setBirthDate(profile.birthDate ? new Date(profile.birthDate) : new Date(1990, 0, 1));
            setCondition(profile.condition || '');
            setHeight(profile.height ? String(profile.height) : '');
            setWeight(profile.weight ? String(profile.weight) : '');
            setRestrictions(profile.restriction ? profile.restriction.split(',') : []);
          } else {
            setUserId(uuidv4());
          }
        }
      } catch (err) {
        console.error('Erro init profile:', err);
      }
    })();
  }, []);

  // Alternar restrição alimentar
  const toggleRestriction = (item: string) => {
    setRestrictions((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  };

  // Salvar perfil
  const handleSave = async () => {
    try {
      // Validações
      if (!name.trim()) return Alert.alert('Erro', 'Digite seu nome.');
      if (!birthDate || isNaN(birthDate.getTime()))
        return Alert.alert('Erro', 'Informe sua data de nascimento.');
      if (!condition) return Alert.alert('Erro', 'Selecione sua condição.');
      if (!height.trim() || isNaN(Number(height)) || Number(height) < 50 || Number(height) > 250)
        return Alert.alert('Erro', 'Altura inválida (use cm).');
      if (!weight.trim() || isNaN(Number(weight)) || Number(weight) <= 0)
        return Alert.alert('Erro', 'Peso inválido.');

      const profile: Profile = {
        id: userId || uuidv4(),
        name: name.trim(),
        birthDate: birthDate.toISOString(),
        condition,
        height: Number(height),
        weight: Number(weight),
        restriction: restrictions,
      };

      const savedUser = await saveOrUpdateUser(profile);
      await SecureStore.setItemAsync('user_profile', JSON.stringify(savedUser));

      // 🛑 LINHAS CORRIGIDAS/VERIFICADAS 🛑
      try {
        const token = await SecureStore.getItemAsync('google_token');
        // A função é chamada no objeto importado.
        if (token && GoogleSyncService && typeof GoogleSyncService.uploadReadingsToDrive === 'function') {
          await GoogleSyncService.uploadReadingsToDrive(token);
        } else if (token) {
          // A função não é acessível, logamos para debug
          console.warn('GoogleSyncService ou uploadReadingsToDrive não é uma função.');
        }
      } catch (err) {
        console.warn('Falha ao sincronizar perfil (erro de execução do Drive):', err);
      }

      const isFirstTime = !(await SecureStore.getItemAsync('onboarding_done'));

      if (isFirstTime) {
        await SecureStore.setItemAsync('onboarding_done', 'true');
        Alert.alert('Sucesso', 'Perfil criado!');
        navigation.replace('BiometricSetup');
      } else {
        Alert.alert('Sucesso', 'Perfil atualizado!');
        navigation.replace('DrawerRoutes', { screen: 'Nutrition' });
      }
    } catch (err) {
      console.error('handleSave profile - erro:', err);
      Alert.alert('Erro', 'Não foi possível salvar o perfil.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>Edite suas informações pessoais</Text>

          {/* Nome */}
          <View style={styles.inputWrapper}>
            <Feather name="user" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Data de nascimento */}
          <View style={styles.inputWrapper}>
            <Feather name="calendar" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              value={birthDate.toLocaleDateString('pt-BR')}
              onChangeText={(text) => {
                const parts = text.split('/');
                if (parts.length === 3) {
                  const [dia, mes, ano] = parts.map((p) => parseInt(p, 10));
                  if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
                    const novaData = new Date(ano, mes - 1, dia);
                    if (!isNaN(novaData.getTime())) {
                      setBirthDate(novaData);
                    }
                  }
                }
              }}
            />
            <TouchableOpacity onPress={() => setShowDate(true)}>
              <Feather name="calendar" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
          {showDate && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selected) => {
                setShowDate(false);
                if (selected) setBirthDate(selected);
              }}
            />
          )}

          {/* Condição */}
          <View style={styles.inputWrapper}>
            <Feather name="list" size={18} color="#9ca3af" style={styles.inputIcon} />
            <Picker
              selectedValue={condition}
              onValueChange={setCondition}
              style={styles.pickerStyle}
              itemStyle={styles.pickerItemStyle}
            >
              <Picker.Item label="Selecione a Condição" value="" color="#9ca3af" />
              <Picker.Item label="Pré-diabetes" value="pre-diabetes" />
              <Picker.Item label="Diabetes Tipo 1" value="tipo-1" />
              <Picker.Item label="Diabetes Tipo 2" value="tipo-2" />
            </Picker>
          </View>

          {/* Altura */}
          <View style={styles.inputWrapper}>
            <Feather name="trending-up" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Altura (cm)"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>

          {/* Peso */}
          <View style={styles.inputWrapper}>
            <Feather name="activity" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Peso (kg)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          {/* Restrições Alimentares */}
          <Text style={[styles.sectionLabel, { marginTop: 10, marginBottom: 5 }]}>Restrições Alimentares</Text>
          <View style={styles.restrictionButtonsContainer}>
            {restrictionOptions.map((item) => {
              const isSelected = restrictions.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.restrictionButton,
                    isSelected && styles.restrictionButtonSelected,
                  ]}
                  onPress={() => toggleRestriction(item)}
                >
                  <Text
                    style={[
                      styles.restrictionButtonText,
                      isSelected && styles.restrictionButtonTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Salvar Alterações</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f6ff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#111827',
  },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#6b7280', marginBottom: 20 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    marginBottom: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 10, color: '#111827' },
  sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  restrictionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  restrictionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  restrictionButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  restrictionButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  restrictionButtonTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  pickerStyle: {
    flex: 1,
    color: '#111827',
    height: 40,
  },
  pickerItemStyle: {
    fontSize: 15,
  },
});
