import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Crypto from "expo-crypto";
import { v4 as uuidv4 } from "uuid";

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Controle para visibilidade da senha
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Controle para visibilidade da confirmação de senha
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true); // Controla o estado do botão de registro

  const appState = useRef(AppState.currentState);
  const lastActiveTime = useRef(Date.now());

  // --- Google OAuth Config
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com",
    webClientId:
      "360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com",
    androidClientId:
      "SUA_ANDROID_CLIENT_ID_AQUI.apps.googleusercontent.com",
    scopes: ["profile", "email"],
  });

  // --- Handle Google Response
  useEffect(() => {
    const handleGoogleAuth = async () => {
      if (response?.type === "success" && response.authentication) {
        try {
          const token = response.authentication.accessToken;
          await SecureStore.setItemAsync("google_token", token);

          const userInfoResponse = await fetch(
            "https://www.googleapis.com/userinfo/v2/me",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const user = await userInfoResponse.json();

          const profile = {
            id: uuidv4(),
            full_name: user.name || "Usuário Google",
            email: user.email,
            provider: "google",
            createdAt: new Date().toISOString(),
            birth_date: new Date(1990, 0, 1).toISOString(),
            height: null,
            weight: null,
            restriction: "",
          };

          await SecureStore.multiSet([
            ["registered_email", user.email],
            ["user_profile", JSON.stringify(profile)],
            ["biometric_enabled", "false"],
          ]);

          Alert.alert("Sucesso", "Conta criada com Google!");
          navigation.replace("ProfileSetup");
        } catch (err) {
          console.error("Erro ao registrar com Google:", err);
          Alert.alert("Erro", "Não foi possível registrar com Google.");
        }
      } else if (response?.type === "error") {
        Alert.alert("Erro", "O login com Google falhou ou foi cancelado.");
        console.log("Resposta de erro do Google:", response);
      }
    };

    handleGoogleAuth();
  }, [response]);

  // --- Função para chamar o prompt do Google
  const handleGoogleSignIn = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("Erro ao iniciar o prompt do Google:", error);
      Alert.alert("Erro", "Não foi possível iniciar o login com Google.");
    }
  };

  // --- Validadores
  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (pw) =>
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /\d/.test(pw) &&
    /[@$!%*?&]/.test(pw);

  // --- Registro Manual
  const handleRegister = async () => {
    try {
      setEmailError("");
      setPasswordError("");
      setConfirmPasswordError("");

      if (!email || !password || !confirmPassword) {
        return Alert.alert("Campos obrigatórios", "Preencha todos os campos.");
      }
      if (!validateEmail(email)) {
        setEmailError("Digite um e-mail válido.");
        return;
      }
      if (!validatePassword(password)) {
        setPasswordError("A senha não atende todos os requisitos.");
        return;
      }
      if (password !== confirmPassword) {
        setConfirmPasswordError("As senhas não coincidem.");
        return;
      }

      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      const profile = {
        id: uuidv4(),
        full_name: "Usuário GlucoCare",
        email: email.trim(),
        provider: "manual",
        createdAt: new Date().toISOString(),
        birth_date: new Date(1990, 0, 1).toISOString(),
        height: null,
        weight: null,
        restriction: "",
      };

      await SecureStore.multiSet([
        ["registered_email", email.trim()],
        ["registered_password", passwordHash],
        ["user_profile", JSON.stringify(profile)],
      ]);

      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const supported =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        await SecureStore.setItemAsync(
          "biometric_enabled",
          hasHardware && supported.length > 0 ? "true" : "false"
        );
      } catch {
        await SecureStore.setItemAsync("biometric_enabled", "false");
      }

      Alert.alert("Sucesso", "Conta criada com sucesso!");
      navigation.replace("ProfileSetup");
    } catch (err) {
      console.error("handleRegister - erro:", err);
      Alert.alert("Erro", "Não foi possível registrar sua conta.");
    }
  };

  // --- Sessão expira após 5 min
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current === "active" && nextState === "background") {
        lastActiveTime.current = Date.now();
      }

      if (
        appState.current.match(/background|inactive/) &&
        nextState === "active"
      ) {
        const inactiveTime = Date.now() - lastActiveTime.current;
        if (inactiveTime > 5 * 60 * 1000) {
          Alert.alert("Sessão expirada", "Faça login novamente.");
          navigation.replace("Login");
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
      validatePassword(password) &&
      password === confirmPassword;
    setIsButtonDisabled(!isFormValid);
  }, [email, password, confirmPassword]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <AntDesign
            name="adduser"
            size={64}
            color="#2563eb"
            style={{ alignSelf: "center", marginBottom: 20 }}
          />

          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>
            Preencha os dados ou use sua conta Google
          </Text>

          {/* Botão Google */}
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

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
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
                name={showPassword ? "eye" : "eye-off"}
                size={24}
                color="#6b7280" // Cor preta para o ícone
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, confirmPasswordError ? styles.inputError : null]}
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
                name={showConfirmPassword ? "eye" : "eye-off"}
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
            Já tem uma conta?{" "}
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              Entrar
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f6ff" },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: "center",
    marginBottom: 16,
  },
  googleText: { fontSize: 16, fontWeight: "600", color: "#111" },
  orText: { textAlign: "center", color: "#6b7280", marginVertical: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fff",
    fontSize: 15,
    marginBottom: 8,
    color: "#111827",
    width: "100%",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
  buttonPrimary: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  loginText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    color: "#4b5563",
  },
  loginLink: { color: "#2563eb", fontWeight: "600" },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
  },
});
