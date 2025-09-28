import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// 1. Definição da Tipagem do Contexto
interface AuthContextType {
    isAuthenticated: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    // Adicione aqui qualquer outro dado ou função do usuário
}

// 2. Criação do Contexto
// Inicializado com um valor que satisfaz o AuthContextType, mas com funções vazias.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. O Provedor (Componente que irá encapsular o App)
interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // 💡 IMPORTANTE: Carrega o estado inicial do login no App.tsx.
    // O App.tsx também deve inicializar este estado lendo o SecureStore.
    // Deixaremos o manejo do estado no App.tsx para evitar duplicação de lógica,
    // mas as funções de login/logout ficam aqui.

    const login = async () => {
        // Lógica para marcar o usuário como logado (ex: lendo o perfil)
        const profile = await SecureStore.getItemAsync('user_profile');
        if (profile) {
            setIsAuthenticated(true);
        }
    };

    const logout = async () => {
        // Lógica de limpeza
        await SecureStore.deleteItemAsync('user_profile');
        await SecureStore.deleteItemAsync('google_token');
        await SecureStore.deleteItemAsync('registered_email');
        await SecureStore.deleteItemAsync('registered_password'); // Se você armazena a senha
        setIsAuthenticated(false);
    };

    useEffect(() => {
        // Verifica o estado inicial ao carregar o provedor
        login();
    }, []);


    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 4. O Hook Customizado (A SOLUÇÃO PARA O ERRO TS2305)
/**
 * Hook customizado para consumir o contexto de autenticação.
 * É a única forma de exportar que o AuthStack.tsx espera.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};