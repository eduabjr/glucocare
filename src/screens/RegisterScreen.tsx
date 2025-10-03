// src/screens/RegisterScreen.tsx
import 'react-native-get-random-values';
import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    View,
} from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
// Google Auth via hook compartilhado (no-proxy + id_token)
import { useGoogleAuth } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

// 🚨 IMPORTAÇÕES FIREBASE ATUALIZADAS
import { auth, db } from '../config/firebase'; 
import {
    createUserWithEmailAndPassword,
    // NOVO: Função para enviar o e-mail de verificação
    sendEmailVerification,
    User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 

// Fluxo de auth do Google é tratado no hook compartilhado

// --- Definição da Tipagem 
interface PasswordRules {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
}

interface NavigationProp {
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
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
        specialChar: /[^A-Za-z0-9\s]/.test(password),
    }), [password]);

    // O validador principal que verifica se TODAS as regras são true
    const isPasswordValid = Object.values(rules).every(Boolean);

    return { rules, isPasswordValid };
};

// ------------------------------------
// 2. COMPONENTE PARA EXIBIR AS REGRAS
// ------------------------------------
interface RequirementItemProps {
    met: boolean;
    label: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, label }) => {
    const { theme } = useContext(ThemeContext);
    const validationStyles = getValidationStyles(theme);
    const color = met ? theme.accent : theme.error;
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

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ rules }) => {
    const { theme } = useContext(ThemeContext);
    const validationStyles = getValidationStyles(theme);
    return (
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
};

// ------------------------------------
// FUNÇÃO DE SINCRONIZAÇÃO DE PERFIL NO FIRESTORE
// ------------------------------------

/**
 * Salva ou atualiza os dados básicos do usuário no Cloud Firestore.
 * @param uid O User ID do Firebase (o ID único gerado).
 * @param profile O objeto de perfil local.
 */
async function syncUserProfileToFirestore(uid: string, profile: any) {
    try {
        // Define o documento na coleção 'users' usando o UID do Firebase como ID do documento
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            ...profile,
            uid: uid, // Adiciona o UID real do Firebase
            updatedAt: new Date().toISOString(),
        }, { merge: true }); // Usamos merge: true para não sobrescrever dados existentes 
        console.log(`Perfil do usuário ${uid} sincronizado com sucesso no Firestore.`);
    } catch (error) {
        console.error("Erro ao sincronizar perfil do usuário no Firestore:", error);
        throw new Error('Falha ao salvar o perfil na nuvem.');
    }
}

// ------------------------------------
// NOVO: FUNÇÃO PARA ENVIAR VERIFICAÇÃO DE EMAIL
// ------------------------------------
async function sendVerificationEmail(user: User) {
    if (user && !user.emailVerified) {
        try {
            await sendEmailVerification(user);
            console.log("E-mail de verificação enviado com sucesso.");
            // Removido o Alert aqui para evitar duplicação
        } catch (error) {
            console.error('Erro ao enviar e-mail de verificação:', error);
            Alert.alert('Erro', 'Não foi possível enviar o e-mail de verificação agora. Tente novamente mais tarde.');
        }
    }
}


// ------------------------------------
// 3. RegisterScreen COMPLETO
// ------------------------------------

export default function RegisterScreen({ navigation }: { navigation: NavigationProp }) {
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);
    const validationStyles = getValidationStyles(theme);

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
    const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false); 

    // Google Auth hook (compartilhado com LoginScreen)
    const { promptAsync: promptGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();
    
    // Auth context para atualizar o usuário após registro
    const { setUser } = useAuth();

    // Usando o hook para as regras de validação
    const { rules, isPasswordValid } = usePasswordValidation(password);

    // Exibe erro do Google, se houver
    useEffect(() => {
        if (googleError) {
            Alert.alert('Erro', googleError.message || 'Não foi possível iniciar o login com Google.');
        }
    }, [googleError]);

    // --- Função para chamar o prompt do Google (hook compartilhado)
    const handleGoogleSignIn = async () => {
        try {
            await promptGoogle();
        } catch (error) {
            console.error('Erro ao iniciar o prompt do Google:', error);
            Alert.alert('Erro', 'Não foi possível iniciar o login com Google.');
        }
    };

    // --- Validadores
    const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

    // --- Registro Manual (USA FIREBASE AUTH E FIRESTORE)
    const handleRegister = async () => {
        try {
            // Limpa erros anteriores
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
            // Validação de complexidade
            if (!isPasswordValid) {
                setPasswordError('Sua senha não atende a todos os requisitos de segurança.');
                return;
            }
            if (password !== confirmPassword) {
                setConfirmPasswordError('As senhas não coincidem.');
                return;
            }
            
            setIsLoading(true);

            // 1. CRIAÇÃO DE CONTA NO FIREBASE AUTH
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );
            const user = userCredential.user;

            // NOVO: 2. DISPARA O E-MAIL DE VERIFICAÇÃO
            await sendVerificationEmail(user);

            // 3. Criação do Perfil Básico (compatível com UserProfile)
            const profile = {
                id: user.uid,
                name: 'Usuário GlucoCare',
                email: email.trim(),
                googleId: '',
                onboardingCompleted: false,
                biometricEnabled: false,
                weight: null,
                height: null,
                birthDate: new Date(1990, 0, 1).toISOString(),
                condition: '',
                restriction: '',
                syncedAt: new Date().toISOString(),
                emailVerified: user.emailVerified,
            };

            // 4. Sincroniza o perfil com o Firestore
            await syncUserProfileToFirestore(user.uid, profile);

            // 5. Armazenamento Seguro (Apenas dados de login e perfil)
            await SecureStore.setItemAsync('registered_email', email.trim());
            await SecureStore.setItemAsync('user_profile', JSON.stringify(profile));

            // 6. Checagem e Habilitação (ou Desabilitação) da Biometria 
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

            // ✅ CORREÇÃO: Atualiza o contexto de autenticação
            setUser(profile);

            Alert.alert(
                'Sucesso', 
                'Conta criada com sucesso! Verifique seu e-mail para validar sua conta.'
            );
            // O usuário navega para a configuração de perfil, mesmo sem confirmar o e-mail, conforme solicitado.
            navigation.replace('ProfileSetup'); 
        } catch (err: any) {
            console.error('handleRegister - erro:', err);
            // Melhora a exibição de erros comuns do Firebase
            let errorMessage = 'Não foi possível registrar sua conta.';
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está sendo usado.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'A senha é muito fraca. Siga os requisitos.';
            }
            Alert.alert('Erro', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Desabilitar botão de registro
    useEffect(() => {
        const isFormValid =
            validateEmail(email) &&
            isPasswordValid &&
            password === confirmPassword &&
            !isLoading; // Desabilita durante o carregamento
        setIsButtonDisabled(!isFormValid);
    }, [email, password, confirmPassword, isPasswordValid, isLoading]);


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
                        size={52}
                        color={theme.primary}
                        style={{ alignSelf: 'center', marginBottom: 12 }}
                    />

                    <Text style={styles.title}>Criar Conta</Text>
                    <Text style={styles.subtitle}>
                        Preencha os dados ou use sua conta Google
                    </Text>

                    {/* Botão Google */}
                    <TouchableOpacity
                        style={[styles.googleButton, (googleLoading || isLoading) && { opacity: 0.5 }]}
                        disabled={googleLoading || isLoading}
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
                    
                    {/* Email com ícone */}
                    <View style={styles.inputRow}>
                        <MaterialIcons name="email" size={20} color={theme.secundaryText} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.inputFlex, emailError ? styles.inputError : null]}
                            placeholder="E-mail"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            onBlur={() => setEmailError(validateEmail(email) ? '' : 'Digite um e-mail válido.')}
                            placeholderTextColor={theme.secundaryText}
                        />
                    </View>
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                    {/* --- CAMPO SENHA --- */}
                    <Text style={[styles.title, { fontSize: 16, marginBottom: 8, textAlign: 'left' }]}>
                        Crie sua senha
                    </Text>
                    <View style={styles.passwordContainer}>
                        <MaterialIcons name="lock" size={20} color={theme.secundaryText} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.inputFlex, { marginBottom: 0, paddingRight: 50 }]}
                            placeholder="Senha"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor={theme.secundaryText}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Feather
                                name={showPassword ? 'eye' : 'eye-off'}
                                size={24}
                                color={theme.secundaryText}
                            />
                        </TouchableOpacity>
                    </View>
                    
                    {/* --- COMPONENTE DE REQUISITOS DE SENHA --- */}
                    <PasswordRequirements rules={rules} />
                    {passwordError && !isPasswordValid ? (
                        <Text style={styles.errorText}>{passwordError}</Text>
                    ) : null}

                    {/* --- CAMPO CONFIRMAR SENHA --- */}
                    <Text style={[styles.title, { fontSize: 16, marginBottom: 8, marginTop: 16, textAlign: 'left' }]}>
                        Confirme sua senha
                    </Text>
                    <View style={styles.passwordContainer}>
                        <MaterialIcons name="lock" size={20} color={theme.secundaryText} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.inputFlex, confirmPasswordError ? styles.inputError : null, { paddingRight: 50 }]}
                            placeholder="Confirmar Senha"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            onBlur={() => setConfirmPasswordError(password === confirmPassword ? '' : 'As senhas não coincidem.')}
                            placeholderTextColor={theme.secundaryText}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Feather
                                name={showConfirmPassword ? 'eye' : 'eye-off'}
                                size={24}
                                color={theme.secundaryText}
                            />
                        </TouchableOpacity>
                    </View>
                    {confirmPasswordError ? (
                        <Text style={styles.errorText}>{confirmPasswordError}</Text>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.buttonPrimary, isButtonDisabled && { opacity: 0.5 }]}
                        onPress={handleRegister}
                        disabled={isButtonDisabled || isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Aguarde...' : 'Registrar'}
                        </Text>
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

const getStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    container: { flexGrow: 1, justifyContent: 'center', padding: 16 },
    title: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        color: theme.text,
    },
    subtitle: {
        fontSize: 13,
        textAlign: 'center',
        color: theme.secundaryText,
        marginBottom: 12,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.secundaryText,
        backgroundColor: theme.card,
        paddingVertical: 10,
        borderRadius: 10,
        justifyContent: 'center',
        marginBottom: 10,
    },
    googleText: { fontSize: 15, fontWeight: '600', color: theme.text },
    orText: { textAlign: 'center', color: theme.secundaryText, marginVertical: 8 },
    input: {
        borderWidth: 1,
        borderColor: theme.secundaryText,
        borderRadius: 10,
        padding: 12,
        backgroundColor: theme.card,
        fontSize: 15,
        marginBottom: 6,
        color: theme.text,
        width: '100%',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.secundaryText,
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: theme.card,
        marginBottom: 6,
    },
    inputFlex: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: theme.text,
    },
    inputIcon: {
        marginRight: 8,
    },
    inputError: {
        borderColor: theme.error,
    },
    errorText: {
        color: theme.error,
        fontSize: 12,
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    buttonPrimary: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: theme.primary,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    loginText: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 14,
        color: theme.secundaryText,
    },
    loginLink: { color: theme.primary, fontWeight: '600' },
    passwordContainer: {
        position: 'relative',
        marginBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.secundaryText,
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: theme.card,
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: 15,
        padding: 5,
        zIndex: 1,
    },
});

const getValidationStyles = (theme: any) => StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 16,
        paddingHorizontal: 5,
        backgroundColor: theme.card,
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: theme.background,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text,
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
