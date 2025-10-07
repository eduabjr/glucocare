// ✅ REMOVIDO: 'import React from "react";' não é mais necessário em projetos modernos.
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from '@react-navigation/native';

// ✨ Hook de Autenticação
import { useAuth } from "../context/AuthContext";

// ✨ Telas do Aplicativo
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import GlycemicGoalScreen from "../screens/GlycemicGoalScreen";
import BiometricSetupScreen from "../screens/BiometricSetupScreen";
import LoadingScreen from "../screens/LoadingScreen";
import DrawerRoutes from "./DrawerRoutes"; // Importando o navegador do Drawer já existente

// --- Tipagem dos Navegadores ---
export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    ResetPassword: { oobCode?: string };
};

export type OnboardingStackParamList = {
    ProfileSetup: undefined;
    GlycemicGoal: undefined;
    BiometricSetup: undefined;
};

export type RootStackParamList = {
    Auth: undefined;
    Onboarding: undefined;
    App: undefined;
};

// --- Inicialização dos Navegadores ---
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();


// --- GRUPO 1: NAVEGADOR DE AUTENTICAÇÃO ---
function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
            <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <AuthStack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
                options={{ headerShown: true, title: "Definir Nova Senha" }}
            />
        </AuthStack.Navigator>
    );
}

// --- GRUPO 2: NAVEGADOR DE ONBOARDING ---
function OnboardingNavigator() {
    return (
        <OnboardingStack.Navigator>
            <OnboardingStack.Screen 
                name="ProfileSetup" 
                component={ProfileSetupScreen} 
                options={{ headerShown: true, title: "Complete seu Perfil" }}
            />
            <OnboardingStack.Screen 
                name="GlycemicGoal" 
                component={GlycemicGoalScreen} 
                options={{ headerShown: false }}
            />
            <OnboardingStack.Screen 
                name="BiometricSetup" 
                component={BiometricSetupScreen} 
                options={{ headerShown: true, title: "Segurança" }}
            />
        </OnboardingStack.Navigator>
    );
}


// --- NAVEGADOR PRINCIPAL (RAIZ) ---
export default function RootNavigator() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {/* ✨ LÓGICA PRINCIPAL DE NAVEGAÇÃO ✨ */}
                {!user ? (
                    // 1. Se NÃO HÁ usuário, mostra o fluxo de autenticação.
                    <RootStack.Screen name="Auth" component={AuthNavigator} />
                ) : !user.onboardingCompleted ? (
                    // 2. Se HÁ usuário, mas o onboarding NÃO FOI COMPLETO, mostra o fluxo de configuração.
                    <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
                ) : (
                    // 3. Se HÁ usuário E o onboarding FOI COMPLETO, mostra o app principal (Drawer).
                    <RootStack.Screen name="App" component={DrawerRoutes} />
                )}
                
            </RootStack.Navigator>
        </NavigationContainer>
    );
}

// ✅ REMOVIDO: O bloco de estilos abaixo não estava sendo utilizado neste arquivo
// e causaria um erro por falta da importação do 'StyleSheet'.