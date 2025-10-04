import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase'; // ✨ ADICIONADO: Importar 'db' do Firebase
import { doc, getDoc, setDoc } from 'firebase/firestore'; // ✨ ADICIONADO: Funções do Firestore
import { initDB } from '../services/dbService'; // ✨ ADICIONADO: Importar initDB

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
    updated_at?: string;
    pending_sync?: boolean;
    emailVerified?: boolean; // ADICIONADO: emailVerified
}

// Interface do Contexto
interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    signInWithGoogle: (idToken: string) => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    updateBiometricStatus: (enabled: boolean) => Promise<void>; // ✅ NOVA FUNÇÃO
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialize database on app start
        const initializeApp = async () => {
            try {
                await initDB();
                console.log('Database initialized successfully');
                
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
                            
                            const userProfile: UserProfile = { 
                                id: firebaseUser.uid, 
                                emailVerified: firebaseUser.emailVerified,
                                name: userData?.['full_name'] || userData?.['name'] || 'Utilizador',
                                email: userData?.['email'] || firebaseUser.email || '',
                                googleId: userData?.['google_id'] || userData?.['googleId'] || '',
                                onboardingCompleted: userData?.['onboarding_completed'] || userData?.['onboardingCompleted'] || false,
                                biometricEnabled: userData?.['biometric_enabled'] || userData?.['biometricEnabled'] || false,
                                weight: userData?.['weight'] || null,
                                height: userData?.['height'] || null,
                                birthDate: userData?.['birth_date'] || userData?.['birthDate'] || '',
                                condition: userData?.['diabetes_condition'] || userData?.['condition'] || '',
                                restriction: userData?.['restriction'] || '',
                            };
                            
                            console.log('🔐 Status da biometria:', userProfile.biometricEnabled);
                            setUser(userProfile);
                        } else {
                            console.log('🆕 Criando novo perfil para usuário');
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
            await signInWithCredential(auth, credential);
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
        await signOut(auth);
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

    const value = {
        user,
        isLoading,
        signInWithGoogle,
        loginWithEmail,
        logout,
        setUser,
        updateBiometricStatus, // ✅ NOVA FUNÇÃO EXPORTADA
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
