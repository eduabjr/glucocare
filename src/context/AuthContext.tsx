import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase'; // ✨ ADICIONADO: Importar 'db' do Firebase
import { doc, getDoc, setDoc } from 'firebase/firestore'; // ✨ ADICIONADO: Funções do Firestore

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
    syncedAt?: string | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            if (firebaseUser) {
                // ✨ ATUALIZAÇÃO: Lógica para carregar ou criar o perfil no Firestore
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    // Se o utilizador já existe na base de dados, carrega o perfil completo
                    const userData = userDoc.data();
                    setUser({ 
                        id: firebaseUser.uid, 
                        emailVerified: firebaseUser.emailVerified, // ADICIONADO: emailVerified
                        name: userData?.['name'] || 'Utilizador',
                        email: userData?.['email'] || firebaseUser.email || '',
                        googleId: userData?.['googleId'] || '',
                        onboardingCompleted: userData?.['onboardingCompleted'] || false,
                        biometricEnabled: userData?.['biometricEnabled'] || false,
                        weight: userData?.['weight'] || null,
                        height: userData?.['height'] || null,
                        birthDate: userData?.['birthDate'] || '',
                        condition: userData?.['condition'] || '',
                        restriction: userData?.['restriction'] || '',
                        syncedAt: userData?.['syncedAt'] || null,
                    } as UserProfile);
                } else {
                    // Se for um novo utilizador (ex: primeiro login com Google), cria um perfil básico
                    const googleId = firebaseUser.providerData.find(p => p.providerId === 'google.com')?.uid;
                    const newUserProfile: UserProfile = {
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || 'Utilizador',
                        email: firebaseUser.email || '',
                        emailVerified: firebaseUser.emailVerified, // ADICIONADO: emailVerified
                        onboardingCompleted: false, // O fluxo de onboarding irá atualizar isto
                    };
                    if (googleId) {
                        newUserProfile.googleId = googleId;
                    }
                    // Salva este novo perfil na base de dados
                    await setDoc(userRef, newUserProfile);
                    setUser(newUserProfile);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
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

    const value = {
        user,
        isLoading,
        signInWithGoogle,
        loginWithEmail,
        logout,
        setUser,
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
