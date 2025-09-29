import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
// Importa o ícone
import { MaterialIcons } from "@expo/vector-icons"; 
// Importações necessárias para navegação desacoplada
import { useNavigation, DrawerActions } from "@react-navigation/native";

/**
 * Botão para abrir o Drawer Navigator.
 * * Este componente usa o hook `useNavigation` para acessar
 * o contexto de navegação e despachar a ação de abertura do Drawer.
 */
export default function MenuButton() {
    // 💡 O useNavigation pega a navegação do contexto (neste caso, o DrawerNavigator mais próximo).
    const navigation = useNavigation();

    const handlePress = () => {
        // ✅ Ação correta: Despacha a abertura do Drawer, eliminando a dependência de props.
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <TouchableOpacity onPress={handlePress}>
            {/* O estilo com `marginLeft: 12` garante o espaçamento correto no header. */}
            <MaterialIcons name="menu" size={26} color="#fff" style={styles.icon} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    icon: {
        marginLeft: 12, // Mantém o espaçamento no lado esquerdo do header
    },
});