import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import Constants from "expo-constants";

// Necessário para completar a sessão de autenticação
WebBrowser.maybeCompleteAuthSession();

interface AuthenticationResponse {
  accessToken: string;
}

export function useGoogleAuth() {
  // Tipos de request, response e promptAsync
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: Constants.expoConfig?.extra?.expoClientId,  // Verificação de nullidade
    iosClientId: Constants.expoConfig?.extra?.iosClientId,  // Verificação de nullidade
    androidClientId: Constants.expoConfig?.extra?.androidClientId,  // Verificação de nullidade
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;

      if (authentication) {  // Verificar se authentication não é null
        const auth: AuthenticationResponse = authentication;
        console.log("Google AccessToken:", auth.accessToken);
      }
    }
  }, [response]);

  return { request, response, promptAsync };
}
