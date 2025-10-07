import { useEffect, useState, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';

// ✨ PASSO 1: Importe 'useAuth' e 'UserProfile'
import { useAuth, UserProfile } from '../context/AuthContext'; 
import { ThemeContext } from '../context/ThemeContext';

type BiometricSetupScreenProps = {
    navigation: { replace: (screen: string, params?: object) => void };
};

export default function BiometricSetupScreen({ navigation: _navigation }: BiometricSetupScreenProps) {
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);

    const [supported, setSupported] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    
    // ✨ PASSO 2: Obtenha a função 'setUser' do AuthContext
    const { setUser, updateBiometricStatus } = useAuth();

    useEffect(() => {
        (async () => {
            const isSupported = await LocalAuthentication.hasHardwareAsync() && await LocalAuthentication.isEnrolledAsync();
            setSupported(isSupported);
        })();
    }, []);

    // ✨ PASSO 3: Função para finalizar o setup e ATUALIZAR o utilizador no contexto
    const completeSetup = async () => {
        try {
            // Busca o perfil que foi guardado no passo anterior (ex: ProfileSetup)
            const profileString = await SecureStore.getItemAsync('user_profile');

            if (!profileString) {
                Alert.alert('Erro Crítico', 'Não foi possível encontrar o perfil do utilizador. Por favor, reinicie a aplicação.');
                return;
            }
            
            const userProfile: UserProfile = JSON.parse(profileString);

            // ✅ CORREÇÃO: Marca o onboarding como completo
            const completedProfile: UserProfile = {
                ...userProfile,
                onboardingCompleted: true,
                updated_at: new Date().toISOString(),
                pending_sync: true,
            };

            // ✅ CORREÇÃO: Salva o perfil atualizado no SecureStore
            await SecureStore.setItemAsync('user_profile', JSON.stringify(completedProfile));

            // ✅ NOVA CORREÇÃO: Salva também no banco SQLite local
            try {
                const { saveOrUpdateUser } = await import('../services/dbService');
                await saveOrUpdateUser(completedProfile);
                console.log('✅ Perfil salvo no banco SQLite local');
            } catch (dbError) {
                console.error('❌ Erro ao salvar perfil no banco local:', dbError);
            }

            // ✅ CORREÇÃO: Sincroniza com o Firestore
            try {
                const { doc, setDoc } = await import('firebase/firestore');
                const { db } = await import('../config/firebase');
                
                const userRef = doc(db, 'users', completedProfile.id);
                const firestoreData = {
                    full_name: completedProfile.name,
                    email: completedProfile.email,
                    onboarding_completed: true, // ✅ FORÇA PARA TRUE
                    biometric_enabled: completedProfile.biometricEnabled,
                    weight: completedProfile.weight,
                    height: completedProfile.height,
                    birth_date: completedProfile.birthDate,
                    diabetes_condition: completedProfile.condition,
                    restriction: completedProfile.restriction,
                    glycemic_goals: completedProfile.glycemicGoals,
                    updated_at: completedProfile.updated_at,
                    provider: 'manual'
                };
                
                await setDoc(userRef, firestoreData, { merge: true });
                console.log('✅ Perfil sincronizado com Firestore após completar onboarding - onboarding_completed: true');
            } catch (syncError) {
                console.error('❌ Erro ao sincronizar perfil com Firestore:', syncError);
                // Continua mesmo se a sincronização falhar
            }

            // A mágica acontece aqui!
            // Chamamos a função setUser do contexto, que vai atualizar o estado global
            // e fazer o RootNavigator mostrar o Drawer da aplicação.
            setUser(completedProfile);

        } catch (error) {
            console.error("Erro ao finalizar o setup:", error);
            Alert.alert('Erro', 'Ocorreu um problema ao finalizar o seu cadastro.');
        }
    };

    const enableBiometric = async () => {
        setLoading(true);
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirme a sua biometria para ativar',
            });

            if (result.success) {
                await SecureStore.setItemAsync('biometric_enabled', 'true');
                
                // ✅ CORREÇÃO: Atualiza o perfil com biometria habilitada
                const profileString = await SecureStore.getItemAsync('user_profile');
                if (profileString) {
                    const userProfile: UserProfile = JSON.parse(profileString);
                    const updatedProfile: UserProfile = {
                        ...userProfile,
                        biometricEnabled: true,
                        updated_at: new Date().toISOString(),
                        pending_sync: true,
                    };
                    await SecureStore.setItemAsync('user_profile', JSON.stringify(updatedProfile));
                    
                    // ✅ NOVA CORREÇÃO: Salva também no banco SQLite local
                    try {
                        const { saveOrUpdateUser } = await import('../services/dbService');
                        await saveOrUpdateUser(updatedProfile);
                        console.log('✅ Perfil com biometria salvo no banco SQLite local');
                    } catch (dbError) {
                        console.error('❌ Erro ao salvar perfil com biometria no banco local:', dbError);
                    }
                    
                    // ✅ NOVA CORREÇÃO: Atualiza biometria no Firestore
                    await updateBiometricStatus(true);
                }
                
                Alert.alert('Sucesso', 'Biometria ativada com sucesso!');
                
                // ✨ PASSO 4: Chama a nova função para finalizar
                await completeSetup();
            } else {
                Alert.alert('Falha', 'Não foi possível autenticar a sua biometria.');
            }
        } catch (err) {
            console.error('enableBiometric - erro:', err);
            Alert.alert('Erro', 'Problema ao configurar biometria.');
        } finally {
            setLoading(false);
        }
    };

    const skipBiometric = async () => {
        setLoading(true);
        try {
            await SecureStore.setItemAsync('biometric_enabled', 'false');
            
            // ✅ CORREÇÃO: Atualiza o perfil com biometria desabilitada
            const profileString = await SecureStore.getItemAsync('user_profile');
            if (profileString) {
                const userProfile: UserProfile = JSON.parse(profileString);
                const updatedProfile: UserProfile = {
                    ...userProfile,
                    biometricEnabled: false,
                    updated_at: new Date().toISOString(),
                    pending_sync: true,
                };
                await SecureStore.setItemAsync('user_profile', JSON.stringify(updatedProfile));
                
                // ✅ NOVA CORREÇÃO: Salva também no banco SQLite local
                try {
                    const { saveOrUpdateUser } = await import('../services/dbService');
                    await saveOrUpdateUser(updatedProfile);
                    console.log('✅ Perfil com biometria desabilitada salvo no banco SQLite local');
                } catch (dbError) {
                    console.error('❌ Erro ao salvar perfil com biometria desabilitada no banco local:', dbError);
                }
                
                // ✅ NOVA CORREÇÃO: Atualiza biometria no Firestore
                await updateBiometricStatus(false);
            }
            
            // ✨ PASSO 5: Chama a nova função aqui também
            await completeSetup();
        } catch (error) {
            console.error('Erro ao pular biometria:', error);
            Alert.alert('Erro', 'Ocorreu um problema ao pular a configuração de biometria.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <MaterialIcons name="fingerprint" size={90} color={theme.primary} style={styles.icon} />

                <Text style={styles.title}>Configurar Biometria</Text>
                <Text style={styles.subtitle}>Proteja os seus dados com segurança extra</Text>

                {supported ? (
                    <View style={styles.card}>
                        <Text style={styles.question}>Deseja habilitar a biometria?</Text>
                        
                        <View style={styles.optionGreen}>
                            <Text style={styles.optionTitle}>🔒 Maior Segurança</Text>
                            <Text style={styles.optionDesc}>
                                Os seus dados médicos ficarão protegidos por biometria.
                            </Text>
                        </View>
                        <View style={styles.optionBlue}>
                            <Text style={styles.optionTitle}>⚡ Acesso Rápido</Text>
                            <Text style={styles.optionDesc}>
                                Entre na app de forma rápida e segura.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.actionButtonWrapper}
                            onPress={enableBiometric}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#ecfdf5', '#d1fae5']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.enableButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#059669" />
                                ) : (
                                    <Text style={styles.enableText}>Habilitar Biometria →</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButtonWrapper} onPress={skipBiometric} disabled={loading}>
                            <LinearGradient
                                colors={['#fef2f2', '#fee2e2']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.skipButton}
                            >
                                <Text style={styles.skipText}>✕ Pular por Agora</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.warning}>
                            O seu dispositivo não suporta autenticação biométrica.
                        </Text>
                        <TouchableOpacity style={styles.actionButtonWrapper} onPress={skipBiometric} disabled={loading}>
                            <LinearGradient
                                colors={['#fef2f2', '#fee2e2']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.skipButton}
                            >
                                <Text style={styles.skipText}>Continuar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.footer}>
                    Você pode alterar essa configuração a qualquer momento em{"\n"}
                    <Text style={{ fontWeight: '600', color: theme.primary }}>Configurações</Text>.
                </Text>
            </View>
        </SafeAreaView>
    );
}

// Estilos
const getStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    container: { flex: 1, padding: 24, alignItems: 'center' },
    icon: { marginTop: 40, marginBottom: 20 },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: { fontSize: 14, color: theme.secundaryText, marginBottom: 20, textAlign: 'center' },
    card: {
        width: '100%',
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    question: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: theme.text },
    optionGreen: {
        width: '100%',
        backgroundColor: theme.accent + '20',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    optionBlue: { 
        width: '100%',
        backgroundColor: theme.primary + '20', 
        padding: 12, 
        borderRadius: 10 
    },
    optionTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
    optionDesc: { fontSize: 13, color: theme.secundaryText, marginTop: 2 },
    actionButtonWrapper: {
        width: '100%',
        marginTop: 18,
        marginBottom: 12,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },
    enableButton: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    enableText: { color: '#059669', fontSize: 16, fontWeight: '700' },
    skipButton: {
        width: '100%',
        borderWidth: 1,
        borderColor: theme.secundaryText,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.card,
    },
    skipText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
    warning: { marginBottom: 20, fontSize: 15, color: theme.error, textAlign: 'center' },
    footer: { marginTop: 28, fontSize: 12, color: theme.secundaryText, textAlign: 'center', lineHeight: 18 },
});
