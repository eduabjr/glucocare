import { createContext, useState, useContext, ReactNode, useEffect } from 'react'; // Removeu a importação desnecessária do React
import * as SecureStore from 'expo-secure-store';

// Definindo o tipo do contexto
interface AuthContextType {
  logout: () => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
}

// Criando o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Recuperando o status de autenticação do SecureStore (ou qualquer outro método persistente)
  useEffect(() => {
    const checkAuthentication = async () => {
      const storedProfile = await SecureStore.getItemAsync('user_profile');
      setIsAuthenticated(!!storedProfile); // Simulando que o usuário está autenticado se houver um perfil armazenado
    };

    checkAuthentication();
  }, []);

  // Função de logout
  const logout = async () => {
    setIsAuthenticated(false); // Deslogar o usuário
    await SecureStore.deleteItemAsync('user_profile'); // Remover dados do usuário
  };

  return (
    <AuthContext.Provider value={{ logout, isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para consumir o contexto
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
