// src/components/MenuButton.tsx


import { TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";

/**
 * Componente de botão para abrir o Drawer Navigator (menu lateral).
 * Utiliza o hook `useNavigation` para acessar o contexto de navegação
 * e despachar a ação de abertura do Drawer, tornando-o reutilizável
 * e desacoplado de props de navegação.
 */
export default function MenuButton() {
    // O hook useNavigation busca o objeto de navegação do navegador pai mais próximo.
    const navigation = useNavigation();

    /**
     * Função chamada ao pressionar o botão.
     * Despacha a ação para abrir o menu lateral.
     */
    const handlePress = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.touchable}>
            <MaterialIcons 
                name="menu" 
                size={26}
                color="#fff" 
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchable: {
        marginLeft: 20,
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center', // Centraliza o ícone
        width: 40,
        height: 40,
        position: 'absolute', // Posicionamento absoluto
        bottom: 8, // Posiciona na parte inferior do header
    },
});