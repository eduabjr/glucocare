import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

interface NavigationProp {
  replace: (screen: string) => void;
}

const SettingsScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const handleLogout = async () => {
    try {
      // Limpa todos os dados armazenados
      await SecureStore.deleteItemAsync('google_token');
      await SecureStore.deleteItemAsync('registered_email');
      await SecureStore.deleteItemAsync('registered_password');
      await SecureStore.deleteItemAsync('user_profile');
      await SecureStore.deleteItemAsync('biometric_enabled');

      Alert.alert('Sessão encerrada', 'Você saiu da sua conta.');
      navigation.replace('Login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      Alert.alert('Erro', 'Não foi possível sair da conta.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>⚙️ Configurações</Text>

        {/* Preferências de Notificação */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="notifications" size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>Notificações</Text>
          </View>
          <Text style={styles.text}>
            Ativar lembretes de medições e consultas.
          </Text>
        </View>

        {/* Preferências de Backup */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="cloud-upload" size={20} color="#9333ea" />
            <Text style={styles.cardTitle}>Backup e Sincronização</Text>
          </View>
          <Text style={styles.text}>
            Sincronizar dados com sua conta Google.
          </Text>
        </View>

        {/* Sobre */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info" size={20} color="#16a34a" />
            <Text style={styles.cardTitle}>Sobre o App</Text>
          </View>
          <Text style={styles.text}>Versão 1.0.0</Text>
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color="#fff" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f6ff' },
  container: { padding: 16, paddingBottom: 30 },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginLeft: 6, color: '#111' },
  text: { fontSize: 14, color: '#555' },

  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
    backgroundColor: '#dc2626',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: { color: '#fff', fontWeight: '600', marginLeft: 8, fontSize: 15 },
});

export default SettingsScreen;
