import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
// ✅ Corrigido: Usando MaterialIcons, que é o ícone padrão que você estava usando
import { MaterialIcons } from "@expo/vector-icons"; 
// Importações necessárias
import { useNavigation, DrawerActions } from "@react-navigation/native";

/**
 * Botão para abrir o Drawer Navigator.
 *
 * Este componente usa o hook `useNavigation` para acessar
 * a navegação sem precisar receber a prop `navigation`.
 */
export default function MenuButton() {
    // 💡 O useNavigation pega a navegação do contexto.
    const navigation = useNavigation();

    const handlePress = () => {
        // Envia a ação para abrir o drawer.
        // Isso resolve o erro de tipagem anterior no DrawerRoutes.tsx
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        // ✅ Corrigido: Usando o estilo in-line para marginLeft para corresponder ao DrawerRoutes
        <TouchableOpacity onPress={handlePress}>
            {/* Ícone de menu. Cor Branca (#fff) para combinar com headerStyle: { headerTintColor: '#fff' } */}
            <MaterialIcons name="menu" size={26} color="#fff" style={styles.icon} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    icon: {
        marginLeft: 12, // Mantém o espaçamento que você tinha na prop headerLeft
    },
});