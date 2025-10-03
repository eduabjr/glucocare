// Em src/navigation/DrawerRoutes.tsx

// Importações necessárias
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { createDrawerNavigator } from "@react-navigation/drawer"; // ✅ Adicione a importação


// Telas
import DashboardScreen from "../screens/DashboardScreen";
import AddReadingScreen from "../screens/AddReadingScreen";
import DeviceConnectionScreen from "../screens/DeviceConnectionScreen";
import ChartsScreen from "../screens/ChartsScreen";
import NutritionScreen from "../screens/NutritionScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import ReportScreen from '../screens/ReportScreen'; // ✅ Importação da nova tela

// Drawer customizado
import CustomDrawer from "./CustomDrawer";
import MenuButton from "../components/MenuButton";

// Tipagem do Drawer Navigator
export type DrawerParamList = {
    Dashboard: undefined;
    AddReading: undefined;
    DeviceConnection: undefined;
    Charts: undefined;
    Nutrition: undefined;
    Settings: undefined;
    ProfileSetup: undefined;
    Report: undefined; // ✅ Adiciona a nova tela
};

const Drawer = createDrawerNavigator<DrawerParamList>();

// Tipagem e Helper para ícones do drawer
type IconName =
    | "dashboard"
    | "add-circle-outline"
    | "bluetooth"
    | "show-chart"
    | "restaurant-menu"
    | "settings"
    | "person"
    | "description"; // ✅ Adiciona o ícone "description" para a nova tela

const drawerIcon = (name: IconName) => ({ color, size }: { color: string; size: number }) => (
    <MaterialIcons name={name} color={color} size={size} />
);

// Função do DrawerNavigator
function DrawerRoutes() { 
    const insets = useSafeAreaInsets();

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawer {...props} />} // ✅ Tipagem corrigida
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#2563eb",
                    elevation: 4,
                    shadowOpacity: 0.2,
                    height: 56 + (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : insets.top),
                },
                headerTintColor: "#fff",
                headerTitleStyle: { fontWeight: "700", fontSize: 18 },
                headerLeft: () => <MenuButton />,
                drawerActiveBackgroundColor: "#2563eb",
                drawerActiveTintColor: "#fff",
                drawerInactiveTintColor: "#333",
                drawerStyle: { width: 280 },
                sceneContainerStyle: { backgroundColor: "#f0f6ff" },
            }}
        >
            <Drawer.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: "Dashboard", 
                    drawerIcon: drawerIcon("dashboard"),
                }}
            />
            <Drawer.Screen
                name="AddReading"
                component={AddReadingScreen}
                options={{
                    title: "Nova Medição", 
                    drawerIcon: drawerIcon("add-circle-outline"),
                }}
            />
            <Drawer.Screen
                name="DeviceConnection"
                component={DeviceConnectionScreen}
                options={{
                    title: "Conectar Dispositivo", 
                    drawerIcon: drawerIcon("bluetooth"),
                }}
            />
            <Drawer.Screen
                name="Charts"
                component={ChartsScreen}
                options={{
                    title: "Gráficos", 
                    drawerIcon: drawerIcon("show-chart"),
                }}
            />
            <Drawer.Screen
                name="Nutrition"
                component={NutritionScreen}
                options={{
                    title: "Alimentação", 
                    drawerIcon: drawerIcon("restaurant-menu"),
                }}
            />
            <Drawer.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: "Configurações", 
                    drawerIcon: drawerIcon("settings"),
                }}
            />
            <Drawer.Screen
                name="ProfileSetup"
                component={ProfileSetupScreen}
                options={{
                    title: "Perfil", 
                    drawerIcon: drawerIcon("person"),
                }}
            />
            {/* ✅ Adiciona a nova tela */}
            <Drawer.Screen
                name="Report"
                component={ReportScreen}
                options={{
                    title: "Relatório de Glicemia",
                    drawerIcon: drawerIcon("description"), // Use o ícone apropriado
                }}
            />
        </Drawer.Navigator>
    );
}

export default DrawerRoutes;