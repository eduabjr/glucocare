import * as WebBrowser from 'expo-web-browser';
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import Constants from "expo-constants";
import { useAuth } from '../context/AuthContext'; // Garanta que o caminho para seu AuthContext está correto

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
    
    // Configuração da requisição de autenticação do Google
    const [request, response, promptAsync] = Google.useAuthRequest({
        // ======================= CORREÇÃO PRINCIPAL =======================
        // Usa clientId para o Expo Client ID conforme sugerido pelo TypeScript
        // Os nomes das chaves agora correspondem exatamente ao que está no app.json
        clientId: Constants.expoConfig?.extra?.['expoClientId'],
        iosClientId: Constants.expoConfig?.extra?.['iosClientId'],
        androidClientId: Constants.expoConfig?.extra?.['androidClientId'],
        webClientId: Constants.expoConfig?.extra?.['webClientId'], // Opcional, mas bom ter
        // ==================================================================
        scopes: ["profile", "email"],
        // ✅ CORREÇÃO: Configurações adicionais para evitar erro 400
        redirectUri: "https://auth.expo.io/@eduabjr/glucocare"
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
                    if (typeof signInWithGoogle === 'function') {
                        try {
                            await signInWithGoogle(id_token);
                        } catch (authError: any) {
                             console.error("Erro ao fazer login com credenciais do Google no Firebase:", authError);
                             setError({ message: authError.message || 'Falha ao logar com o Google.' });
                        }
                    } else {
                        const contextError = "A função 'signInWithGoogle' não foi encontrada no AuthContext.";
                        console.error(contextError);
                        setError({ message: contextError });
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
