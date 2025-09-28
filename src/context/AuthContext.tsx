import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
// ✅ IMPORTAÇÕES ESSENCIAIS
import { auth } from '../config/firebase'; 
import { initDB, saveOrUpdateUser, getUser, UserProfile } from '../services/dbService'; // Serviço de DB
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native'; // Usaremos Alert para erros simples no contexto

WebBrowser.maybeCompleteAuthSession();

// Definição de Tipos
interface AuthContextType {
    user: FirebaseUser | null;
    profile: UserProfile | null; // O perfil local, sincronizado
    isAuthenticated: boolean;
    isLoading: boolean; // Controla o carregamento inicial (Corrigido para ser consistente)
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>; // Assinatura mantida para futuras implementações
    // ✅ Novo método para atualizar o perfil após o onboarding/edição de dados
    updateProfileLocally: (updatedProfile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -------------------------------------------------------------
// FUNÇÃO AUXILIAR DE SINCRONIZAÇÃO E CRIAÇÃO DE PERFIL
// -------------------------------------------------------------

/**
 * Cria/carrega o perfil local (SQLite) e sincroniza com o Firestore após a autenticação.
 */
async function handleUserInitialization(firebaseUser: FirebaseUser, name?: string): Promise<UserProfile | null> {
    try {
        const existingProfile = await getUser();

        if (existingProfile && existingProfile.id === firebaseUser.uid) {
            // Se o perfil local existe E pertence ao usuário atual, usa-o.
            console.log("Perfil local encontrado.");
            return existingProfile;
        }

        // Caso contrário, cria um novo perfil e salva/sincroniza.
        const newProfile: UserProfile = {
            id: firebaseUser.uid,
            name: name || firebaseUser.displayName || 'Usuário GlucoCare',
            email: firebaseUser.email || '',
            googleId: '', 
            onboardingCompleted: false, // Inicia como falso
            biometricEnabled: false,
            weight: null,
            height: null,
            birthDate: '',
            condition: '',
            restriction: '',
            syncedAt: null,
        };
        // Salva no SQLite E sincroniza com o Firestore
        const savedProfile = await saveOrUpdateUser(newProfile); 
        console.log("Novo perfil criado e sincronizado.");
        return savedProfile as UserProfile;

    } catch (error) {
        console.error("Erro no handleUserInitialization (SQLite/Firestore):", error);
        Alert.alert("Erro de Dados", "Não foi possível carregar ou criar o perfil do usuário localmente. Tente novamente.");
        return null;
    }
}

// -------------------------------------------------------------
// PROVIDER
// -------------------------------------------------------------

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Controla o carregamento inicial

    // 1. Inicializa o DB Local (SQLite)
    useEffect(() => {
        initDB().catch(err => console.error("Erro fatal ao inicializar o DB local:", err));
    }, []);

    // 2. Listener de Autenticação do Firebase (Detecta Login/Logout)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Se autenticado no Firebase, sincroniza/carrega o perfil local
                    const userProfile = await handleUserInitialization(firebaseUser);
                    
                    if (userProfile) {
                        setUser(firebaseUser);
                        setProfile(userProfile);
                    } else {
                        // Se falhar ao obter o perfil, forçamos o logout
                        await signOut(auth);
                    }
                } catch (error) {
                    console.error("Erro ao carregar perfil após login:", error);
                    await signOut(auth); // Força logout em caso de erro de DB
                }
            } else {
                // Usuário deslogado
                setUser(null);
                setProfile(null);
            }
            // Desliga o loading inicial após a primeira checagem de auth
            setIsLoading(false); 
        });

        return () => unsubscribe();
    }, []);

    // Implementação das funções de autenticação
    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // O Firebase Auth faz o login
            await signInWithEmailAndPassword(auth, email, password);
            // O onAuthStateChanged (acima) cuidará de carregar o perfil e setar o estado
        } catch (error: any) {
            console.error("Erro ao fazer login:", error);
            setIsLoading(false); // Desliga o loading em caso de falha
            // Re-throw o erro para que o componente LoginScreen possa lidar com a mensagem de erro
            throw error; 
        }
    };

    const register = async (email: string, password: string, name: string) => {
        setIsLoading(true);
        try {
            // 1. Cria o usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // 2. Cria o perfil no SQLite e Firestore (passando o nome inicial)
            const userProfile = await handleUserInitialization(userCredential.user, name);
            
            // 3. Atualiza o estado local
            setUser(userCredential.user);
            setProfile(userProfile);
            
        } catch (error: any) {
            console.error("Erro ao registrar:", error);
            setIsLoading(false); // Desliga o loading em caso de falha
            throw error;
        }
    };
    
    // Funções de Perfil
    const updateProfileLocally = (updatedProfile: UserProfile) => {
        setProfile(updatedProfile);
        // Não precisamos chamar saveOrUpdateUser aqui,
        // pois a função que chama updateProfileLocally (ex: ProfileScreen)
        // já deve ter chamado saveOrUpdateUser antes.
    };
    

    const loginWithGoogle = async () => {
        // Implementação do Google Sign-In viria aqui.
        // Após a autenticação bem-sucedida, o onAuthStateChanged é acionado
        // e chama handleUserInitialization.
        console.warn("Google Auth não implementado.");
    };

    const logout = async () => {
        try {
            await signOut(auth);
            // O onAuthStateChanged (acima) cuidará de resetar user/profile e isLoading
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            throw error;
        }
    };

    // A autenticação é válida se houver um usuário do Firebase E um perfil local carregado
    const isAuthenticated = !!user && !!profile;

    return (
        <AuthContext.Provider value={{ user, profile, isAuthenticated, isLoading, login, register, logout, loginWithGoogle, updateProfileLocally }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};
