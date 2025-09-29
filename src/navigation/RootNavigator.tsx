import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator, DrawerContentComponentProps } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, ActivityIndicator, View, Platform, StatusBar, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, LinkingOptions, useNavigation, DrawerActions } from '@react-navigation/native';
import React from "react"; 

// Importa o hook de AuthContext
import { useAuth } from "../context/AuthContext";

// Importações de Telas e CustomDrawer (mantidas)
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AddReadingScreen from "../screens/AddReadingScreen";
import ChartsScreen from "../screens/ChartsScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import BiometricSetupScreen from "../screens/BiometricSetupScreen";
import DeviceConnectionScreen from "../screens/DeviceConnectionScreen";
import NutritionScreen from "../screens/NutritionScreen";
import SettingsScreen from "../screens/SettingsScreen"; 
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen"; 
import LoadingScreen from "../screens/LoadingScreen";
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
    ResetPassword: { oobCode?: string }; 
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// --- CONFIGURAÇÃO DO DEEP LINK ---
const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['glucocare://'], 
    config: {
        screens: {
            ResetPassword: 'ResetPassword',
            Login: 'Login', 
            Register: 'Register',
            ForgotPassword: 'ForgotPassword',
            DrawerRoutes: 'DrawerRoutes',
        },
    },
    getStateFromPath: (path, config) => {
        if (path.includes('ResetPassword')) {
            const urlParams = new URLSearchParams(path.split('?')[1]);
            const oobCode = urlParams.get('oobCode');
            if (oobCode) {
                return {
                    routes: [{ name: 'ResetPassword' as const, params: { oobCode } }],
                };
            }
        }
        return undefined; 
    },
};


// --- COMPONENTE AUXILIAR: MenuButton ---
function MenuButton() {
    // Usa useNavigation para acessar o contexto do Drawer
    const navigation = useNavigation();

    return (
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <MaterialIcons name="menu" size={26} color="#fff" style={styles.menuIcon} />
        </TouchableOpacity>
    );
}

type IconName = "dashboard" | "add-circle-outline" | "bluetooth" | "show-chart" | "restaurant-menu" | "settings" | "person";

const drawerIcon = (name: IconName) => ({ color, size }: { color: string; size: number }) => (
    <MaterialIcons name={name} color={color} size={size} />
);

// --- ROTAS DO DRAWER ---
function DrawerRoutes() { 
    const insets = useSafeAreaInsets();

    return (
        <Drawer.Navigator
            // O componente CustomDrawer é importado e usado diretamente
            drawerContent={(props) => <CustomDrawer {...props} />} 
            screenOptions={() => ({
                headerStyle: {
                    backgroundColor: "#2563eb",
                    elevation: 4,
                    shadowOpacity: 0.2,
                    height: 56 + (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : insets.top),
                },
                headerTintColor: "#fff",
                headerTitleStyle: { fontWeight: "700", fontSize: 18 },
                
                // Usa o MenuButton para abrir o drawer
                headerLeft: () => <MenuButton />, 
                
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

// --- NAVEGADOR PRINCIPAL (RootNavigator) ---
export default function RootNavigator() {
    const { isAuthenticated, isLoading } = useAuth();
    
    // Mostra o LoadingScreen enquanto o estado de autenticação está sendo verificado
    if (isLoading) {
        return <LoadingScreen />; 
    }

    return (
        // ✅ O ÚNICO NavigationContainer NO APP
        <NavigationContainer 
            linking={linking}
            fallback={
                <View style={styles.fallbackContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            }
        >
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
                        <Stack.Screen 
                            name="ResetPassword" 
                            component={ResetPasswordScreen} 
                            options={{ headerShown: true, title: "Definir Nova Senha" }} 
                        /> 
                        {/* BiometricSetup e ProfileSetup acessíveis no fluxo de registro/primeiro uso */}
                        <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// Estilos adicionais
const styles = StyleSheet.create({
    fallbackContainer: {
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: "#f0f6ff"
    },
    menuIcon: {
        marginLeft: 12
    }
});