import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '../context/AuthContext';
import { useGoogleAuth } from '../services/authService';

type LoginScreenProps = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { loginWithEmail } = useAuth();
  const { promptAsync } = useGoogleAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    checkBiometricStatus();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Erro ao verificar suporte à biometria:', error);
      setBiometricSupported(false);
    }
  };

  const checkBiometricStatus = async () => {
    try {
      const status = await SecureStore.getItemAsync('biometric_enabled');
      setBiometricEnabled(status === 'true');
    } catch (error) {
      console.error('Erro ao verificar status da biometria:', error);
      setBiometricEnabled(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (error: any) {
      console.error('Erro no login:', error);
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      Alert.alert('Erro', 'Não foi possível fazer login com Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricSupported || !biometricEnabled) {
      Alert.alert('Biometria não disponível', 'A biometria não está configurada ou não é suportada neste dispositivo.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Use sua biometria para fazer login',
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        // Buscar credenciais salvas
        const savedEmail = await SecureStore.getItemAsync('registered_email');
        const savedPassword = await SecureStore.getItemAsync('saved_password');
        
        if (savedEmail && savedPassword) {
          await loginWithEmail(savedEmail, savedPassword);
        } else {
          Alert.alert('Erro', 'Credenciais não encontradas. Faça login manualmente.');
        }
      }
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      Alert.alert('Erro', 'Falha na autenticação biométrica.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.appName}>GlucoCare</Text>
        </View>

        {/* Título de boas-vindas */}
        <Text style={styles.welcomeText}>Bem-vindo ao GlucoCare</Text>

        {/* Botão Google */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={isLoading}>
          <View style={styles.googleIcon}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Entrar com Google</Text>
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OU</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Campo Email */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        {/* Campo Senha */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>

        {/* Botão Entrar */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleEmailLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        {/* Botão Biometria - Logo abaixo do botão Entrar */}
        {biometricSupported && biometricEnabled && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={isLoading}
          >
            <MaterialIcons name="fingerprint" size={20} color="#6b7280" style={styles.biometricIcon} />
            <Text style={styles.biometricButtonText}>Entrar com biometria</Text>
          </TouchableOpacity>
        )}

        {/* Links */}
        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>
            Não tem uma conta? <Text style={styles.registerTextBold}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleG: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  biometricIcon: {
    marginRight: 12,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  registerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  registerTextBold: {
    fontWeight: '600',
    color: '#2563eb',
  },
});