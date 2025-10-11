import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  console.log('🔥 App.tsx carregado com sucesso!');
  
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}