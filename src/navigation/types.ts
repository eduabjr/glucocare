// src/navigation/types.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Tipagem completa de todas as rotas do seu Stack Navigator
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    BiometricSetup: undefined;
    ProfileSetup: undefined;
    DrawerRoutes: undefined;
};

// Tipagem de LoginScreen com props de navegação
export type LoginScreenNavigationProps = NativeStackScreenProps<
    RootStackParamList,
    'Login'
>;