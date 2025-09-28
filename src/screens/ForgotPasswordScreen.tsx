import React, { useState } from "react";
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
import { RootStackParamList } from "../navigation/RootNavigator"; // Confirme o caminho
import { sendPasswordResetEmail } from "firebase/auth"; // ⚠️ Removida a importação incorreta de FirebaseError
import { FirebaseError } from "firebase/app"; // 💡 Importação correta para tipagem do erro

// 💡 Importa o objeto de autenticação configurado
import { auth } from "../config/firebase";

// O segundo argumento, 'ForgotPassword', especifica que esta tela é a rota "ForgotPassword"
type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async () => { // ⚠️ Tornando a função assíncrona
        if (!email) {
            Alert.alert("Erro", "Por favor, insira um e-mail.");
            return;
        }

        // Validação simples de e-mail
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Erro", "Por favor, insira um e-mail válido.");
            return;
        }

        setIsLoading(true);

        try {
            // 🚀 FUNÇÃO REAL DO FIREBASE: Envia o e-mail de redefinição de senha
            await sendPasswordResetEmail(auth, email.trim());

            // Mensagem de sucesso (aparece mesmo se o e-mail não existir por motivos de segurança)
            Alert.alert(
                "Link de Redefinição Enviado", 
                "Verifique seu e-mail. Se a conta existir, você receberá um link para redefinir sua senha."
            );
            
            // Navega de volta para o login
            navigation.navigate("Login"); 

        } catch (error) {
            console.error("Erro ao enviar e-mail de redefinição:", error);
            
            // 💡 Tratamento de erros: Verificamos se o erro é uma instância de FirebaseError
            if (error instanceof FirebaseError) {
                let errorMessage = "Ocorreu um erro desconhecido.";
                
                switch (error.code) {
                    case 'auth/user-not-found':
                    case 'auth/invalid-email':
                        // Por segurança, mostramos uma mensagem genérica para não revelar a existência da conta
                        errorMessage = "Se o e-mail estiver registrado, um link será enviado.";
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = "Tentativas excessivas. Tente novamente mais tarde.";
                        break;
                    default:
                        // Mostra o código do erro para debug, caso seja um erro não esperado.
                        errorMessage = `Erro de Auth (${error.code}): ${error.message}`;
                }
                
                Alert.alert("Erro de Envio", errorMessage);
            } else {
                // Erro de rede ou outro erro desconhecido
                Alert.alert("Erro", "Não foi possível conectar ao servidor de autenticação.");
            }

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.centered}>
                <View style={styles.card}>
                    <Text style={styles.title}>Esqueceu a senha?</Text>

                    <View style={styles.inputWrapper}>
                        <Feather name="mail" size={18} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Digite seu e-mail"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!isLoading} // Desabilita edição enquanto carrega
                        />
                    </View>

                    <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.primaryText}>Enviar E-mail</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.link}>Voltar para o login</Text>
                    </TouchableOpacity>
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
    title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20, color: "#111827" },
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
    primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    link: { textAlign: "center", marginTop: 14, fontSize: 14, color: "#4b5563" },
});

export default ForgotPasswordScreen;
