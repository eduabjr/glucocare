import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

// 1. Definição da Tipagem do Contexto (Corrigindo login e adicionando loading)
interface AuthContextType {
    isAuthenticated: boolean;
    loading: boolean;        // 🚀 Adicionado loading para o RootNavigator
    login: () => Promise<void>; // ✅ Assinatura Simples: Não requer argumentos
    logout: () => Promise<void>;
}

// 2. Criação do Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // 🚀 Inicializa como true

    // Função auxiliar para verificar o perfil no SecureStore
    const checkAndSetLogin = async () => {
        try {
            const profile = await SecureStore.getItemAsync('user_profile');
            // !!profile retorna true se a string não for nula ou vazia
            setIsAuthenticated(!!profile);
        } catch (error) {
            console.error("Erro ao verificar SecureStore:", error);
            setIsAuthenticated(false);
        } finally {
            // Garante que o estado de loading seja desligado, mesmo em caso de erro
            setLoading(false); 
        }
    };

    // Função chamada pelo LoginScreen. Simplesmente verifica se o perfil está lá.
    const login = async () => {
        await checkAndSetLogin(); 
    };

    const logout = async () => {
        // Lógica de limpeza
        await SecureStore.deleteItemAsync('user_profile');
        await SecureStore.deleteItemAsync('google_token');
        await SecureStore.deleteItemAsync('registered_email');
        await SecureStore.deleteItemAsync('registered_password');
        await SecureStore.deleteItemAsync('biometric_enabled');
        
        setIsAuthenticated(false);
    };

    useEffect(() => {
        // Verifica o estado inicial ao carregar o provedor
        checkAndSetLogin();
    }, []);

    // 4. Retorna o valor do contexto (com o loading)
    return (
        <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 5. O Hook Customizado (useAuth)
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};