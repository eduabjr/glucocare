import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, signOut, reload } from 'firebase/auth';
import { auth, db } from '../config/firebase'; // ✨ ADICIONADO: Importar 'db' do Firebase
import { doc, getDoc, setDoc } from 'firebase/firestore'; // ✨ ADICIONADO: Funções do Firestore
import { initDB } from '../services/dbService'; // ✨ ADICIONADO: Importar initDB
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ NOVO: Para persistir estado
import * as SecureStore from 'expo-secure-store'; // ✅ NOVO: Para armazenamento seguro

// A sua interface de perfil de utilizador detalhada
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
    glycemicGoals?: string; // JSON string dos objetivos glicêmicos
    medicationReminders?: string; // JSON string dos alarmes de medicamento
    updated_at?: string;
    pending_sync?: boolean;
    emailVerified?: boolean; // ADICIONADO: emailVerified
}

// Interface do Contexto
interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    hasExistingAccount: boolean; // ✅ NOVO: Indica se existe conta cadastrada
    signInWithGoogle: (idToken: string) => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    updateBiometricStatus: (enabled: boolean) => Promise<void>; // ✅ NOVA FUNÇÃO
    refreshUserEmailStatus: () => Promise<boolean | undefined>; // ✅ NOVA FUNÇÃO: Atualiza status do email
    refreshUserProfile: () => Promise<UserProfile | null>; // ✅ NOVA FUNÇÃO: Recarrega dados do usuário
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasExistingAccount, setHasExistingAccount] = useState(false); // ✅ NOVO: Estado para conta existente

    useEffect(() => {
        // Initialize database on app start
        const initializeApp = async () => {
            try {
                await initDB();
                console.log('Database initialized successfully');
                
                // ✅ NOVO: Carrega o estado de conta existente do AsyncStorage
                const savedHasExistingAccount = await AsyncStorage.getItem('hasExistingAccount');
                if (savedHasExistingAccount !== null) {
                    setHasExistingAccount(JSON.parse(savedHasExistingAccount));
                    console.log('📱 Estado de conta existente carregado:', JSON.parse(savedHasExistingAccount));
                }
                
                // 🧪 Teste de conexão com Firestore
                const { testFirestoreConnection } = await import('../utils/firestoreTest');
                const firestoreConnected = await testFirestoreConnection();
                
                if (firestoreConnected) {
                    console.log('🔥 Firestore conectado com sucesso');
                } else {
                    console.error('❌ Erro na conexão com Firestore');
                }
                
            } catch (error) {
                console.error('Failed to initialize database:', error);
            }
        };
        
        initializeApp();
        
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            try {
                if (firebaseUser) {
                    console.log('🔥 Firebase User autenticado:', firebaseUser.uid);
                    
                    // ✨ ATUALIZAÇÃO: Lógica para carregar ou criar o perfil no Firestore
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    
                    try {
                        const userDoc = await getDoc(userRef);
                        console.log('📄 Documento do usuário existe:', userDoc.exists());

                        if (userDoc.exists()) {
                            // Se o utilizador já existe na base de dados, carrega o perfil completo
                            const userData = userDoc.data();
                            console.log('👤 Dados do usuário carregados:', userData);
                            
                            // ✅ NOVO: Marca que existe conta cadastrada e salva no AsyncStorage
                            setHasExistingAccount(true);
                            await AsyncStorage.setItem('hasExistingAccount', JSON.stringify(true));
                            console.log('💾 Estado de conta existente salvo: true');
                            
                            // ✅ CORREÇÃO: Verifica se o usuário tem dados para considerar onboarding completo
                            const hasBasicInfo = userData?.['full_name'] || userData?.['name'];
                            const hasMedicalInfo = userData?.['diabetes_condition'] || userData?.['condition'];
                            const hasPhysicalInfo = userData?.['weight'] && userData?.['height'];
                            const explicitOnboardingFlag = userData?.['onboarding_completed'];
                            
                            // ✅ NOVA LÓGICA CORRIGIDA: Para usuários existentes, assume onboarding completo
                            // a menos que explicitamente marcado como false
                            // ✅ CORREÇÃO: Só considera onboarding completo se flag explícita for true
                            const isOnboardingComplete = explicitOnboardingFlag === true;
                            
                            console.log('🔍 Debug do onboarding:', {
                                explicitOnboardingFlag,
                                hasBasicInfo,
                                hasMedicalInfo,
                                hasPhysicalInfo,
                                isOnboardingComplete,
                                userDataKeys: Object.keys(userData || {}),
                                userData: userData
                            });
                            
                            const userProfile: UserProfile = { 
                                id: firebaseUser.uid, 
                                emailVerified: firebaseUser.emailVerified,
                                name: userData?.['full_name'] || userData?.['name'] || 'Utilizador',
                                email: userData?.['email'] || firebaseUser.email || '',
                                googleId: userData?.['google_id'] || userData?.['googleId'] || '',
                                onboardingCompleted: isOnboardingComplete,
                                biometricEnabled: userData?.['biometric_enabled'] || userData?.['biometricEnabled'] || false,
                                weight: userData?.['weight'] || null,
                                height: userData?.['height'] || null,
                                birthDate: userData?.['birth_date'] || userData?.['birthDate'] || '',
                                condition: userData?.['diabetes_condition'] || userData?.['condition'] || '',
                                restriction: userData?.['restriction'] || '',
                                glycemicGoals: userData?.['glycemic_goals'] || '',
                            };
                            
                            console.log('📋 Status do onboarding:', {
                                hasBasicInfo,
                                hasMedicalInfo,
                                hasPhysicalInfo,
                                explicitOnboardingFlag,
                                isOnboardingComplete,
                                userDataKeys: Object.keys(userData || {}),
                                userData: userData
                            });
                            
                            // ✅ CORREÇÃO: Não força onboarding completo automaticamente
                            // Deixa o usuário decidir quando completar o onboarding
                            console.log('📋 Status do onboarding:', {
                                hasBasicInfo,
                                hasMedicalInfo,
                                hasPhysicalInfo,
                                explicitOnboardingFlag,
                                isOnboardingComplete,
                                userDataKeys: Object.keys(userData || {}),
                                userData: userData
                            });
                            
                            console.log('🔐 Status da biometria:', userProfile.biometricEnabled);
                            setUser(userProfile);
                        } else {
                            console.log('🆕 Criando novo perfil para usuário');
                            // ✅ NOVO: Marca que NÃO existe conta cadastrada (primeira vez) e salva no AsyncStorage
                            setHasExistingAccount(false);
                            await AsyncStorage.setItem('hasExistingAccount', JSON.stringify(false));
                            console.log('💾 Estado de conta existente salvo: false');
                            
                            // Se for um novo utilizador (ex: primeiro login com Google), cria um perfil básico
                            const googleId = firebaseUser.providerData.find(p => p.providerId === 'google.com')?.uid;
                            const newUserProfile: UserProfile = {
                                id: firebaseUser.uid,
                                name: firebaseUser.displayName || 'Utilizador',
                                email: firebaseUser.email || '',
                                emailVerified: firebaseUser.emailVerified,
                                onboardingCompleted: false, // O fluxo de onboarding irá atualizar isto
                                biometricEnabled: false,
                            };
                            if (googleId) {
                                newUserProfile.googleId = googleId;
                            }
                            // ✅ CORREÇÃO: Salva este novo perfil na base de dados com campos corretos
                            const firestoreProfile = {
                                ...newUserProfile,
                                full_name: newUserProfile.name,
                                created_at: new Date().toISOString(),
                                provider: 'google',
                                email_verified: newUserProfile.emailVerified
                            };
                            await setDoc(userRef, firestoreProfile);
                            console.log('💾 Novo perfil salvo no Firestore');
                            setUser(newUserProfile);
                        }
                    } catch (firestoreError) {
                        console.error('❌ Erro ao acessar Firestore:', firestoreError);
                        // Fallback: cria perfil básico sem Firestore
                        const fallbackProfile: UserProfile = {
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || 'Utilizador',
                            email: firebaseUser.email || '',
                            emailVerified: firebaseUser.emailVerified,
                            onboardingCompleted: false,
                            biometricEnabled: false,
                        };
                        setUser(fallbackProfile);
                    }
                } else {
                    console.log('🚪 Usuário não autenticado');
                    setUser(null);
                    // ✅ CORREÇÃO: NÃO resetar hasExistingAccount no logout
                    // O estado deve persistir para controlar a visibilidade do botão Google
                }
            } catch (error) {
                console.error('❌ Erro geral no AuthContext:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async (idToken: string) => {
        setIsLoading(true);
        try {
            const credential = GoogleAuthProvider.credential(idToken);
            const result = await signInWithCredential(auth, credential);
            
            // ✅ NOVO: Salva credenciais para biometria (se disponível)
            if (result.user?.email) {
                try {
                    const AsyncStorage = require('@react-native-async-storage/async-storage');
                    await AsyncStorage.setItem('registered_email', result.user.email);
                    // Para Google, não temos senha, mas marcamos que biometria pode ser usada
                    await AsyncStorage.setItem('google_login_available', 'true');
                    console.log('💾 Credenciais Google salvas para biometria');
                } catch (secureStoreError) {
                    console.error('❌ Erro ao salvar credenciais Google:', secureStoreError);
                }
            }
        } catch (error) {
            console.error("Erro no login com Google (AuthContext):", error);
            setIsLoading(false);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error("Erro no login com E-mail (AuthContext):", error);
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            // ✅ NOVO: Limpa credenciais biométricas quando faz logout
            await SecureStore.deleteItemAsync('registered_email');
            await SecureStore.deleteItemAsync('saved_password');
            await SecureStore.deleteItemAsync('google_login_available');
            await SecureStore.deleteItemAsync('biometric_enabled');
            await SecureStore.setItemAsync('hasExistingAccount', 'false'); // Marca que não há conta existente
            console.log('🧹 Credenciais biométricas limpas no logout');
            
            // ✅ NOVO: Limpa dados do SQLite
            try {
                const { clearLocalData } = await import('../services/dbService');
                await clearLocalData();
                console.log('🗄️ Dados do SQLite limpos no logout');
            } catch (dbError) {
                console.error('❌ Erro ao limpar SQLite:', dbError);
                // Continua mesmo se houver erro na limpeza do banco
            }
            
            // Atualiza estado local
            setHasExistingAccount(false);
            setUser(null); // ✅ NOVO: Limpa estado do usuário
            
            await signOut(auth);
            console.log('✅ Logout realizado com sucesso');
        } catch (error) {
            console.error('❌ Erro durante logout:', error);
            // Continua com logout mesmo se houver erro na limpeza
            await signOut(auth);
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ NOVA FUNÇÃO: Atualizar biometria no Firestore
    const updateBiometricStatus = async (enabled: boolean) => {
        if (!user) return;
        
        try {
            const userRef = doc(db, 'users', user.id);
            await setDoc(userRef, { 
                biometric_enabled: enabled,
                updated_at: new Date().toISOString()
            }, { merge: true });
            
            console.log(`✅ Biometria ${enabled ? 'habilitada' : 'desabilitada'} no Firestore`);
            
            // Atualiza o contexto local
            setUser(prev => prev ? { ...prev, biometricEnabled: enabled } : null);
        } catch (error) {
            console.error('❌ Erro ao atualizar biometria no Firestore:', error);
        }
    };

    // ✅ NOVA FUNÇÃO: Atualiza o status de verificação do email
    const refreshUserEmailStatus = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.log('❌ Nenhum usuário autenticado para atualizar status do email');
                return;
            }

            // Recarrega os dados do usuário do Firebase para obter o status atualizado
            await reload(currentUser);
            
            console.log('📧 Status do email atualizado:', currentUser.emailVerified);
            
            // Atualiza o contexto com o novo status
            setUser(prev => prev ? { 
                ...prev, 
                emailVerified: currentUser.emailVerified 
            } : null);

            // Atualiza também no banco local
            if (user) {
                const { saveOrUpdateUser } = await import('../services/dbService');
                const updatedProfile = { ...user, emailVerified: currentUser.emailVerified };
                await saveOrUpdateUser(updatedProfile);
                console.log('✅ Status do email atualizado no banco local');
            }

            // Salva o status no AsyncStorage para uso local
            await AsyncStorage.setItem('isEmailVerified', currentUser.emailVerified.toString());
            
            return currentUser.emailVerified;
        } catch (error) {
            console.error('❌ Erro ao atualizar status do email:', error);
            throw error;
        }
    };

    // ✅ NOVA FUNÇÃO: Recarrega dados do usuário do banco local
    const refreshUserProfile = async () => {
        try {
            console.log('🔄 Recarregando dados do usuário do banco local...');
            const { getUser } = await import('../services/dbService');
            const localUser = await getUser();
            
            if (localUser) {
                console.log('✅ Dados locais carregados:', localUser);
                
                // Garante que o emailVerified seja atualizado também
                const currentUser = auth.currentUser;
                if (currentUser) {
                    await reload(currentUser);
                    localUser.emailVerified = currentUser.emailVerified;
                }
                
                setUser(localUser);
                return localUser;
            } else {
                console.log('❌ Nenhum usuário encontrado no banco local');
                return null;
            }
        } catch (error) {
            console.error('❌ Erro ao recarregar dados do usuário:', error);
            throw error;
        }
    };

    const value = {
        user,
        isLoading,
        hasExistingAccount, // ✅ NOVO: Exporta estado de conta existente
        signInWithGoogle,
        loginWithEmail,
        logout,
        setUser,
        updateBiometricStatus, // ✅ NOVA FUNÇÃO EXPORTADA
        refreshUserEmailStatus, // ✅ NOVA FUNÇÃO: Atualiza status do email
        refreshUserProfile, // ✅ NOVA FUNÇÃO: Recarrega dados do usuário
    };

    return (
        <AuthContext.Provider value={value}>
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
