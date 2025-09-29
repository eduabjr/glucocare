import React, { createContext, useContext, useState, useEffect } from 'react';

// --- MOCK DE DEPENDÊNCIAS NATIVAS ---
// Usando o localStorage do navegador para simular SecureStore em um ambiente web/mock.

/**
 * Mock para 'expo-secure-store'.
 */
const SecureStore = {
    async getItemAsync(key: string): Promise<string | null> {
        // Verifica se o localStorage está disponível para evitar erros em ambientes sem ele
        if (typeof window !== 'undefined' && window.localStorage) {
            return Promise.resolve(window.localStorage.getItem(key));
        }
        return Promise.resolve(null);
    },
    async setItemAsync(key: string, value: string): Promise<void> {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
    },
    async deleteItemAsync(key: string): Promise<void> {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
        }
        return Promise.resolve();
    },
};

// A interface UserProfile é definida aqui.
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    googleId?: string;
    onboardingCompleted?: boolean;
    biometricEnabled?: boolean;
    weight?: number | null;
    height?: number | null;
    birthDate?: string;
    condition?: string;
    restriction?: string;
    syncedAt?: string | null;
}

// Mock da função de limpeza de DB que seria importada do dbService.
const clearUser = async (): Promise<void> => {
    return Promise.resolve();
};

// --- FIM DOS MOCKS ---


// --- Constantes de Armazenamento ---
const PROFILE_KEY = 'user_profile';
const GOOGLE_TOKEN_KEY = 'google_token';
const REGISTERED_EMAIL_KEY = 'registered_email';

// 1. Definição da Tipagem do Contexto
interface AuthContextType {
    isAuthenticated: boolean;
    user: UserProfile | null;
    isLoading: boolean;
    login: (profile: UserProfile) => Promise<void>;
    logout: () => Promise<void>;
    // Adicionar um setter para o usuário pode ser útil para atualizações de perfil
    setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

// 2. Criação do Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. O Provedor (Componente que irá encapsular o App)
interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Função para verificar o estado de login no armazenamento seguro
    const checkAuthStatus = async () => {
        try {
            const storedProfile = await SecureStore.getItemAsync(PROFILE_KEY);
            
            if (storedProfile) {
                const profile: UserProfile = JSON.parse(storedProfile);
                setIsAuthenticated(true);
                setUser(profile);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            console.error("Erro ao verificar status de autenticação:", error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            // Garante que o loading seja sempre desabilitado no final da checagem
            setIsLoading(false); 
        }
    };

    /**
     * Define o usuário como logado e armazena o perfil no SecureStore.
     */
    const login = async (profile: UserProfile) => {
        try {
            // Atualiza o SecureStore com o perfil mais recente
            await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
            setIsAuthenticated(true);
            setUser(profile);
        } catch (error) {
            console.error("Erro ao executar login:", error);
            // Reverte o estado em caso de falha de armazenamento
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    /**
     * Executa o logout, limpa SecureStore e limpa dados locais (SQLite).
     */
    const logout = async () => {
        try {
            // 1. Limpeza do SecureStore (removendo todos os tokens/perfis)
            await SecureStore.deleteItemAsync(PROFILE_KEY);
            await SecureStore.deleteItemAsync(GOOGLE_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REGISTERED_EMAIL_KEY); 
            await SecureStore.deleteItemAsync('registered_password'); 
            
            // 2. Limpeza do SQLite (usando nosso mock)
            await clearUser(); 

            // 3. Limpeza do estado
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error("Erro durante o logout:", error);
            // Em caso de erro, a melhor prática é forçar o logout do estado
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    // 💡 Adicionado setUser ao valor do contexto para permitir atualizações de perfil
    return (
        <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// 4. O Hook Customizado
/**
 * Hook customizado para consumir o contexto de autenticação.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};