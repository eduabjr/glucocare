import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, Platform, StatusBar } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context"; // ⬅️ Removido, pois não é mais usado aqui para o header

// 🔹 Telas
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

// 🔹 Drawer customizado
import CustomDrawer from "./CustomDrawer";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

/** 🔹 Botão de menu no header */
function MenuButton({ navigation }) {
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

/** 🔹 Drawer Navigator (fluxo principal do app) */
function DrawerRoutes() {
  // const insets = useSafeAreaInsets(); // ⬅️ Esta linha também pode ser removida se não for usada para mais nada dentro de DrawerRoutes

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: "#2563eb",
          elevation: 4,
          shadowOpacity: 0.2,
          // ⚠️ AQUI: A LINHA 'height' FOI REMOVIDA PARA DEIXAR O REACT NAVIGATION GERENCIAR A ALTURA
          // height: 56 + (Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top),
        },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
        headerLeft: () => <MenuButton navigation={navigation} />,
        drawerActiveBackgroundColor: "#2563eb",
        drawerActiveTintColor: "#fff",
        drawerInactiveTintColor: "#333",
        drawerStyle: { width: 280 },
        // drawerContentContainerStyle: { paddingHorizontal: 12 }, // Pode ser removido se o CustomDrawer já gerencia o padding
        sceneContainerStyle: { backgroundColor: "#f0f6ff" },
      })}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="AddReading"
        component={AddReadingScreen}
        options={{
          title: "Nova Medição",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="DeviceConnection"
        component={DeviceConnectionScreen}
        options={{
          title: "Conectar Dispositivo",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="bluetooth" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Charts"
        component={ChartsScreen}
        options={{
          title: "Gráficos",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="show-chart" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{
          title: "Alimentação",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="restaurant-menu" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Configurações",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="settings" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileSetupScreen}
        options={{
          title: "Perfil",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

/** 🔹 Navegador principal (exportado como padrão para o App.js) */
export default function AppNavigator({ initialRoute = "Login" }) {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      {/* Fluxo de autenticação */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Configuração inicial */}
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

      {/* Fluxo principal */}
      <Stack.Screen name="DrawerRoutes" component={DrawerRoutes} />
    </Stack.Navigator>
  );
}