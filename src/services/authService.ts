import * as WebBrowser from 'expo-web-browser';
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import Constants from "expo-constants";
// REMOVIDO: import { AuthRequest } from 'expo-auth-session'; // TS6133: Variável não utilizada

// Necessário para completar a sessão de autenticação
WebBrowser.maybeCompleteAuthSession();

// ----------------------------------------------------
// AuthService - Abordagem Funcional (Contorno para TS4094)
// ----------------------------------------------------

/**
 * Função interna que antes era o método privado.
 */
function ensureCodeIsSetupAsync() {
    console.log('Configurando o código...');
}

/**
 * Serviço de Autenticação exposto como um objeto simples (Singleton Funcional).
 * Isso elimina os problemas de tipagem de classes anônimas exportadas.
 */
export const authService = {
    // Este é o método público que será chamado externamente.
    setupAsync() {
        ensureCodeIsSetupAsync(); // Chama a função interna
    },
};

// ----------------------------------------------------
// Google Auth Hook
// ----------------------------------------------------
interface AuthenticationResponse {
    accessToken: string;
}

export interface AuthError {
    message: string;
    code?: string;
    description?: string;
}

/**
 * Hook customizado para gerenciar o fluxo de autenticação do Google com Expo.
 * @returns {object} Contém request, response, promptAsync, accessToken, error e loading.
 */
export function useGoogleAuth() {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<AuthError | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    // O tipo retornado para 'request' é GoogleAuthRequest
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: Constants.expoConfig?.extra?.['expoClientId'],
        iosClientId: Constants.expoConfig?.extra?.['iosClientId'],
        androidClientId: Constants.expoConfig?.extra?.['androidClientId'],
        scopes: ["profile", "email"],
    });

    // Função de promptAsync ajustada para gerenciar o estado de loading
    const handlePromptAsync = async () => {
        if (!request) {
            setError({ message: "Requisição de autenticação não está pronta." });
            return;
        }
        setLoading(true);
        try {
            // Chama o prompt real
            await promptAsync();
            // O estado de loading será resetado no useEffect quando a 'response' for recebida
        } catch (e) {
            console.error("Erro ao iniciar prompt:", e);
            setError({ message: "Falha ao iniciar o fluxo de autenticação." });
            setLoading(false);
        }
    }


    useEffect(() => {
        // Verifica a configuração inicial
        if (!Constants.expoConfig?.extra) {
            setError({ message: "Configuração do Expo (expoClientId, etc.) não encontrada no app.json/app.config.js" });
            setLoading(false);
            return;
        }

        if (response?.type) {
            setLoading(false); // Sempre desliga o loading quando há uma resposta
        }
        
        if (response?.type === "success") {
            const { authentication } = response;
            if (authentication?.accessToken) {
                const auth: AuthenticationResponse = authentication;
                setAccessToken(auth.accessToken);
                console.log("Google AccessToken:", auth.accessToken);
                setError(null);
            } else {
                setError({
                    message: "Access token não encontrado na resposta.",
                    description: "A resposta não contém um access token válido.",
                });
            }
        } else if (response?.type === "error") {
            const errorMessage = response.error?.message || "Erro desconhecido";
            const errorCode = response.error?.code || "Desconhecido";
            const errorDescription = response.error?.description || "Sem descrição adicional.";

            setError({
                message: errorMessage,
                code: errorCode,
                description: errorDescription,
            });

            console.error("Erro na autenticação:", errorMessage, "Código:", errorCode, "Descrição:", errorDescription);
        }
    }, [response]);

    return { 
        request, 
        response, 
        promptAsync: handlePromptAsync, // Retorna a função ajustada
        accessToken, 
        error, 
        loading 
    };
}
