import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator, DrawerNavigationProp } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, ActivityIndicator, View, Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import React from "react"; // Reintroduzido: Necessário para JSX

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
import SettingsScreen from "../screens/SettingsScreen"; 
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
// ✅ NOVO: Importa a tela de redefinição de senha
import ResetPasswordScreen from "../screens/ResetPasswordScreen"; 
import LoadingScreen from "../screens/LoadingScreen"; // Usado para fallback ou tela inicial de loading

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
    // 💡 ADICIONADO: Rota para Deep Link de redefinição de senha
    ResetPassword: { oobCode?: string }; 
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// --- CONFIGURAÇÃO DO DEEP LINK (para produção) ---

const linking: LinkingOptions<RootStackParamList> = {
  // O prefixo DEVE ser o 'scheme' do app.json + '://'
  prefixes: ['glucocare://'], 
  
  config: {
    screens: {
      // Mapeia o caminho do URL para o nome da tela
      // Ex: glucocare://ResetPassword abre a tela ResetPassword
      ResetPassword: 'ResetPassword',
      Login: 'Login', 
      Register: 'Register',
      ForgotPassword: 'ForgotPassword',
      DrawerRoutes: 'DrawerRoutes',
    },
  },
  
  // 💡 Extração de parâmetros: Garante que o oobCode seja lido e passado como parâmetro
  getStateFromPath: (path, config) => {
    // Verifica se o caminho é para redefinição de senha
    if (path.includes('ResetPassword')) {
        // Assume que os parâmetros são separados por '?'
        const urlParams = new URLSearchParams(path.split('?')[1]);
        const oobCode = urlParams.get('oobCode');

        if (oobCode) {
            // Retorna o estado com a rota ResetPassword e o parâmetro oobCode
            return {
                routes: [{ name: 'ResetPassword' as const, params: { oobCode } }],
            };
        }
    }
    // Caso contrário, deixa o React Navigation lidar com a navegação normal
    return undefined; 
  },
};


// --- COMPONENTES AUXILIARES ---

type MenuButtonProps = {
    navigation: DrawerNavigationProp<DrawerParamList>;
};

function MenuButton({ navigation }: MenuButtonProps) {
    return (
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <MaterialIcons name="menu" size={26} color="#fff" style={{ marginLeft: 12 }} />
        </TouchableOpacity>
    );
}

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
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
        // Usa a tela de Loading separada
        return <LoadingScreen />; 
    }

    return (
        // 🚀 ENVOLVIDO POR NavigationContainer para habilitar o linking
        <NavigationContainer 
            linking={linking}
            fallback={
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f6ff" }}>
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
                        {/* 💡 ESSENCIAL: Permite que o Deep Link abra esta tela, mesmo deslogado */}
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
