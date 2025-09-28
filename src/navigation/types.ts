import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';

// ----------------------
// 1. ROTAS DO DRAWER (Gaveta)
// ----------------------

/**
 * Tipagem para o Drawer Navigator. Estas são as telas principais do aplicativo
 * após a autenticação/onboarding.
 */
export type DrawerParamList = {
    Home: undefined;
    Readings: undefined; // Lista de registros de glicemia
    Graphs: undefined;   // Visualização de gráficos
    Settings: undefined; // Configurações gerais
    Profile: undefined;  // Visualização e edição do perfil (pode ser acessada pelo Drawer)
};

// ----------------------
// 2. ROTAS PRINCIPAIS (Stack)
// ----------------------

/**
 * Tipagem completa de todas as rotas do seu Stack Navigator (Root Stack).
 * DrawerRoutes leva à navegação principal.
 */
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    BiometricSetup: undefined;
    ProfileSetup: undefined;
    // Rota que contém o Drawer Navigator (o fluxo principal)
    DrawerRoutes: undefined; 
};

// ----------------------
// 3. TIPOS DE PROPS DE TELA
// ----------------------

// Tipagem para as telas do Stack Navigator
export type LoginScreenNavigationProps = NativeStackScreenProps<
    RootStackParamList,
    'Login'
>;

export type ProfileSetupScreenNavigationProps = NativeStackScreenProps<
    RootStackParamList,
    'ProfileSetup'
>;


// Tipagem para as telas dentro do Drawer Navigator
// Usa CompositeScreenProps para combinar as props do Drawer com as props do Stack pai.
export type HomeScreenNavigationProps = CompositeScreenProps<
    DrawerScreenProps<DrawerParamList, 'Home'>,
    NativeStackScreenProps<RootStackParamList>
>;

export type SettingsScreenNavigationProps = CompositeScreenProps<
    DrawerScreenProps<DrawerParamList, 'Settings'>,
    NativeStackScreenProps<RootStackParamList>
>;

// Adicione aqui outros tipos conforme necessário (ReadingsScreenProps, GraphsScreenProps, etc.)
