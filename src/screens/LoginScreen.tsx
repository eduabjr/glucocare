import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { AntDesign, Feather } from "@expo/vector-icons";
import { Buffer } from "buffer"; 

// Tipos e hook do AuthContext e Navegação
import { useAuth } from "../context/AuthContext";
// @ts-ignore
import { LoginScreenNavigationProps } from "../navigation/types";


WebBrowser.maybeCompleteAuthSession();

// --- Componente LoginScreen ---
const LoginScreen: React.FC<LoginScreenNavigationProps> = ({ navigation }) => {
    // Funções do AuthContext do Firebase
    const { loginWithEmail, signInWithGoogle, isLoading } = useAuth();
    
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    // Hook do Google para obter o id_token para o Firebase
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        // ✨ CORREÇÃO CRÍTICA: Alterado de 'expoClientId' para 'androidClientId'
        // Isto é necessário para builds de desenvolvimento/produção com package name customizado.
        androidClientId: "501715449083-e1c6icrrlcm0jlm66dcmr6lqgguuspp.apps.googleusercontent.com",
        webClientId: "501715449083-9q4h8f6p3g2cda11kch1mhfstrfc8fld.apps.googleusercontent.com",
        // Se você tiver uma versão iOS, adicione o 'iosClientId' aqui também
    });

    // --- Efeitos ---

    // Lógica de biometria
    useEffect(() => {
        const checkBiometrics = async () => {
            try {
                const biometricEnabled = await SecureStore.getItemAsync("biometric_enabled");
                if (biometricEnabled === "true") {
                    const hasHardware = await LocalAuthentication.hasHardwareAsync();
                    if (hasHardware) {
                        await LocalAuthentication.authenticateAsync({
                            promptMessage: "Autentique-se para acessar",
                        });
                    }
                }
            } catch (err) {
                console.error("Erro biometria:", err);
            }
        };
        checkBiometrics(); 
    }, []);

    // Resposta do login com Google
    useEffect(() => {
        const handleGoogleResponse = async () => {
            if (response?.type === 'success') {
                const { id_token } = response.params;
                if (id_token) {
                    try {
                        await signInWithGoogle(id_token);
                    } catch (err) {
                        setError("Falha no login com Google. Tente novamente.");
                        Alert.alert("Erro", "Não foi possível completar o login com Google.");
                    }
                }
            } else if (response?.type === 'error') {
                setError("Ocorreu um erro durante a autenticação com o Google.");
            }
        };
        handleGoogleResponse();
    }, [response]); 
    
    // --- Funções de Handler ---

    // Login com e-mail/senha
    const handleLogin = async () => {
        setError("");
        if (!email || !password) {
            setError("Por favor, preencha E-mail e Senha.");
            return;
        }

        try {
            await loginWithEmail(email.trim(), password);
        } catch (err: any) {
            console.error("handleLogin erro:", err);
            let errorMessage = "Falha ao tentar logar.";
            if (err.code) {
                switch (err.code) {
                    case 'auth/invalid-credential':
                    case 'auth/wrong-password':
                    case 'auth/user-not-found':
                        errorMessage = "Credenciais inválidas. Verifique seu e-mail e senha.";
                        break;
                    case 'auth/invalid-email':
                        errorMessage = "O formato do e-mail é inválido.";
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = "Acesso bloqueado devido a muitas tentativas falhas.";
                        break;
                    default:
                        errorMessage = `Erro de Autenticação: ${err.message}`;
                }
            }
            setError(errorMessage);
        }
    };

    // --- Renderização ---
    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView contentContainerStyle={styles.centered} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        {/* @ts-ignore */}
                        <Image source={require("../../assets/icon.png")} style={styles.logo} />
                        <Text style={styles.title}>Bem-vindo ao GlucoCare</Text>

                        {/* Botão Google */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            disabled={!request || isLoading}
                            onPress={() => promptAsync()} 
                        >
                            <AntDesign name="google" size={20} color="#DB4437" style={{ marginRight: 8 }} />
                            <Text style={styles.googleText}>Entrar com Google</Text>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.orText}>OU</Text>
                            <View style={styles.line} />
                        </View>
                        
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Inputs e Botões */}
                        <View style={styles.inputWrapper}>
                            <Feather name="mail" size={18} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="E-mail"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Feather name="lock" size={18} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { paddingRight: 44 }]}
                                placeholder="Senha"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword((s) => !s)}
                                style={styles.eyeButton}
                                disabled={isLoading}
                            >
                                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.primaryText}>Entrar</Text>
                            )}
                        </TouchableOpacity>

                        {/* Links de Navegação */}
                        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} disabled={isLoading}>
                            <Text style={styles.link}>Esqueceu sua senha?</Text>
                        </TouchableOpacity>

                        <Text style={styles.signupText}>
                            Não tem uma conta?
                            <Text style={styles.signupLink} onPress={() => navigation.navigate("Register")} disabled={isLoading}>
                                {' '}Cadastre-se
                            </Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// --- Estilos ---
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f0f6ff" },
    centered: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 16 },
    card: {
        width: "100%",
        maxWidth: 380,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    logo: { width: 72, height: 72, borderRadius: 36, alignSelf: "center", marginBottom: 16 },
    title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20, color: "#111827" },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        paddingVertical: 12,
        justifyContent: "center",
        marginBottom: 16,
    },
    googleText: { fontSize: 15, fontWeight: "600", color: "#111" },
    divider: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
    line: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
    orText: { marginHorizontal: 8, color: "#6b7280" },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 12,
        backgroundColor: "#fff",
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 10, fontSize: 15, color: "#111827" },
    eyeButton: {
        marginLeft: 8,
        padding: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    primaryButton: {
        backgroundColor: "#2563eb",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
    },
    primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    link: { textAlign: "center", marginTop: 14, fontSize: 14, color: "#4b5563" },
    signupText: { textAlign: "center", marginTop: 8, fontSize: 14, color: "#4b5563" },
    signupLink: { color: "#2563eb", fontWeight: "600" },
    errorText: { textAlign: "center", color: '#ef4444', marginBottom: 10, fontWeight: '600' }
});

export default LoginScreen;

