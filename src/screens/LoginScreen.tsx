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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { AntDesign, Feather } from "@expo/vector-icons";

// signInWithEmailAndPassword vem de auth, FirebaseError vem de app.
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app"; 
import { auth } from "../config/firebase";

// 💡 Certifique-se de que este caminho e tipagem estejam corretos.
import { LoginScreenNavigationProps } from "../navigation/types";
import { useAuth } from "../context/AuthContext";

// --- Interface para as Props do Componente ---
interface LoginScreenProps extends LoginScreenNavigationProps {}
// ---------------------------------------------

WebBrowser.maybeCompleteAuthSession();

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Configuração do Google OAuth
    // (O erro 2554 na chamada de promptAsync() provavelmente é causado pela sua versão do Expo, 
    // mas não podemos corrigi-lo sem saber a assinatura exata do método em seu ambiente.)
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
        (async () => {
            try {
                const biometricEnabled = await SecureStore.getItemAsync("biometric_enabled");
                const storedEmail = await SecureStore.getItemAsync("registered_email");
                const profile = await SecureStore.getItemAsync("user_profile");

                if (biometricEnabled === "true" && storedEmail && profile) {
                    const hasHardware = await LocalAuthentication.hasHardwareAsync();
                    if (hasHardware) {
                        const result = await LocalAuthentication.authenticateAsync({
                            promptMessage: "Autentique-se para acessar",
                        });
                        if (result.success) {
                            // ✅ Se biometria OK, chama a função login do contexto
                            login();
                        }
                    }
                }
            } catch (err) {
                console.error("Erro biometria:", err);
            }
        })();
    }, [login]);

    // Resposta de login do Google
    useEffect(() => {
        (async () => {
            if (response?.type === "success" && response.authentication) {
                try {
                    const token = response.authentication.accessToken;
                    await SecureStore.setItemAsync("google_token", token);

                    const userInfoResponse = await fetch("https://www.googleapis.com/userinfo/v2/me", {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (!userInfoResponse.ok) throw new Error("Erro ao buscar dados");

                    const user = await userInfoResponse.json();
                    await SecureStore.setItemAsync("registered_email", user.email);

                    let profile = await SecureStore.getItemAsync("user_profile");
                    if (!profile) {
                        // 1. Se o perfil não existe: Cria o perfil temporário
                        profile = JSON.stringify({
                            name: user.name || "Usuário Google",
                            email: user.email,
                            provider: "google",
                            createdAt: new Date().toISOString(),
                        });
                        await SecureStore.setItemAsync("user_profile", profile);

                        // 2. Navega para ProfileSetup dentro do fluxo Auth
                        // 🚀 CORRIGIDO: Passando objeto vazio de parâmetros e removendo 'as never'.
                        navigation.replace("ProfileSetup" as any, {}); 
                        return;
                    }

                    // 3. Se o perfil existe: Chama login do contexto para mudar o fluxo para AppRoutes
                    login();
                } catch (err) {
                    console.error("Login Google:", err);
                    Alert.alert("Erro", "Não foi possível completar login com Google.");
                }
            }
        })();
    }, [response, navigation, login]);

    // Login manual (e-mail/senha) com Firebase
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Erro", "Por favor, preencha E-mail e Senha.");
            return;
        }

        setIsLoading(true);

        try {
            // 🚀 Chamada de Login do Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);

            // 1. Salvar o email autenticado para uso futuro (ex: biometria)
            await SecureStore.setItemAsync("registered_email", userCredential.user.email || "");

            // 2. Verifica se o perfil existe no SecureStore (lógica mantida para o fluxo ProfileSetup)
            let profile = await SecureStore.getItemAsync("user_profile");

            if (!profile) {
                // Cria o perfil temporário (se for o primeiro login após o registro)
                profile = JSON.stringify({
                    name: userCredential.user.displayName || "Usuário GlucoCare",
                    email: userCredential.user.email,
                    provider: "firebase",
                    createdAt: new Date().toISOString(),
                });
                await SecureStore.setItemAsync("user_profile", profile);

                // Navega para ProfileSetup dentro do fluxo Auth
                // 🚀 CORRIGIDO: Passando objeto vazio de parâmetros e removendo 'as never'.
                navigation.replace("ProfileSetup" as any, {}); 
                return;
            }

            // 3. Se o perfil existe: Chama login do contexto para mudar o fluxo para AppRoutes
            login();

        } catch (err) {
            console.error("handleLogin erro:", err);

            if (err instanceof FirebaseError) {
                let errorMessage = "Erro desconhecido.";
                switch (err.code) {
                    case 'auth/invalid-credential':
                    case 'auth/wrong-password':
                    case 'auth/user-not-found':
                        errorMessage = "Credenciais inválidas. Verifique seu e-mail e senha.";
                        break;
                    case 'auth/invalid-email':
                        errorMessage = "O formato do e-mail é inválido.";
                        break;
                    default:
                        errorMessage = `Erro de Autenticação: ${err.message}`;
                }
                Alert.alert("Erro de Login", errorMessage);
            } else {
                Alert.alert("Erro", "Falha ao tentar logar. Verifique sua conexão.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.centered}>
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
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f0f6ff" },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
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
});

export default LoginScreen;
