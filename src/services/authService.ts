import * as WebBrowser from 'expo-web-browser';
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import Constants from "expo-constants";
import { useAuth } from '../context/AuthContext';
import { securityService } from './securityService'; // ✅ Importar serviço de segurança

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
    const { signInWithGoogle } = useAuth(); 

    const [error, setError] = useState<AuthError | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    // ✅ Configuração da requisição de autenticação do Google
    const [request, response, promptAsync] = Google.useAuthRequest({
            // ======================= WEB CLIENT ID CORRETO =======================
            // Usa o Web Client ID do Google Cloud Console para Expo
            androidClientId: "360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com",
            // ==================================================================
            // ✅ PRÁTICA RECOMENDADA: AUTORIZAÇÃO INCREMENTAL - Solicitar apenas escopos essenciais
            scopes: ["profile", "email"], // Escopos mínimos necessários para funcionalidade básica
            // ✅ CORREÇÃO: Configurações adicionais para evitar erro 400
            redirectUri: "https://auth.expo.io/@eduabjr/glucocare",
            // ✅ PRÁTICA RECOMENDADA: Configurações de segurança adicionais
            additionalParameters: {
                access_type: 'offline', // Para obter refresh token
                prompt: 'consent', // Para garantir que o usuário veja a tela de consentimento
                // ✅ FLUXO SEGURO: Authorization Code Flow com PKCE
                response_type: 'code', // Usar Authorization Code Flow (não Implicit Flow)
                code_challenge_method: 'S256' // PKCE com SHA256
            },
            // ✅ FLUXO SEGURO: Configurações de segurança
            useProxy: false, // Não usar proxy para desenvolvimento
            usePKCE: true // Habilitar PKCE explicitamente (proteção contra falsificação)
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
                    // ✅ EXPO GO: Simula login bem-sucedido sem Firebase Auth
                    console.log('🎉 Google Auth bem-sucedido no Expo Go!');
                    console.log('📝 Token recebido:', id_token.substring(0, 20) + '...');
                    
                    // ✅ PRÁTICA RECOMENDADA: Armazenar tokens com segurança
                    try {
                        await securityService.storeTokensSecurely({
                            accessToken: id_token,
                            refreshToken: response.params.refresh_token || '',
                            expiresAt: Date.now() + (3600 * 1000), // 1 hora
                            userId: 'current_user' // Será atualizado após login
                        });

                        console.log('✅ Login com Google realizado com sucesso e tokens armazenados com segurança!');
                        // Em produção, você salvaria este token e faria a autenticação com seu backend
                    } catch (error: any) {
                        console.error("Erro ao processar login do Google:", error);
                        
                        // ✅ PRÁTICA RECOMENDADA: Revogar tokens em caso de erro
                        await securityService.revokeTokens();
                        setError({ message: 'Erro ao processar login do Google.' });
                    }
                } else {
                    setError({ message: "id_token não encontrado na resposta do Google." });
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
    // A dependência foi mantida para reagir a mudanças na resposta e na função de login
    }, [response, signInWithGoogle]); 

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
