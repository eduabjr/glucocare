// src/navigation/CustomDrawer.js
import React from "react";
import { View, Text, StyleSheet, Image, Alert } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

export default function CustomDrawer(props) {
  const insets = useSafeAreaInsets();

  /** 🔹 Helper para navegar para uma tela do Drawer */
  const navigateTo = (screenName) => {
    props.navigation.dispatch(CommonActions.navigate({ name: screenName }));
    props.navigation.closeDrawer?.();
  };

  /** 🔹 Logout: limpa dados e volta para Login */
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("user_profile");
      await SecureStore.deleteItemAsync("google_token");

      props.navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }], // 👈 garante que o fluxo AuthStack recomeça
        })
      );
    } catch (err) {
      Alert.alert("Erro", "Não foi possível sair da conta.");
      console.error("Logout error:", err);
    }
  };

  /** 🔹 Helper para criar itens do Drawer */
  const renderItem = (label, icon, screen, iconLib = MaterialIcons) => (
    <DrawerItem
      label={label}
      labelStyle={styles.label}
      icon={({ color }) =>
        React.createElement(iconLib, { name: icon, size: 20, color })
      }
      onPress={() => navigateTo(screen)}
    />
  );

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.logo}
        />
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
          icon={() => (
            <MaterialIcons name="logout" size={20} color="#dc2626" />
          )}
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
