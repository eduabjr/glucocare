import { View, Text, StyleSheet, Image, Alert } from "react-native";
import { DrawerContentScrollView, DrawerItem, DrawerContentComponentProps } from "@react-navigation/drawer";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext"; // Certifique-se que o AuthContext está com a tipagem correta
import { AppDrawerParamList } from "./types"; // Importa a tipagem central

// Tipagem para o array de itens de menu
type MenuItem = {
  label: string;
  screen: keyof AppDrawerParamList;
  icon: {
    name: string;
    lib: typeof MaterialIcons | typeof Ionicons | typeof Feather;
  };
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", screen: "Dashboard", icon: { name: "dashboard", lib: MaterialIcons } },
  { label: "Nova Medição", screen: "AddReading", icon: { name: "add-circle-outline", lib: Ionicons } },
  { label: "Gráficos", screen: "Charts", icon: { name: "bar-chart", lib: MaterialIcons } },
  { label: "Relatório de Glicemia", screen: "Report", icon: { name: "description", lib: MaterialIcons } }, // Nome válido
  { label: "Configurações", screen: "Settings", icon: { name: "settings", lib: Feather } },
  { label: "Perfil", screen: "Profile", icon: { name: "person", lib: MaterialIcons } },
];

type CustomDrawerProps = DrawerContentComponentProps;

export default function CustomDrawer({ navigation, ...rest }: CustomDrawerProps) {
  const { logout, user } = useAuth(); // Pegue o objeto 'user' do seu contexto de autenticação

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      Alert.alert("Erro", "Não foi possível sair da conta.");
      console.error("Logout error:", err);
    }
  };

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

      {/* Menu de Navegação renderizado a partir do array */}
      <View style={styles.menu}>
        {menuItems.map((item) => {
          // Lógica de travamento para a tela "Relatório de Glicemia"
          const isLocked = item.screen === "Report" && !user?.emailVerified;

          return (
            <DrawerItem
              key={item.screen}
              label={item.label}
              labelStyle={[styles.label, isLocked && { color: "#9ca3af" }]} // Cor cinza se travado
              icon={({ color, size }) => {
                if (isLocked) {
                  return <MaterialIcons name="lock" color="#9ca3af" size={size - 2} />;
                }
                const IconComponent = item.icon.lib;
                return <IconComponent name={item.icon.name as any} color={color} size={size - 2} />;
              }}
              onPress={() => {
                if (isLocked) {
                  Alert.alert(
                    "Acesso Negado",
                    "Por favor, confirme seu e-mail para acessar os relatórios. Verifique sua caixa de entrada."
                  );
                } else {
                  navigation.navigate(item.screen);
                }
              }}
            />
          );
        })}

        {/* Botão de Logout separado */}
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

// Estilos (permanecem os mesmos)
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
    marginLeft: -16, // Alinhamento fino do texto com o ícone
  },
});
