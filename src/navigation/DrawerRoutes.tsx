import { Platform, StatusBar, View } from "react-native";
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
import ProfileEditScreen from "../screens/ProfileEditScreen";
import ReportScreen from "../screens/ReportScreen";
import ViewReportScreen from "../screens/ViewReportScreen";

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
    ProfileEdit: undefined;
    Report: undefined;
    ViewReport: {
        reportType: 'monthly' | 'full';
        title: string;
    };
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
    | "description"
    | "person"
    | "remove-red-eye";

const drawerIcon = (name: IconName) => ({ color, size }: { color: string; size: number }) => (
    <MaterialIcons name={name} color={color} size={size} />
);

// Função do DrawerNavigator
function DrawerRoutes() {
    const insets = useSafeAreaInsets();

    return (
        <>
            {/* Retângulo para empurrar o header */}
            {Platform.OS === 'android' && (StatusBar.currentHeight || 0) > 0 && (
                <View 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: StatusBar.currentHeight || 0,
                        backgroundColor: '#f0f6ff', // Cor do fundo da tela
                        zIndex: 999,
                    }}
                />
            )}
            
            <Drawer.Navigator
            drawerContent={(props) => <CustomDrawer {...props} />}
            screenOptions={{
                headerShown: true, // Header agora visível
                headerStyle: {
                    backgroundColor: "#2563eb", // Cor de fundo do cabeçalho
                    elevation: 0, // Remover a sombra para ficar mais clean
                    shadowOpacity: 0, // Remover a sombra
                    height: 100, // Altura ainda maior para mostrar o conteúdo
                    justifyContent: "center", // Alinha o conteúdo no centro
                    paddingHorizontal: 16, // Espaçamento para o conteúdo no cabeçalho
                    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0, // Empurra o header para baixo
                },
                headerStatusBarHeight: 0, // Remove offset automático
                headerTintColor: "#fff",
                headerTitleStyle: { 
                    fontWeight: "600", 
                    fontSize: 18, // Reduzido para 18
                    position: 'absolute', // Posicionamento absoluto
                    bottom: 14, // Mesma altura que o menu lateral
                    left: 50, // Mais próximo do menu lateral
                },
                headerLeft: () => <MenuButton />, // Ícone de menu
                drawerActiveBackgroundColor: "#2563eb",
                drawerActiveTintColor: "#fff",
                drawerInactiveTintColor: "#333",
                drawerStyle: { 
                    width: 280,
                    backgroundColor: "#f5f7fa",
                    marginTop: 0,
                    height: '100%',
                },
                sceneContainerStyle: { 
                    backgroundColor: "#f0f6ff"
                },
                drawerType: 'back',
                overlayColor: 'rgba(0,0,0,0.5)',
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
                name="Report"
                component={ReportScreen}
                options={{
                    title: "Relatório de Glicemia", 
                    drawerIcon: drawerIcon("description"),
                }}
            />
            <Drawer.Screen
                name="ProfileEdit"
                component={ProfileEditScreen}
                options={{
                    title: "Editar Perfil", 
                    drawerIcon: drawerIcon("person"),
                }}
            />
            <Drawer.Screen
                name="ViewReport"
                component={ViewReportScreen}
                options={{
                    title: "Visualizar Relatório", 
                    drawerIcon: drawerIcon("remove-red-eye"),
                }}
            />
        </Drawer.Navigator>
        </>
    );
}

export default DrawerRoutes;
