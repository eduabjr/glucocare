import React, { useEffect, useState } from 'react';
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

type BiometricSetupScreenProps = {
    navigation: { replace: (screen: string, params?: object) => void };
};

export default function BiometricSetupScreen({ navigation }: BiometricSetupScreenProps) {
    const [supported, setSupported] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    
    // ✨ PASSO 2: Obtenha a função 'setUser' do AuthContext
    const { setUser } = useAuth();

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

            // A mágica acontece aqui!
            // Chamamos a função setUser do contexto, que vai atualizar o estado global
            // e fazer o RootNavigator mostrar o Drawer da aplicação.
            setUser(userProfile);

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
        await SecureStore.setItemAsync('biometric_enabled', 'false');
        
        // ✨ PASSO 5: Chama a nova função aqui também
        await completeSetup();
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <MaterialIcons name="fingerprint" size={90} color="#7b2ff7" style={styles.icon} />

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
                            style={{ width: '100%', marginTop: 18, marginBottom: 12 }}
                            onPress={enableBiometric}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#7b2ff7', '#f107a3']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.enableButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.enableText}>Habilitar Biometria →</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.skipButton} onPress={skipBiometric} disabled={loading}>
                            <Text style={styles.skipText}>✕ Pular por Agora</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.warning}>
                            O seu dispositivo não suporta autenticação biométrica.
                        </Text>
                        <TouchableOpacity style={styles.skipButton} onPress={skipBiometric} disabled={loading}>
                            <Text style={styles.skipText}>Continuar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.footer}>
                    Você pode alterar essa configuração a qualquer momento em{"\n"}
                    <Text style={{ fontWeight: '600', color: '#2563eb' }}>Configurações</Text>.
                </Text>
            </View>
        </SafeAreaView>
    );
}

// Estilos
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f6ff' },
    container: { flex: 1, padding: 24, alignItems: 'center' },
    icon: { marginTop: 40, marginBottom: 20 },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: { fontSize: 14, color: '#555', marginBottom: 20, textAlign: 'center' },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    question: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: '#111827' },
    optionGreen: {
        width: '100%',
        backgroundColor: '#e6f8f0',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    optionBlue: { 
        width: '100%',
        backgroundColor: '#e8f0fe', 
        padding: 12, 
        borderRadius: 10 
    },
    optionTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    optionDesc: { fontSize: 13, color: '#555', marginTop: 2 },
    enableButton: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    enableText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    skipButton: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#d1d5db',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    skipText: { fontSize: 15, fontWeight: '600', color: '#111827' },
    warning: { marginBottom: 20, fontSize: 15, color: '#dc2626', textAlign: 'center' },
    footer: { marginTop: 28, fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
});
