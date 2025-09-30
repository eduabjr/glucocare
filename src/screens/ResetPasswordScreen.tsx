import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/RootNavigator"; 
import { confirmPasswordReset } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../config/firebase";

// Tipagem para a tela de redefinição de senha
type ResetPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ route, navigation }) => {
    const { oobCode } = route.params;

    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Efeito para verificar se o código está presente
    useEffect(() => {
        if (!oobCode) {
            setError("Código de redefinição inválido ou ausente. Tente novamente.");
        }
    }, [oobCode]);

    const handleSubmit = async () => {
        if (error) {
            Alert.alert("Erro", error);
            return;
        }

        if (!newPassword || newPassword !== confirmPassword) {
            Alert.alert("Erro", "As senhas não coincidem ou estão vazias.");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (!oobCode) {
            Alert.alert("Erro", "Código de redefinição não encontrado.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Redefinir a senha usando o código de redefinição
            await confirmPasswordReset(auth, oobCode, newPassword);

            Alert.alert(
                "Sucesso!",
                "Sua senha foi redefinida com sucesso. Faça login com sua nova senha."
            );
            
            // Navega para a tela de login após sucesso
            navigation.navigate("Login");

        } catch (err) {
            console.error("Erro ao redefinir a senha:", err);
            let errorMessage = "Ocorreu um erro desconhecido ao redefinir a senha.";

            if (err instanceof FirebaseError) {
                switch (err.code) {
                    case 'auth/invalid-action-code':
                        errorMessage = "O código de redefinição expirou ou é inválido. Tente enviar um novo e-mail.";
                        break;
                    case 'auth/user-disabled':
                        errorMessage = "Esta conta foi desabilitada.";
                        break;
                    case 'auth/weak-password':
                        errorMessage = "A nova senha é muito fraca. Escolha uma mais segura.";
                        break;
                    default:
                        errorMessage = `Erro de Auth (${err.code}): ${err.message}`;
                }
            }
            setError(errorMessage);
            Alert.alert("Falha na Redefinição", errorMessage);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.centered}>
                <View style={styles.card}>
                    <Text style={styles.title}>Definir Nova Senha</Text>

                    {error && error !== "Código de redefinição inválido ou ausente. Tente novamente." && (
                         <Text style={styles.errorText}>{error}</Text>
                    )}

                    {oobCode && !error ? (
                        <>
                            <Text style={styles.subtitle}>Digite sua nova senha. Ela deve ter pelo menos 6 caracteres.</Text>

                            {/* Campo Nova Senha */}
                            <View style={styles.inputWrapper}>
                                <Feather name="lock" size={18} color="#9ca3af" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nova Senha"
                                    secureTextEntry
                                    autoCapitalize="none"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Campo Confirmação de Senha */}
                            <View style={styles.inputWrapper}>
                                <Feather name="lock" size={18} color="#9ca3af" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirme a Nova Senha"
                                    secureTextEntry
                                    autoCapitalize="none"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    editable={!isLoading}
                                />
                            </View>

                            <TouchableOpacity 
                                style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
                                onPress={handleSubmit} 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.primaryText}>Redefinir Senha</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={{ marginTop: 20 }}>
                            <Text style={styles.errorTextLarge}>
                                {error || "Aguardando o código de redefinição..."}
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 20 }}>
                                <Text style={styles.link}>Voltar para o Login</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
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
    title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10, color: "#111827" },
    subtitle: { fontSize: 14, color: "#4b5563", textAlign: "center", marginBottom: 20 },
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
    primaryButton: {
        backgroundColor: "#2563eb",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    errorText: {
        color: "#dc2626",
        textAlign: "center",
        marginBottom: 10,
        fontSize: 14,
        fontWeight: '500',
    },
    errorTextLarge: {
        color: "#dc2626",
        textAlign: "center",
        fontSize: 16,
        fontWeight: '600',
    },
    link: { textAlign: "center", marginTop: 14, fontSize: 14, color: "#4b5563", textDecorationLine: 'underline' },
});

export default ResetPasswordScreen;
