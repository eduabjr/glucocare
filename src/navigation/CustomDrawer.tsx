import React from "react";
import { View, Text, StyleSheet, Image, Alert } from "react-native";
import {
    DrawerContentScrollView,
    DrawerItem,
    // Tipagem base obrigatória para drawerContent
    DrawerContentComponentProps, 
    DrawerNavigationProp,
} from "@react-navigation/drawer";
import {
    MaterialIcons,
    Ionicons,
    FontAwesome5,
    Feather,
} from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext"; 

// --- Tipagem do Navegador ---
type DrawerParamList = {
    Dashboard: undefined;
    AddReading: undefined;
    DeviceConnection: undefined;
    Charts: undefined;
    Nutrition: undefined;
    Settings: undefined;
    ProfileSetup: undefined;
};

// Usa a tipagem padrão para conteúdos customizados
type CustomDrawerProps = DrawerContentComponentProps; 


// --- Tipagem de Ícones ---
type IconLib = typeof MaterialIcons | typeof Ionicons | typeof FontAwesome5 | typeof Feather;
type IconConfig = {
    name: string;
    lib: IconLib;
};

// --- Componente Principal ---
export default function CustomDrawer({ navigation, ...rest }: CustomDrawerProps) {
    const { logout } = useAuth();

    /** Helper para navegar e fechar o drawer */
    // Cast para tipagem específica do Drawer para habilitar métodos como closeDrawer
    const typedNavigation = navigation as unknown as DrawerNavigationProp<DrawerParamList>;

    const navigateTo = (screenName: keyof DrawerParamList) => {
        typedNavigation.navigate(screenName as any);
        typedNavigation.closeDrawer();
    };

    /** Função de Logout */
    const handleLogout = async () => {
        try {
            await logout(); 
        } catch (err) {
            Alert.alert("Erro", "Não foi possível sair da conta.");
            console.error("Logout error:", err);
        }
    };

    /** Helper para criar itens do Drawer. */
    const renderItem = (
        label: string,
        screen: keyof DrawerParamList,
        iconConfig: IconConfig
    ) => (
        <DrawerItem
            key={screen} 
            label={label}
            labelStyle={styles.label}
            icon={({ color }) => {
                const IconComponent = iconConfig.lib;
                // @ts-ignore: Permite o uso de strings genéricas para o nome do ícone entre as bibliotecas.
                return <IconComponent name={iconConfig.name as any} color={color} size={20} />;
            }}
            onPress={() => navigateTo(screen)}
        />
    );

    return (
        <DrawerContentScrollView {...rest} contentContainerStyle={styles.container}>
            {/* Cabeçalho do Drawer */}
            <View style={styles.header}>
                <Image source={require("../../assets/icon.png")} style={styles.logo} />
                <View>
                    <Text style={styles.appName}>GlucoCare</Text>
                    <Text style={styles.subtitle}>Controle de Glicemia</Text>
                </View>
            </View>

            {/* Menu de Navegação */}
            <View style={styles.menu}>
                {renderItem("Dashboard", "Dashboard", { name: "dashboard", lib: MaterialIcons })}
                {renderItem("Nova Medição", "AddReading", { name: "add-circle-outline", lib: Ionicons })}
                {renderItem("Conectar Dispositivo", "DeviceConnection", { name: "bluetooth", lib: Ionicons })}
                {renderItem("Gráficos", "Charts", { name: "bar-chart", lib: MaterialIcons })}
                {renderItem("Alimentação", "Nutrition", { name: "utensils", lib: FontAwesome5 })}
                {renderItem("Configurações", "Settings", { name: "settings", lib: Feather })}
                {renderItem("Perfil", "ProfileSetup", { name: "person", lib: MaterialIcons })}

                {/* Botão de Logout */}
                <DrawerItem
                    key="logout"
                    label="Sair"
                    labelStyle={[styles.label, { color: "#dc2626" }]}
                    icon={({ color }) => <MaterialIcons name="logout" size={20} color="#dc2626" />}
                    onPress={handleLogout}
                />
            </View>
        </DrawerContentScrollView>
    );
}

// --- Estilos ---
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