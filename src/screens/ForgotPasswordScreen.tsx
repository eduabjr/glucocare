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

// Definindo tipos para as props do componente
interface ForgotPasswordScreenProps {
  navigation: any; // Tipagem para a navegação, podendo ser ajustada conforme sua configuração do React Navigation
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = () => {
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

    // Aqui você pode integrar com sua lógica de envio de e-mail
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Link de redefinição enviado", "Verifique seu e-mail para redefinir a senha.");
      navigation.navigate("Login"); // Volta para a tela de login após o envio
    }, 2000); // Simula um atraso para mostrar o carregamento
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
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Enviar Link</Text>
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
