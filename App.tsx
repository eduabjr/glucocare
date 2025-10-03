import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 

// Importações dos Provedores e Navegador
import { AuthProvider } from './src/context/AuthContext'; 
import { ReadingsProvider } from './src/context/ReadingsContext'; // Importe aqui ou no RootNavigator
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator'; 

export default function App() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                {/* 1. AuthProvider: Gerencia o estado de autenticação/loading */}
                <AuthProvider>
                    {/* 2. ReadingsProvider: Gerencia os dados de medições.
                        Envolve o RootNavigator para que todas as telas (após o login) 
                        tenham acesso aos dados.
                    */}
                    <ReadingsProvider>
                        {/* 3. RootNavigator: Decide qual fluxo de telas mostrar (Login ou App) */}
                        <RootNavigator />
                    </ReadingsProvider>
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}