import React from "react";
import { View, Text, StyleSheet, Image, Alert } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerNavigationProp,
} from "@react-navigation/drawer";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useAuthContext } from "../context/AuthContext"; // 🔹 Usar useAuthContext

type DrawerParamList = {
  Dashboard: undefined;
  AddReading: undefined;
  DeviceConnection: undefined;
  Charts: undefined;
  Nutrition: undefined;
  Settings: undefined;
  ProfileSetup: undefined;
};

// Corrigido para o tipo correto
type CustomDrawerProps = {
  navigation: DrawerNavigationProp<DrawerParamList>; // Tipagem do navigation com DrawerParamList
  onLogout: () => void; // Tipagem de onLogout
};

// Tipagem dos ícones do drawer usando 'typeof' para referenciar os tipos dos componentes
type IconName =
  | "dashboard"
  | "add-circle-outline"
  | "bluetooth-outline"
  | "bar-chart"
  | "utensils"
  | "settings"
  | "person"
  | "logout"; // Tipagem para os ícones do drawer

// Tipo para o componente de ícone, usando 'typeof'
type IconLib = typeof MaterialIcons | typeof Ionicons | typeof FontAwesome5 | typeof Feather;

export default function CustomDrawer({ navigation, onLogout }: CustomDrawerProps) {
  const { logout } = useAuthContext(); // 🔹 Pega o logout do contexto através do hook useAuthContext

  /** 🔹 Helper para navegar para uma tela do Drawer */
  const navigateTo = (screenName: keyof DrawerParamList) => {
    navigation.navigate(screenName);
    navigation.closeDrawer();
  };

  /** 🔹 Logout usando o contexto */
  const handleLogout = async () => {
    try {
      await logout(); // 👉 Centralizado no AuthContext
      onLogout(); // Chama a função onLogout passada como prop
    } catch (err) {
      Alert.alert("Erro", "Não foi possível sair da conta.");
      console.error("Logout error:", err);
    }
  };

  /** 🔹 Helper para criar itens do Drawer */
  const renderItem = (
    label: string,
    icon: IconName,
    screen: keyof DrawerParamList,
    iconLib: IconLib = MaterialIcons
  ) => (
    <DrawerItem
      label={label}
      labelStyle={styles.label}
      icon={({ color }) => {
        // Usando iconLib como um componente de ícone
        const IconComponent = iconLib;
        return <IconComponent name={icon} color={color} size={20} />;
      }}
      onPress={() => navigateTo(screen)}
    />
  );

  return (
    <DrawerContentScrollView {...navigation} contentContainerStyle={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Image source={require("../../assets/icon.png")} style={styles.logo} />
        <View>
          <Text style={styles.appName}>GlucoCare</Text>
          <Text style={styles.subtitle}>Controle de Glicemia</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {renderItem("Dashboard", "dashboard", "Dashboard")}
        {renderItem("Nova Medição", "add-circle-outline", "AddReading")}
        {renderItem("Conectar Dispositivo", "bluetooth-outline", "DeviceConnection", Ionicons)}
        {renderItem("Gráficos", "bar-chart", "Charts")}
        {renderItem("Alimentação", "utensils", "Nutrition", FontAwesome5)}
        {renderItem("Configurações", "settings", "Settings", Feather)}
        {renderItem("Perfil", "person", "ProfileSetup")}

        {/* 🔴 Botão de Logout */}
        <DrawerItem
          label="Sair"
          labelStyle={[styles.label, { color: "#dc2626" }]}
          icon={() => <MaterialIcons name="logout" size={20} color="#dc2626" />}
          onPress={handleLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f6ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  logo: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 8,
  },
  appName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  menu: {
    marginTop: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
});
