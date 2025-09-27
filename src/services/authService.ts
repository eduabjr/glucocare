import * as WebBrowser from 'expo-web-browser';

// Criando uma classe nomeada
class AuthService {
  // Tornando a função ensureCodeIsSetupAsync privada para evitar o erro
  private ensureCodeIsSetupAsync() {
    // Lógica da função
    console.log('Configurando o código...');
  }

  // Método público que pode ser chamado externamente
  public setupAsync() {
    this.ensureCodeIsSetupAsync(); // Chama a função privada internamente
  }
}

// Exportando a instância da classe AuthService
export const authService = new AuthService();

// Função principal de autenticação com Google
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import Constants from "expo-constants";

// Necessário para completar a sessão de autenticação
WebBrowser.maybeCompleteAuthSession();

interface AuthenticationResponse {
  accessToken: string;
}

interface AuthError {
  message: string;
  code?: string;
  description?: string; // Para descrição mais detalhada do erro
}

export function useGoogleAuth() {
  // Estado para controlar o token de acesso
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<AuthError | null>(null);  // Estado para erros com informações adicionais

  // Tipos de request, response e promptAsync
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: Constants.expoConfig?.extra?.['expoClientId'],  // Usando a notação de índice
    iosClientId: Constants.expoConfig?.extra?.['iosClientId'],    // Usando a notação de índice
    androidClientId: Constants.expoConfig?.extra?.['androidClientId'],  // Usando a notação de índice
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;

      // Verificando a estrutura de authentication para garantir que o accessToken esteja presente
      if (authentication && authentication.accessToken) {
        const auth: AuthenticationResponse = authentication;
        setAccessToken(auth.accessToken);  // Armazenar o accessToken no estado
        console.log("Google AccessToken:", auth.accessToken);
        setError(null); // Limpar erro anterior, se houver
      } else {
        setError({
          message: "Access token não encontrado na resposta.",
          description: "A resposta não contém um access token válido.",
        });
      }
    } else if (response?.type === "error") {
      // Se houver um erro, armazenar a mensagem de erro com informações adicionais
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

  return { request, response, promptAsync, accessToken, error };
}
