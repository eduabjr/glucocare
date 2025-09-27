import { createDrawerNavigator, DrawerNavigationProp } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Telas
import DashboardScreen from "../screens/DashboardScreen";
import AddReadingScreen from "../screens/AddReadingScreen";
import DeviceConnectionScreen from "../screens/DeviceConnectionScreen";
import ChartsScreen from "../screens/ChartsScreen";
import NutritionScreen from "../screens/NutritionScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";

// Drawer customizado
import CustomDrawer from "./CustomDrawer";
import MenuButton from "../components/MenuButton";  // Ajuste o caminho conforme necessário

// Tipagem do Drawer Navigator
type DrawerParamList = {
  Dashboard: undefined;
  AddReading: undefined;
  DeviceConnection: undefined;
  Charts: undefined;
  Nutrition: undefined;
  Settings: undefined;
  ProfileSetup: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

function DrawerRoutes({ onLogout }: { onLogout: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawer
          {...props}
          onLogout={onLogout}
          navigation={props.navigation as unknown as DrawerNavigationProp<DrawerParamList>}
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
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
        }}
      />
      <Drawer.Screen
        name="AddReading"
        component={AddReadingScreen}
        options={{
          title: "Nova Medição",
        }}
      />
      <Drawer.Screen
        name="DeviceConnection"
        component={DeviceConnectionScreen}
        options={{
          title: "Conectar Dispositivo",
        }}
      />
      <Drawer.Screen
        name="Charts"
        component={ChartsScreen}
        options={{
          title: "Gráficos",
        }}
      />
      <Drawer.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{
          title: "Alimentação",
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Configurações",
        }}
      />
      <Drawer.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{
          title: "Perfil",
        }}
      />
    </Drawer.Navigator>
  );
}

export default DrawerRoutes;
