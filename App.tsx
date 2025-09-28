import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 

// 🚀 ESSENCIAL: Importa o AuthProvider
import { AuthProvider } from './src/context/AuthContext'; 

// 🚀 NOVO: Importa o RootNavigator (que você havia chamado de AppNavigator ou RootNavigator)
// 💡 Supondo que você o renomeou para RootNavigator, como sugerido, para evitar confusão.
// Caso contrário, use o nome original (ex: import AppNavigator from './src/navigation/AppNavigator';)
import RootNavigator from './src/navigation/RootNavigator'; 

// ❌ Removido: import { View, Text, ActivityIndicator } from 'react-native'; 
// ❌ Removido: import * as SecureStore from 'expo-secure-store';
// ❌ Removido: import AuthStack from './src/navigation/AuthStack';
// ❌ Removido: import DrawerRoutes from './src/navigation/DrawerRoutes';

export default function App() {
    // ❌ REMOVIDO: Toda a lógica de estado (useState) e o useEffect foram movidos para AuthContext.tsx
    // ❌ REMOVIDO: O bloco 'if (loading)' foi movido para RootNavigator.tsx (onde usa o useAuth().loading)

    return (
        <SafeAreaProvider>
            {/* 1. AuthProvider: Gerencia o estado isAuthenticated e loading para todo o app */}
            <AuthProvider>
                <NavigationContainer>
                    {/* 2. RootNavigator: Componente que usa o useAuth() e decide renderizar Login/Drawer */}
                    <RootNavigator />
                </NavigationContainer>
            </AuthProvider>
        </SafeAreaProvider>
    );
}

// 💡 Mantemos os estilos aqui, embora o 'loader' não seja mais usado neste arquivo,
// a menos que você queira usá-los em outros componentes de carregamento.
const styles = StyleSheet.create({
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
});