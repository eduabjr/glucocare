import React from "react"; 
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, ActivityIndicator, View, Platform, StatusBar, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, LinkingOptions, useNavigation, DrawerActions } from '@react-navigation/native';

// ✨ Importa o hook de AuthContext
import { useAuth } from "../context/AuthContext";

// Importações de Telas e CustomDrawer
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

// Tipagens (mantidas como no seu código)
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
    ForgotPassword: undefined;
    ResetPassword: { oobCode?: string }; 
    Drawer: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// Configuração de Deep Link (mantida como no seu código)
const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['glucocare://'], 
    config: {
        screens: {
            ResetPassword: 'ResetPassword',
            Drawer: 'Drawer',
            Login: 'Login',
            Register: 'Register',
            ForgotPassword: 'ForgotPassword',
        },
    },
};

// Componente MenuButton (mantido)
function MenuButton() {
    const navigation = useNavigation();
    return (
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <MaterialIcons name="menu" size={26} color="#fff" style={styles.menuIcon} />
        </TouchableOpacity>
    );
}

// Rotas do Drawer (mantidas)
function DrawerRoutes() { 
    const insets = useSafeAreaInsets();
    // ... (o seu código do Drawer.Navigator continua aqui, sem alterações)
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawer {...props} />}
            screenOptions={{
                headerStyle: { backgroundColor: "#2563eb" },
                headerTintColor: "#fff",
                headerLeft: () => <MenuButton />,
                // Adicione outras opções de ecrã do drawer conforme necessário
            }}
        >
            <Drawer.Screen name="Dashboard" component={DashboardScreen} />
            <Drawer.Screen name="AddReading" component={AddReadingScreen} options={{ title: "Nova Medição" }} />
            <Drawer.Screen name="DeviceConnection" component={DeviceConnectionScreen} options={{ title: "Conectar Dispositivo" }}/>
            <Drawer.Screen name="Charts" component={ChartsScreen} options={{ title: "Gráficos" }} />
            <Drawer.Screen name="Nutrition" component={NutritionScreen} options={{ title: "Alimentação" }} />
            <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: "Configurações" }} />
            <Drawer.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ title: "Perfil" }} />
        </Drawer.Navigator>
    );
}

// --- NAVEGADOR PRINCIPAL (RootNavigator) ---
export default function RootNavigator() {
    // ✨ CORREÇÃO: Usa 'user' em vez de 'isAuthenticated' para verificar a autenticação
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer 
            linking={linking}
            fallback={
                <View style={styles.fallbackContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            }
        >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {/* ✨ Lógica de navegação baseada na existência do objeto 'user' */}
                {user ? (
                    // Se o utilizador existir, mostra a stack principal da app (com o Drawer)
                    <Stack.Screen name="Drawer" component={DrawerRoutes} />
                ) : (
                    // Caso contrário, mostra a stack de autenticação
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen 
                            name="ResetPassword" 
                            component={ResetPasswordScreen} 
                            options={{ headerShown: true, title: "Definir Nova Senha" }} 
                        /> 
                        <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

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

