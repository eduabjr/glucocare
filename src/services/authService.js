// src/services/authService.js
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: Constants.expoConfig.extra.expoClientId,
    iosClientId: Constants.expoConfig.extra.iosClientId,
    androidClientId: Constants.expoConfig.extra.androidClientId,
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      console.log("Google AccessToken:", authentication.accessToken);
    }
  }, [response]);

  return { request, response, promptAsync };
}