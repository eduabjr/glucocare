// src/screens/BiometricSetupScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';

export default function BiometricSetupScreen({ navigation }) {
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const availableTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const isSupported = hasHardware && availableTypes.length > 0;
        setSupported(isSupported);

        if (!isSupported) {
          await SecureStore.setItemAsync('biometric_enabled', 'false');
        }
      } catch (err) {
        console.error('Erro ao verificar biometria:', err);
        setSupported(false);
        await SecureStore.setItemAsync('biometric_enabled', 'false');
      }
    })();
  }, []);

  const enableBiometric = async () => {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua biometria para ativar',
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        await SecureStore.setItemAsync('biometric_enabled', 'true');

        let storedEmail = await SecureStore.getItemAsync('registered_email');
        if (!storedEmail) {
          storedEmail = 'usuario@glucocare.com';
          await SecureStore.setItemAsync('registered_email', storedEmail);
        }

        let profile = await SecureStore.getItemAsync('user_profile');
        if (!profile) {
          profile = JSON.stringify({
            name: 'Usuário GlucoCare',
            email: storedEmail,
            createdAt: new Date().toISOString(),
          });
          await SecureStore.setItemAsync('user_profile', profile);
        }

        Alert.alert('Sucesso', 'Biometria ativada com sucesso!');
        navigation.replace('DrawerRoutes', { screen: 'Dashboard' });
      } else {
        Alert.alert('Falha', 'Não foi possível autenticar sua biometria.');
      }
    } catch (err) {
      console.error('enableBiometric - erro:', err);
      Alert.alert('Erro', 'Problema ao configurar biometria.');
      await SecureStore.setItemAsync('biometric_enabled', 'false');
    } finally {
      setLoading(false);
    }
  };

  const skipBiometric = async () => {
    await SecureStore.setItemAsync('biometric_enabled', 'false');
    navigation.replace('DrawerRoutes', { screen: 'Dashboard' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <MaterialIcons name="fingerprint" size={90} color="#7b2ff7" style={styles.icon} />

        <Text style={styles.title}>Configurar Biometria</Text>
        <Text style={styles.subtitle}>Proteja seus dados com segurança extra</Text>

        {supported ? (
          <View style={styles.card}>
            <Text style={styles.question}>Deseja habilitar a biometria?</Text>

            <View style={styles.optionGreen}>
              <Text style={styles.optionTitle}>🔒 Maior Segurança</Text>
              <Text style={styles.optionDesc}>
                Seus dados médicos ficarão protegidos por biometria.
              </Text>
            </View>

            <View style={styles.optionBlue}>
              <Text style={styles.optionTitle}>⚡ Acesso Rápido</Text>
              <Text style={styles.optionDesc}>
                Entre no app de forma rápida e segura.
              </Text>
            </View>

            {/* Botão Habilitar */}
            <TouchableOpacity
              style={{ width: '100%', marginTop: 18, marginBottom: 12 }}
              onPress={enableBiometric}
              disabled={loading}
            >
              <LinearGradient
                colors={['#7b2ff7', '#f107a3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.enableButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.enableText}>Habilitar Biometria →</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Botão Pular */}
            <TouchableOpacity style={styles.skipButton} onPress={skipBiometric}>
              <Text style={styles.skipText}>✕ Pular por Agora</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.warning}>
            Seu dispositivo não suporta autenticação biométrica.
          </Text>
        )}

        <Text style={styles.footer}>
          Você pode alterar essa configuração a qualquer momento em{"\n"}
          <Text style={{ fontWeight: '600', color: '#2563eb' }}>Configurações</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f6ff' },
  container: { flex: 1, padding: 24, alignItems: 'center' },
  icon: { marginTop: 40, marginBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 20, textAlign: 'center' },

  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  question: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: '#111827' },

  optionGreen: {
    backgroundColor: '#e6f8f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  optionBlue: { backgroundColor: '#e8f0fe', padding: 12, borderRadius: 10 },

  optionTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  optionDesc: { fontSize: 13, color: '#555', marginTop: 2 },

  enableButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  enableText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  skipButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  skipText: { fontSize: 15, fontWeight: '600', color: '#111827' },

  warning: { marginTop: 20, fontSize: 15, color: '#dc2626', textAlign: 'center' },
  footer: { marginTop: 28, fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
});
