import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator, DrawerNavigationProp } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, ActivityIndicator, View, Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

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

// Drawer customizado
import CustomDrawer from "./CustomDrawer";

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

// Tipagem do Stack Navigator
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  BiometricSetup: undefined;
  ProfileSetup: undefined;
  DrawerRoutes: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// Tipagem do componente MenuButton
type MenuButtonProps = {
  navigation: DrawerNavigationProp<DrawerParamList>; // Tipagem do navigation
};

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

// Navegador do Drawer
function DrawerRoutes({ onLogout }: { onLogout: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} onLogout={onLogout} />}
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

// Navegador Principal
export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const userProfile = await SecureStore.getItemAsync("user_profile");
        setIsAuthenticated(!!userProfile);
      } catch (err) {
        console.error("Erro ao verificar login:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuthentication();
  }, []);

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
        <Stack.Screen name="DrawerRoutes">
          {() => <DrawerRoutes onLogout={() => setIsAuthenticated(false)} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen {...props} onLogin={() => setIsAuthenticated(true)} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
