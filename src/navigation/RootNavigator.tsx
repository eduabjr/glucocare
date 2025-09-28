// src/navigation/RootNavigator.tsx (Versão Final Consolidada)

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator, DrawerNavigationProp } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, ActivityIndicator, View, Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react"; 

// 🚀 ESSENCIAL: Importa o hook de AuthContext
import { useAuth } from "../context/AuthContext";

// Telas
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AddReadingScreen from "../screens/AddReadingScreen";
import ChartsScreen from "../screens/ChartsScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import BiometricSetupScreen from "../screens/BiometricSetupScreen";
import DeviceConnectionScreen from "../screens/DeviceConnectionScreen";
import NutritionScreen from "../screens/NutritionScreen";
// ✅ CORREÇÃO: Removido o 'screens/' duplicado
import SettingsScreen from "../screens/SettingsScreen"; 
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

// Drawer customizado
import CustomDrawer from "./CustomDrawer";

// --- TIPAGENS GLOBAIS ---

type DrawerParamList = {
    Dashboard: undefined;
    AddReading: undefined;
    DeviceConnection: undefined;
    Charts: undefined;
    Nutrition: undefined;
    Settings: undefined;
    ProfileSetup: undefined;
};

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    BiometricSetup: undefined;
    ProfileSetup: undefined;
    DrawerRoutes: undefined;
    ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// --- COMPONENTES AUXILIARES ---

type MenuButtonProps = {
    // Mantemos este tipo, pois o componente realmente só precisa da navegação do Drawer
    navigation: DrawerNavigationProp<DrawerParamList>;
};

function MenuButton({ navigation }: MenuButtonProps) {
    return (
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <MaterialIcons name="menu" size={26} color="#fff" style={{ marginLeft: 12 }} />
        </TouchableOpacity>
    );
}

// Tipagem e Helper para ícones do drawer
type IconName =
    | "dashboard"
    | "add-circle-outline"
    | "bluetooth"
    | "show-chart"
    | "restaurant-menu"
    | "settings"
    | "person";

const drawerIcon = (name: IconName) => ({ color, size }: { color: string; size: number }) => (
    <MaterialIcons name={name} color={color} size={size} />
);

// --- ROTAS DO DRAWER ---

function DrawerRoutes() { 
    const insets = useSafeAreaInsets();

    return (
        <Drawer.Navigator
            drawerContent={(props) => (
                <CustomDrawer
                    {...props}
                    // ✅ CORREÇÃO APLICADA: Repasse a navegação diretamente.
                    // O CustomDrawer deve aceitar DrawerContentComponentProps.
                    navigation={props.navigation} 
                />
            )}
            screenOptions={({ navigation }) => ({
                headerStyle: {
                    backgroundColor: "#2563eb",
                    elevation: 4,
                    shadowOpacity: 0.2,
                    height: 56 + (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : insets.top),
                },
                headerTintColor: "#fff",
                headerTitleStyle: { fontWeight: "700", fontSize: 18 },
                
                // ✅ CORREÇÃO APLICADA: Repasse a navegação diretamente.
                headerLeft: () => <MenuButton navigation={navigation} />,
                
                drawerActiveBackgroundColor: "#2563eb",
                drawerActiveTintColor: "#fff",
                drawerInactiveTintColor: "#333",
                drawerStyle: { width: 280 },
                sceneContainerStyle: { backgroundColor: "#f0f6ff" },
            })}
        >
            <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard", drawerIcon: drawerIcon("dashboard") }} />
            <Drawer.Screen name="AddReading" component={AddReadingScreen} options={{ title: "Nova Medição", drawerIcon: drawerIcon("add-circle-outline") }} />
            <Drawer.Screen name="DeviceConnection" component={DeviceConnectionScreen} options={{ title: "Conectar Dispositivo", drawerIcon: drawerIcon("bluetooth") }} />
            <Drawer.Screen name="Charts" component={ChartsScreen} options={{ title: "Gráficos", drawerIcon: drawerIcon("show-chart") }} />
            <Drawer.Screen name="Nutrition" component={NutritionScreen} options={{ title: "Alimentação", drawerIcon: drawerIcon("restaurant-menu") }} />
            <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: "Configurações", drawerIcon: drawerIcon("settings") }} />
            <Drawer.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ title: "Perfil", drawerIcon: drawerIcon("person") }} />
        </Drawer.Navigator>
    );
}

// --- NAVEGADOR PRINCIPAL (Auth & App Flow) ---

export default function RootNavigator() {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f0f6ff",
                }}
            >
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                // Usuário Autenticado
                <Stack.Screen name="DrawerRoutes" component={DrawerRoutes} />
            ) : (
                // Usuário Não Autenticado
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
                    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}