import React from "react";
import { createDrawerNavigator, DrawerNavigationProp } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Drawer customizado
import CustomDrawer from "./CustomDrawer";

// Telas
import DashboardScreen from "../screens/DashboardScreen";
import AddReadingScreen from "../screens/AddReadingScreen";
import DeviceConnectionScreen from "../screens/DeviceConnectionScreen";
import ChartsScreen from "../screens/ChartsScreen";
import NutritionScreen from "../screens/NutritionScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";

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

// Tipagem do componente MenuButton
type MenuButtonProps = {
  navigation: DrawerNavigationProp<DrawerParamList>; // Tipagem do navigation
};

const Drawer = createDrawerNavigator<DrawerParamList>();

// Botão de menu no header
function MenuButton({ navigation }: MenuButtonProps) {
  return (
    <TouchableOpacity onPress={() => navigation.openDrawer()}>
      <MaterialIcons
        name="menu"
        size={26}
        color="#fff"
        style={{ marginLeft: 12 }}
      />
    </TouchableOpacity>
  );
}

// Tipagem para os ícones do drawer
type IconName = 
  | "dashboard"
  | "add-circle-outline"
  | "bluetooth"
  | "show-chart"
  | "restaurant-menu"
  | "settings"
  | "person";

// Helper para ícones do drawer
const drawerIcon = (name: IconName) => ({ color, size }: { color: string; size: number }) => (
  <MaterialIcons name={name} color={color} size={size} />
);

export default function DrawerRoutes() {
  const insets = useSafeAreaInsets();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: "#2563eb",
          elevation: 4,
          shadowOpacity: 0.2,
          height:
            56 +
            (Platform.OS === "android"
              ? StatusBar.currentHeight ?? 0
              : insets.top),
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
    </Drawer.Navigator>
  );
}
