import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

// Telas de autenticação
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';  // Tela de senha esquecida
import BiometricSetupScreen from '../screens/BiometricSetupScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DrawerRoutes from './DrawerRoutes';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const checkProfileStatus = async () => {
      const profileStatus = await SecureStore.getItemAsync('profileComplete');
      setIsProfileComplete(!!profileStatus); // Se já houver um status, significa que o perfil foi configurado
    };

    checkProfileStatus();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Fluxo de autenticação */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      
      {/* Tela de senha esquecida, isolada */}
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      {/* Configuração inicial, renderiza apenas se o perfil não estiver completo */}
      {!isProfileComplete ? (
        <>
          <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </>
      ) : null}

      {/* App principal */}
      <Stack.Screen name="DrawerRoutes" component={DrawerRoutes} />
    </Stack.Navigator>
  );
}
