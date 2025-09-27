// App.js
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // 🔹 IMPORTANTE
import * as SecureStore from 'expo-secure-store';

import AuthStack from './src/navigation/AuthStack';
import DrawerRoutes from './src/navigation/DrawerRoutes';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedProfile = await SecureStore.getItemAsync('user_profile');
        const token = await SecureStore.getItemAsync('google_token');
        setIsLoggedIn(!!storedProfile || !!token);
      } catch (err) {
        console.error("Erro ao verificar login:", err);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.text}>Carregando...</Text>
      </View>
    );
  }

  return (
    // 🔹 Agora o app inteiro está dentro do SafeAreaProvider
    <SafeAreaProvider>
      <NavigationContainer>
        {isLoggedIn ? <DrawerRoutes /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
