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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { AntDesign, Feather } from "@expo/vector-icons";

// Completa o processo de autenticação se o navegador estiver em uma sessão pendente.
WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  navigation: any; // Pode ser ajustado com base na configuração do seu navegador
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Configuração do Google OAuth
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
              navigation.replace("DrawerRoutes", { screen: "Dashboard" });
            }
          }
        }
      } catch (err) {
        console.error("Erro biometria:", err);
      }
    })();
  }, []);

  // Resposta de login do Google
  useEffect(() => {
    (async () => {
      if (response?.type === "success" && response.authentication) {
        try {
          const token = response.authentication.accessToken;
          await SecureStore.setItemAsync("google_token", token);

          // Obter dados do usuário
          const userInfoResponse = await fetch("https://www.googleapis.com/userinfo/v2/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!userInfoResponse.ok) throw new Error("Erro ao buscar dados");

          const user = await userInfoResponse.json();
          await SecureStore.setItemAsync("registered_email", user.email);

          let profile = await SecureStore.getItemAsync("user_profile");
          if (!profile) {
            profile = JSON.stringify({
              name: user.name || "Usuário Google",
              email: user.email,
              provider: "google",
              createdAt: new Date().toISOString(),
            });
            await SecureStore.setItemAsync("user_profile", profile);
            navigation.replace("ProfileSetup");
            return;
          }

          const biometricEnabled = await SecureStore.getItemAsync("biometric_enabled");
          navigation.replace(
            biometricEnabled !== "true" ? "BiometricSetup" : "DrawerRoutes",
            { screen: "Dashboard" }
          );
        } catch (err) {
          console.error("Login Google:", err);
          Alert.alert("Erro", "Não foi possível completar login com Google.");
        }
      }
    })();
  }, [response]);

  // Login manual (e-mail/senha)
  const handleLogin = async () => {
    try {
      const storedEmail = await SecureStore.getItemAsync("registered_email");
      const storedPassword = await SecureStore.getItemAsync("registered_password");

      if (!storedEmail || !storedPassword) {
        Alert.alert("Conta não encontrada", "Crie uma conta primeiro.");
        return;
      }
      if (email.trim() !== storedEmail || password !== storedPassword) {
        Alert.alert("Credenciais inválidas", "E-mail ou senha incorretos.");
        return;
      }

      let profile = await SecureStore.getItemAsync("user_profile");
      if (!profile) {
        profile = JSON.stringify({
          name: "Usuário GlucoCare",
          email: storedEmail,
          provider: "manual",
          createdAt: new Date().toISOString(),
        });
        await SecureStore.setItemAsync("user_profile", profile);
        navigation.replace("ProfileSetup");
        return;
      }

      const biometricEnabled = await SecureStore.getItemAsync("biometric_enabled");
      navigation.replace(
        biometricEnabled !== "true" ? "BiometricSetup" : "DrawerRoutes",
        { screen: "Dashboard" }
      );
    } catch (err) {
      console.error("handleLogin erro:", err);
      Alert.alert("Erro", "Falha ao tentar logar.");
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
              disabled={!request}
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
                accessible
                accessibilityLabel="campo de senha"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryText}>Entrar</Text>
            </TouchableOpacity>

            {/* Link para a tela ForgotPassword */}
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.link}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <Text style={styles.signupText}>
              Não tem uma conta?{" "}
              <Text style={styles.signupLink} onPress={() => navigation.navigate("Register")}>
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
