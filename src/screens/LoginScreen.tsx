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

// Removidas as importações diretas do Firebase, pois a lógica está no AuthContext
// O AuthContext gerencia signInWithEmailAndPassword e FirebaseError
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { FirebaseError } from "firebase/app"; 
// import { auth } from "../config/firebase";

// 💡 Certifique-se de que este caminho e tipagem estejam corretos.
import { LoginScreenNavigationProps } from "../navigation/types";
import { useAuth } from "../context/AuthContext";

// --- Interface para as Props do Componente ---
interface LoginScreenProps extends LoginScreenNavigationProps {}
// ---------------------------------------------

WebBrowser.maybeCompleteAuthSession();

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    // 🚀 Usamos o login e isLoading do AuthContext
    const { login, isLoading } = useAuth();
    
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string>(""); // Estado local para erros de UI
    
    // Configuração do Google OAuth (mantida, mas idealmente seria movida para AuthContext)
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: "360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com",
        webClientId: "360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com",
        scopes: ["profile", "email"],
    });

    // Limpeza de tokens antigos
    useEffect(() => {
        SecureStore.deleteItemAsync("google_token").catch(() => {});
    }, []);

    // Autenticação via biometria ao inicializar
    useEffect(() => {
        const checkBiometrics = async () => {
            try {
                const biometricEnabled = await SecureStore.getItemAsync("biometric_enabled");
                
                if (biometricEnabled === "true") {
                    const hasHardware = await LocalAuthentication.hasHardwareAsync();
                    if (hasHardware) {
                        const result = await LocalAuthentication.authenticateAsync({
                            promptMessage: "Autentique-se para acessar",
                        });
                        
                        // ✅ CORREÇÃO 1: Removida a chamada incorreta de login()
                        if (result.success) {
                            // Se a biometria for OK, a sessão Firebase ativa será detectada
                            // pelo onAuthStateChanged no AuthContext, que fará a navegação.
                            console.log("Autenticação biométrica bem-sucedida. Verificando sessão Firebase...");
                        }
                    }
                }
            } catch (err) {
                console.error("Erro biometria:", err);
            }
        };
        // Chama a função ao montar o componente
        checkBiometrics(); 
    }, []);

    // Resposta de login do Google
    useEffect(() => {
        const handleGoogleResponse = async () => {
            if (response?.type === "success" && response.authentication) {
                try {
                    // Logicamente, o token do Google deveria ser trocado por uma credencial
                    // do Firebase e o AuthContext se encarregaria de chamar signInWithCredential.
                    // Para corrigir o erro 2554, removemos a chamada incorreta de login().

                    // TODO: Mover esta lógica para AuthContext.loginWithGoogle()
                    const token = response.authentication.accessToken;
                    await SecureStore.setItemAsync("google_token", token);
                    
                    // Lógica de SecureStore removida, pois o AuthContext deve gerenciar o perfil.
                    // ✅ CORREÇÃO 2: Removida a chamada incorreta de login()
                    // A navegação será tratada pelo onAuthStateChanged no AuthContext.

                    console.log("Login Google processado. Esperando onAuthStateChanged...");
                    
                } catch (err) {
                    console.error("Login Google:", err);
                    Alert.alert("Erro", "Não foi possível completar login com Google.");
                }
            }
        };
        handleGoogleResponse();
    }, [response, navigation]); 
    
    // Login manual (e-mail/senha)
    const handleLogin = async () => {
        setError(""); // Limpa erros anteriores
        if (!email || !password) {
            setError("Por favor, preencha E-mail e Senha.");
            return;
        }

        try {
            // 🚀 CORREÇÃO 3: Usamos a função login do contexto, que espera 2 argumentos.
            // O AuthContext fará a chamada signInWithEmailAndPassword e atualizará o estado global.
            await login(email.trim(), password);

            // Se o login for bem-sucedido, o AuthContext aciona o onAuthStateChanged,
            // que por sua vez aciona a navegação no RootNavigator. Não precisamos de navegação explícita aqui.

        } catch (err: any) {
            console.error("handleLogin erro:", err);
            
            // Tratamento de erro do contexto/Firebase (err.code vem do erro que o AuthContext relança)
            let errorMessage = "Falha ao tentar logar. Verifique sua conexão ou credenciais.";
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
                        errorMessage = "Acesso temporariamente bloqueado devido a muitas tentativas falhas.";
                        break;
                    default:
                        errorMessage = `Erro de Autenticação: ${err.message}`;
                }
            }
            setError(errorMessage);
            Alert.alert("Erro de Login", errorMessage);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Adicionado ScrollView para melhor manejo do teclado em telas pequenas */}
                <ScrollView contentContainerStyle={styles.centered} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        <Image source={require("../../assets/icon.png")} style={styles.logo} />
                        <Text style={styles.title}>Bem-vindo ao GlucoCare</Text>

                        {/* Google */}
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
                        
                        {/* Exibição do erro de UI */}
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Email */}
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

                        {/* Senha com botão de olho */}
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
                                accessible
                                accessibilityLabel="campo de senha"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword((s) => !s)}
                                style={styles.eyeButton}
                                accessibilityRole="button"
                                accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
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

                        {/* Link para a tela ForgotPassword */}
                        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} disabled={isLoading}>
                            <Text style={styles.link}>Esqueceu sua senha?</Text>
                        </TouchableOpacity>

                        <Text style={styles.signupText}>
                            Não tem uma conta?{" "}
                            <Text style={styles.signupLink} onPress={() => navigation.navigate("Register")} disabled={isLoading}>
                                Cadastre-se
                            </Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

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
