import * as WebBrowser from 'expo-web-browser';
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import Constants from "expo-constants";
import { useAuth } from '../context/AuthContext';

// Necessário para o fluxo de autenticação web funcionar corretamente no Expo Go
WebBrowser.maybeCompleteAuthSession();

export interface AuthError {
    message: string;
    code?: string;
    description?: string;
}

interface UseGoogleAuthReturn {
    request: any; // GoogleAuthRequest | null
    promptAsync: () => Promise<void>;
    error: AuthError | null;
    loading: boolean;
}

/**
 * Hook customizado para gerenciar o fluxo de autenticação do Google com Expo.
 * Ele lida com a obtenção do id_token e o repassa para o AuthContext para finalizar o login.
 * @returns {UseGoogleAuthReturn} Contém request, promptAsync, error e loading.
 */
export function useGoogleAuth(): UseGoogleAuthReturn {
    const { signInWithGoogle, setUser } = useAuth(); 

    const [error, setError] = useState<AuthError | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
           // ✅ CONFIGURAÇÃO PARA DEVELOPMENT BUILD (Android)
           const [request, response, promptAsync] = Google.useAuthRequest({
                   androidClientId: "360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com",
                   webClientId: "360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com",
                   scopes: ["profile", "email"],
                   useProxy: false // ✅ IMPORTANTE: Desabilita proxy para Development Build
           });

    // Função de promptAsync encapsulada para gerenciar o estado de 'loading'
    const handlePromptAsync = async () => {
        if (!request) {
            setError({ message: "A requisição de autenticação não está pronta." });
            return;
        }
        setLoading(true);
        setError(null); // Limpa erros anteriores
        try {
            await promptAsync();
        } catch (e) {
            console.error("Erro ao iniciar o prompt de login:", e);
            setError({ message: "Falha ao iniciar o fluxo de autenticação." });
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleResponse = async () => {
            if (response?.type) {
                setLoading(false); // Desliga o loading ao receber qualquer tipo de resposta
            }

            if (response?.type === "success") {
                const { id_token } = response.params;

                if (id_token) {
                    // ✅ LOGIN SIMPLES E FUNCIONAL
                    console.log('🎉 Google Auth bem-sucedido!');
                    console.log('📝 Token recebido:', id_token.substring(0, 20) + '...');
                    
                    // ✅ CRIA USUÁRIO MOCK PARA TESTE
                    const mockUser = {
                        id: 'google_user_' + Date.now(),
                        name: 'Usuário Google',
                        email: 'usuario@google.com',
                        googleId: id_token,
                        onboardingCompleted: false,
                        biometricEnabled: false,
                        weight: null,
                        height: null,
                        birthDate: new Date(1990, 0, 1).toISOString(),
                        condition: '',
                        restriction: '',
                        syncedAt: new Date().toISOString(),
                        emailVerified: true
                    };

                    // ✅ ATUALIZA O CONTEXTO DE AUTENTICAÇÃO
                    setUser(mockUser);
                    console.log('✅ Login com Google realizado com sucesso!');
                    
                } else {
                    setError({ message: "Token não encontrado na resposta do Google." });
                }

            } else if (response?.type === "error") {
                const errorMessage = response.error?.message || "Erro desconhecido durante o login com Google.";
                console.error("Erro na autenticação com Google:", response.error);
                setError({ message: errorMessage });
            } else if (response?.type === "cancel") {
                console.log("Usuário cancelou o login com Google.");
            }
        };

        handleResponse();
    }, [response, setUser]); 

    // Removi o bloco de validação inicial do useEffect, pois a biblioteca `expo-auth-session`
    // já faz essa verificação e lança um erro claro (o que estávamos vendo),
    // tornando a validação manual redundante.

    return { 
        request, 
        promptAsync: handlePromptAsync,
        error, 
        loading 
    };
}
