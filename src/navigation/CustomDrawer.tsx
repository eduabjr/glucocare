import React from "react";
import { View, Text, StyleSheet, Image, Alert } from "react-native";
import {
    DrawerContentScrollView,
    DrawerItem,
    // Importação da tipagem base
    DrawerContentComponentProps, 
    DrawerNavigationProp, // Mantemos o import, mas não o usamos na interface CustomDrawerProps
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

// ✅ CORRIGIDO: Removemos o parâmetro genérico. 
// CustomDrawerProps AGORA SÓ ESTENDE DrawerContentComponentProps.
// O TypeScript infere o resto da tipagem do contexto do Drawer.Navigator.
type CustomDrawerProps = DrawerContentComponentProps; 


// Tipagem dos ícones do drawer (mantida)
type IconName =
    | "dashboard"
    | "add-circle-outline"
    | "bluetooth-outline"
    | "bar-chart"
    | "utensils"
    | "settings"
    | "person"
    | "logout";

type IconLib = typeof MaterialIcons | typeof Ionicons | typeof FontAwesome5 | typeof Feather;

// --- Componente Principal ---
// O tipo 'navigation' é inferido de dentro de CustomDrawerProps
export default function CustomDrawer({ navigation, ...rest }: CustomDrawerProps) {
    const { logout } = useAuth();

    /** Helper para navegar e fechar o drawer */
    // Para resolver a compatibilidade, podemos fazer um pequeno cast na navegação.
    const typedNavigation = navigation as unknown as DrawerNavigationProp<DrawerParamList>;

    const navigateTo = (screenName: keyof DrawerParamList) => {
        typedNavigation.navigate(screenName as any);
        typedNavigation.closeDrawer();
    };

    /** Função de Logout, usando o contexto */
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
        icon: IconName,
        screen: keyof DrawerParamList,
        iconLib: IconLib
    ) => (
        <DrawerItem
            key={screen} 
            label={label}
            labelStyle={styles.label}
            icon={({ color }) => {
                const IconComponent = iconLib;
                // @ts-ignore
                return <IconComponent name={icon} color={color} size={20} />;
            }}
            onPress={() => navigateTo(screen)}
        />
    );

    return (
        // Espalha as props restantes ('rest')
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
                {renderItem("Dashboard", "dashboard", "Dashboard", MaterialIcons)}
                {renderItem("Nova Medição", "add-circle-outline", "AddReading", Ionicons)}
                {renderItem("Conectar Dispositivo", "bluetooth-outline", "DeviceConnection", Ionicons)}
                {renderItem("Gráficos", "bar-chart", "Charts", MaterialIcons)}
                {renderItem("Alimentação", "utensils", "Nutrition", FontAwesome5)}
                {renderItem("Configurações", "settings", "Settings", Feather)}
                {renderItem("Perfil", "person", "ProfileSetup", MaterialIcons)}

                {/* Botão de Logout */}
                <DrawerItem
                    key="logout"
                    label="Sair"
                    labelStyle={[styles.label, { color: "#dc2626" }]}
                    icon={() => <MaterialIcons name="logout" size={20} color="#dc2626" />}
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