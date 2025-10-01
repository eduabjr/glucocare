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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, AntDesign } from '@expo/vector-icons';
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
  const { loginWithEmail, user } = useAuth();
  const { promptAsync, loading: googleLoading, error: googleError } = useGoogleAuth();

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

  // ✅ NOVO: Monitora mudanças no user do AuthContext
  useEffect(() => {
    if (user?.biometricEnabled !== undefined) {
      console.log('🔐 Biometria atualizada via AuthContext:', user.biometricEnabled);
      setBiometricEnabled(user.biometricEnabled);
    }
  }, [user?.biometricEnabled]);

  useEffect(() => {
    if (googleError) {
      Alert.alert('Erro', googleError.message || 'Não foi possível fazer login com Google.');
    }
  }, [googleError]);

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
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'E-mail ou senha inválidos.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O formato do e-mail é inválido.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      }
      
      Alert.alert('Erro de Autenticação', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o login com Google.');
    }
  };

  const handleBiometricLogin = async () => {
    console.log('🔐 Tentativa de login biométrico');
    console.log('📱 Biometria suportada:', biometricSupported);
    console.log('✅ Biometria habilitada:', biometricEnabled);
    console.log('👤 User do AuthContext:', user?.biometricEnabled);
    
    if (!biometricSupported) {
      Alert.alert('Biometria não suportada', 'Este dispositivo não possui suporte à biometria.');
      return;
    }
    
    if (!biometricEnabled && !user?.biometricEnabled) {
      Alert.alert('Biometria não configurada', 'Configure a biometria nas configurações do app primeiro.');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Use sua biometria para fazer login',
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        console.log('✅ Autenticação biométrica bem-sucedida');
        const savedEmail = await SecureStore.getItemAsync('registered_email');
        const savedPassword = await SecureStore.getItemAsync('saved_password');
        
        if (savedEmail && savedPassword) {
          console.log('📧 Usando credenciais salvas:', savedEmail);
          await loginWithEmail(savedEmail, savedPassword);
        } else {
          console.log('❌ Credenciais não encontradas no SecureStore');
          Alert.alert('Erro', 'Credenciais não encontradas. Faça login manualmente primeiro.');
        }
      } else {
        console.log('❌ Autenticação biométrica falhou');
      }
    } catch (error) {
      console.error('❌ Erro na autenticação biométrica:', error);
      Alert.alert('Erro', 'Falha na autenticação biométrica.');
    } finally {
      setIsLoading(false);
    }
  };

  const anyLoading = isLoading || googleLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/icon.png')} style={styles.logo} />
            </View>

            <Text style={styles.welcomeText}>Bem-vindo ao GlucoCare</Text>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={anyLoading}>
              {googleLoading ? (
                <ActivityIndicator size="small" color="#374151" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <AntDesign name="google" size={20} color="#DB4437" style={styles.googleIconInline} />
                  <Text style={styles.googleButtonText}>Entrar com Google</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OU</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!anyLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!anyLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={22}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, anyLoading && styles.buttonDisabled]}
              onPress={handleEmailLogin}
              disabled={anyLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* O botão de biometria só aparece se o hardware for compatível E o usuário já tiver ativado o recurso */}
            {biometricSupported && biometricEnabled && (
              <TouchableOpacity
                style={[styles.biometricButton, anyLoading && styles.buttonDisabled]}
                onPress={handleBiometricLogin}
                disabled={anyLoading}
              >
                <MaterialIcons name="fingerprint" size={24} color="#374151" />
                <Text style={styles.biometricButtonText}>Entrar com biometria</Text>
              </TouchableOpacity>
            )}

            <View style={styles.footerLinksContainer}>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.linkText}>Esqueceu sua senha?</Text>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  welcomeText: {
    fontSize: 24, // Reduzido para garantir uma única linha
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 20,
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleIconInline: {
    marginRight: 8,
  },
  googleIconAbsolute: {
    position: 'absolute',
    left: 16,
    alignSelf: 'center',
    // vector icon, no width/height needed
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
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
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 14,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
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
    paddingVertical: 14,
    width: '100%',
    marginBottom: 16,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerLinksContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8, 
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  registerLink: {
    paddingVertical: 8,
  },
  registerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  registerTextBold: {
    fontWeight: '700',
    color: '#2563eb',
  },
});

