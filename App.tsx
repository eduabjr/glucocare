import React from 'react';
import { StyleSheet } from 'react-native';
// ❌ REMOVIDO: NavigationContainer foi movido para RootNavigator.tsx
// import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 

// Importações dos Provedores e Navegador
import { AuthProvider } from './src/context/AuthContext'; 
import RootNavigator from './src/navigation/RootNavigator'; 

export default function App() {
    return (
        <SafeAreaProvider>
            {/* 1. AuthProvider: Gerencia o estado de autenticação/loading */}
            <AuthProvider>
                {/* 2. RootNavigator: Contém internamente o único <NavigationContainer> e a lógica de exibição (Login/App) */}
                <RootNavigator />
            </AuthProvider>
        </SafeAreaProvider>
    );
}

// Estilos
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