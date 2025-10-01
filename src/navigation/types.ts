import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ========================================================================
// 1. DEFINIÇÃO DAS LISTAS DE PARÂMETROS (PARAM LISTS)
// ========================================================================

/**
 * @description Telas acessíveis ANTES da autenticação.
 * Corresponde ao seu AuthNavigator.tsx.
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  // Telas de onboarding (pós-registro, mas antes de entrar no app principal)
  ProfileSetup: undefined;
  BiometricSetup: undefined;
};

/**
 * @description Telas acessíveis APÓS a autenticação, dentro da gaveta (Drawer).
 * Corresponde ao seu AppNavigator.tsx.
 */
export type AppDrawerParamList = {
  Dashboard: undefined;
  AddReading: undefined;
  DeviceConnection: undefined;
  Charts: undefined;
  Nutrition: undefined;
  Settings: undefined;
  ProfileSetup: undefined; // Para visualizar/editar o perfil já logado
  Report: undefined;
};

/**
 * @description O navegador raiz que decide entre o fluxo de Auth e o fluxo do App.
 * Corresponde ao seu RootNavigator.tsx.
 * Usamos NavigatorScreenParams para aninhar os tipos de outros navegadores.
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppDrawerParamList>;
};

// ========================================================================
// 2. TIPOS DE PROPS GENÉRICOS PARA AS TELAS
// ========================================================================

/**
 * @description Tipo genérico para qualquer tela DENTRO do fluxo de autenticação.
 * Substitui a necessidade de criar LoginScreenNavigationProps, RegisterScreenProps, etc.
 * 
 * @example
 * // No seu componente de tela:
 * const LoginScreen = ({ navigation }: AuthScreenProps<'Login'>) => { ... };
 */
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;

/**
 * @description Tipo genérico para qualquer tela DENTRO do Drawer (fluxo principal do app).
 * Combina as props do Drawer com as do Stack raiz para navegação completa.
 * 
 * @example
 * // No seu componente de tela:
 * const DashboardScreen = ({ navigation }: AppScreenProps<'Dashboard'>) => { ... };
 */
export type AppScreenProps<T extends keyof AppDrawerParamList> = CompositeScreenProps<
  DrawerScreenProps<AppDrawerParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
