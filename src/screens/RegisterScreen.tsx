import 'react-native-get-random-values';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    AppState,
    View,
} from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import { v4 as uuidv4 } from 'uuid';

WebBrowser.maybeCompleteAuthSession();

// --- Definição da Tipagem (Regras de Senha)
interface PasswordRules {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
}

// ------------------------------------
// 1. HOOK CUSTOMIZADO PARA VALIDAÇÃO DA SENHA
// ------------------------------------
const usePasswordValidation = (password: string) => {
    const rules: PasswordRules = useMemo(() => ({
        // No mínimo 8 dígitos
        length: password.length >= 8,
        // Pelo menos 1 letra maiúscula (A–Z)
        uppercase: /[A-Z]/.test(password),
        // Pelo menos 1 letra minúscula (a–z)
        lowercase: /[a-z]/.test(password),
        // Pelo menos 1 número (0–9)
        number: /\d/.test(password),
        // Pelo menos 1 caractere especial (ex.: ! @ # $ % ^ & *)
        specialChar: /[^A-Za-z0-9]/.test(password),
    }), [password]);

    // O validador principal que verifica se TODAS as regras são true
    const isPasswordValid = Object.values(rules).every(Boolean);
    
    return { rules, isPasswordValid };
};


// ------------------------------------
// 2. NOVO COMPONENTE PARA EXIBIR AS REGRAS (Vermelho/Verde)
// ------------------------------------
interface RequirementItemProps {
    met: boolean;
    label: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, label }) => {
    const color = met ? '#10b981' : '#ef4444'; // verde/vermelho
    const icon = met ? 'check' : 'x';

    return (
        <View style={validationStyles.itemContainer}>
            <Feather name={icon} size={14} color={color} style={{ marginRight: 6 }} />
            <Text style={[validationStyles.itemText, { color }]}>{label}</Text>
        </View>
    );
};

interface PasswordRequirementsProps {
    rules: PasswordRules;
}

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ rules }) => (
    <View style={validationStyles.container}>
        <Text style={validationStyles.title}>
            Certifique-se de que sua nova senha contém
        </Text>
        <RequirementItem met={rules.length} label="No mínimo 8 dígitos" />
        <RequirementItem met={rules.uppercase} label="Pelo menos 1 letra maiúscula (A–Z)" />
        <RequirementItem met={rules.lowercase} label="Pelo menos 1 letra minúscula (a–z)" />
        <RequirementItem met={rules.number} label="Pelo menos 1 número (0–9)" />
        <RequirementItem met={rules.specialChar} label="Pelo menos 1 caractere especial (ex.: !@#$%^&*)" />
    </View>
);

// ------------------------------------
// 3. RegisterScreen COMPLETO
// ------------------------------------

interface NavigationProp {
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
}

export default function RegisterScreen({ navigation }: { navigation: NavigationProp }) {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
    const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);

    const appState = useRef(AppState.currentState);
    const lastActiveTime = useRef<number>(Date.now());

    // Usando o hook para as regras de validação
    const { rules, isPasswordValid } = usePasswordValidation(password);

    // --- Google OAuth Config (mantido)
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId:
            '360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com',
        webClientId:
            '360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com',
        androidClientId:
            'SUA_ANDROID_CLIENT_ID_AQUI.apps.googleusercontent.com', // ⚠️ Atenção: Substitua este Client ID
        scopes: ['profile', 'email'],
    });

    // --- Handle Google Response (mantido)
    useEffect(() => {
        const handleGoogleAuth = async () => {
            if (response?.type === 'success' && response.authentication) {
                try {
                    const token = response.authentication.accessToken;
                    await SecureStore.setItemAsync('google_token', token);

                    const userInfoResponse = await fetch(
                        'https://www.googleapis.com/userinfo/v2/me',
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    const user = await userInfoResponse.json();

                    const profile = {
                        id: uuidv4(),
                        full_name: user.name || 'Usuário Google',
                        email: user.email,
                        provider: 'google',
                        createdAt: new Date().toISOString(),
                        birth_date: new Date(1990, 0, 1).toISOString(),
                        height: null,
                        weight: null,
                        restriction: '',
                    };

                    await SecureStore.setItemAsync('registered_email', user.email);
                    await SecureStore.setItemAsync('user_profile', JSON.stringify(profile));
                    await SecureStore.setItemAsync('biometric_enabled', 'false');

                    Alert.alert('Sucesso', 'Conta criada com Google!');
                    navigation.replace('ProfileSetup');
                } catch (err) {
                    console.error('Erro ao registrar com Google:', err);
                    Alert.alert('Erro', 'Não foi possível registrar com Google.');
                }
            } else if (response?.type === 'error') {
                Alert.alert('Erro', 'O login com Google falhou ou foi cancelado.');
                console.log('Resposta de erro do Google:', response);
            }
        };

        handleGoogleAuth();
    }, [response]);

    // --- Função para chamar o prompt do Google (mantido)
    const handleGoogleSignIn = async () => {
        try {
            await promptAsync();
        } catch (error) {
            console.error('Erro ao iniciar o prompt do Google:', error);
            Alert.alert('Erro', 'Não foi possível iniciar o login com Google.');
        }
    };

    // --- Validadores (Simplificado, pois a validação real agora está no usePasswordValidation)
    const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

    // --- Registro Manual
    const handleRegister = async () => {
        try {
            setEmailError('');
            setPasswordError('');
            setConfirmPasswordError('');

            if (!email || !password || !confirmPassword) {
                return Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
            }
            if (!validateEmail(email)) {
                setEmailError('Digite um e-mail válido.');
                return;
            }
            // A validação de complexidade agora usa o isPasswordValid
            if (!isPasswordValid) {
                setPasswordError('Sua senha não atende a todos os requisitos de segurança.');
                return;
            }
            if (password !== confirmPassword) {
                setConfirmPasswordError('As senhas não coincidem.');
                return;
            }

            const passwordHash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                password
            );

            const profile = {
                id: uuidv4(),
                full_name: 'Usuário GlucoCare',
                email: email.trim(),
                provider: 'manual',
                createdAt: new Date().toISOString(),
                birth_date: new Date(1990, 0, 1).toISOString(),
                height: null,
                weight: null,
                restriction: '',
            };

            await SecureStore.setItemAsync('registered_email', email.trim());
            await SecureStore.setItemAsync('registered_password', passwordHash);
            await SecureStore.setItemAsync('user_profile', JSON.stringify(profile));

            try {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const supported =
                    await LocalAuthentication.supportedAuthenticationTypesAsync();
                await SecureStore.setItemAsync(
                    'biometric_enabled',
                    hasHardware && supported.length > 0 ? 'true' : 'false'
                );
            } catch {
                await SecureStore.setItemAsync('biometric_enabled', 'false');
            }

            Alert.alert('Sucesso', 'Conta criada com sucesso!');
            navigation.replace('ProfileSetup');
        } catch (err) {
            console.error('handleRegister - erro:', err);
            Alert.alert('Erro', 'Não foi possível registrar sua conta.');
        }
    };

    // --- Sessão expira após 5 min (mantido)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (appState.current === 'active' && nextState === 'background') {
                lastActiveTime.current = Date.now();
            }

            if (
                appState.current.match(/background|inactive/) &&
                nextState === 'active'
            ) {
                const inactiveTime = Date.now() - lastActiveTime.current;
                if (inactiveTime > 5 * 60 * 1000) {
                    Alert.alert('Sessão expirada', 'Faça login novamente.');
                    navigation.replace('Login');
                }
            }

            appState.current = nextState;
        });

        return () => subscription.remove();
    }, []);

    // --- Desabilitar botão de registro até que todos os campos sejam válidos
    useEffect(() => {
        const isFormValid =
            validateEmail(email) &&
            isPasswordValid && // Usando o novo validador
            password === confirmPassword;
        setIsButtonDisabled(!isFormValid);
    }, [email, password, confirmPassword, isPasswordValid]);


    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <AntDesign
                        name="adduser"
                        size={64}
                        color="#2563eb"
                        style={{ alignSelf: 'center', marginBottom: 20 }}
                    />

                    <Text style={styles.title}>Criar Conta</Text>
                    <Text style={styles.subtitle}>
                        Preencha os dados ou use sua conta Google
                    </Text>

                    {/* Botão Google (mantido) */}
                    <TouchableOpacity
                        style={[styles.googleButton, !request && { opacity: 0.5 }]}
                        disabled={!request}
                        onPress={handleGoogleSignIn}
                    >
                        <AntDesign
                            name="google"
                            size={20}
                            color="#DB4437"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.googleText}>Cadastrar com Google</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>ou</Text>

                    {/* Inputs */}
                    <TextInput
                        style={[styles.input, emailError ? styles.inputError : null]}
                        placeholder="E-mail"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                    {/* --- CAMPO SENHA --- */}
                    <Text style={[styles.title, { fontSize: 16, marginBottom: 8, textAlign: 'left' }]}>
                        Crie sua senha
                    </Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, { marginBottom: 0, paddingRight: 50 }]}
                            placeholder="Senha"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Feather
                                name={showPassword ? 'eye' : 'eye-off'}
                                size={24}
                                color="#6b7280"
                            />
                        </TouchableOpacity>
                    </View>
                    
                    {/* --- NOVO COMPONENTE DE REQUISITOS DE SENHA --- */}
                    <PasswordRequirements rules={rules} />
                    {/* --- FIM DO NOVO COMPONENTE --- */}
                    
                    {passwordError ? (
                        <Text style={styles.errorText}>{passwordError}</Text>
                    ) : null}

                    {/* --- CAMPO CONFIRMAR SENHA --- */}
                    <Text style={[styles.title, { fontSize: 16, marginBottom: 8, marginTop: 16, textAlign: 'left' }]}>
                        Confirme sua senha
                    </Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, confirmPasswordError ? styles.inputError : null, { paddingRight: 50 }]}
                            placeholder="Confirmar Senha"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Feather
                                name={showConfirmPassword ? 'eye' : 'eye-off'}
                                size={24}
                                color="#6b7280"
                            />
                        </TouchableOpacity>
                    </View>
                    {confirmPasswordError ? (
                        <Text style={styles.errorText}>{confirmPasswordError}</Text>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.buttonPrimary, isButtonDisabled && { opacity: 0.5 }]}
                        onPress={handleRegister}
                        disabled={isButtonDisabled}
                    >
                        <Text style={styles.buttonText}>Registrar</Text>
                    </TouchableOpacity>

                    <Text style={styles.loginText}>
                        Já tem uma conta?{' '}
                        <Text
                            style={styles.loginLink}
                            onPress={() => navigation.navigate('Login')}
                        >
                            Entrar
                        </Text>
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Estilos do RegisterScreen (mantidos e ajustados)
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f6ff' },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 20,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 10,
        justifyContent: 'center',
        marginBottom: 16,
    },
    googleText: { fontSize: 16, fontWeight: '600', color: '#111' },
    orText: { textAlign: 'center', color: '#6b7280', marginVertical: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 14,
        backgroundColor: '#fff',
        fontSize: 15,
        marginBottom: 8,
        color: '#111827',
        width: '100%',
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 8,
    },
    buttonPrimary: {
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    loginText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 14,
        color: '#4b5563',
    },
    loginLink: { color: '#2563eb', fontWeight: '600' },
    passwordContainer: {
        // Estilos para o container de senha, se necessário, para alinhar o ícone
        width: '100%',
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: 10, // Ajusta a posição vertical dentro do input
        zIndex: 1,
    },
});

// --- Estilos Específicos para as Regras de Validação
const validationStyles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 16,
        paddingHorizontal: 5,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 8,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    itemText: {
        fontSize: 13,
        fontWeight: '500',
    },
});