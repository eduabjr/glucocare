import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Modal } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { saveOrUpdateUser } from '../services/dbService';

// Tipos para os ícones
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];
type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Interface para cards de configuração
interface SettingsCardProps {
    title: string;
    description: string;
    iconName: MaterialIconName; 
    onPress: () => void;
}

interface SettingsCardCommunityProps {
    title: string;
    description: string;
    iconName: MaterialCommunityIconName; 
    onPress: () => void;
}

// Componente para cards com MaterialIcons
const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, iconName, onPress }) => (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
        <View style={styles.iconBackground}>
            <MaterialIcons name={iconName} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#B0B0B0" />
    </TouchableOpacity>
);

// Componente para cards com MaterialCommunityIcons
const SettingsCardCommunity: React.FC<SettingsCardCommunityProps> = ({ title, description, iconName, onPress }) => (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
        <View style={styles.iconBackground}>
            <MaterialCommunityIcons name={iconName} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#B0B0B0" />
    </TouchableOpacity>
);

// Componente principal
const SettingsScreen: React.FC = () => {
    const { user, setUser, logout } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricSupported, setBiometricSupported] = useState(false);
    const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        checkBiometricSupport();
        loadUserSettings();
    }, []);

    const checkBiometricSupport = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricSupported(hasHardware && isEnrolled);
            
            const biometricStatus = await SecureStore.getItemAsync('biometric_enabled');
            setBiometricEnabled(biometricStatus === 'true');
        } catch (error) {
            console.error('Erro ao verificar suporte à biometria:', error);
        }
    };

    const loadUserSettings = async () => {
        try {
            const notificationsStatus = await SecureStore.getItemAsync('notifications_enabled');
            setNotificationsEnabled(notificationsStatus !== 'false');
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await logout();
        } catch (error) {
            Alert.alert("Erro ao Sair", "Não foi possível realizar o logout.");
            console.error("Sign Out Error:", error);
        }
    };

    const handleNotificationsToggle = async (value: boolean) => {
        try {
            setNotificationsEnabled(value);
            await SecureStore.setItemAsync('notifications_enabled', value.toString());
            Alert.alert('Sucesso', `Notificações ${value ? 'ativadas' : 'desativadas'} com sucesso!`);
        } catch (error) {
            console.error('Erro ao alterar notificações:', error);
            Alert.alert('Erro', 'Não foi possível alterar as configurações de notificação.');
        }
    };

    const handleBiometricToggle = async () => {
        // ✅ CORREÇÃO: Apenas permitir cadastrar biometria (não desativar)
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirme sua biometria para configurar',
            });

            if (result.success) {
                await SecureStore.setItemAsync('biometric_enabled', 'true');
                setBiometricEnabled(true);
                
                // Atualizar perfil no contexto
                if (user) {
                    const updatedUser = { ...user, biometricEnabled: true };
                    setUser(updatedUser);
                    await saveOrUpdateUser(updatedUser as any);
                }
                
                Alert.alert('Sucesso', 'Biometria configurada com sucesso!');
            } else {
                Alert.alert('Falha', 'Não foi possível autenticar sua biometria.');
            }
        } catch (error) {
            console.error('Erro ao configurar biometria:', error);
            Alert.alert('Erro', 'Não foi possível configurar a biometria.');
        }
    };

    const handleChangeEmail = async () => {
        // ✅ CORREÇÃO: Verificar se o e-mail foi verificado
        if (!user?.emailVerified) {
            Alert.alert(
                '🔒 Funcionalidade Bloqueada', 
                'Você precisa verificar seu e-mail antes de poder alterá-lo.\n\n📧 Verifique sua caixa de entrada e clique no link de verificação enviado.',
                [
                    {
                        text: 'Entendi',
                        style: 'default'
                    }
                ]
            );
            return;
        }

        if (!newEmail.trim()) {
            Alert.alert('Erro', 'Digite um e-mail válido.');
            return;
        }

        if (!currentPassword.trim()) {
            Alert.alert('Erro', 'Digite sua senha atual.');
            return;
        }

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Erro', 'Usuário não encontrado.');
                return;
            }

            // Reautenticar usuário
            const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Atualizar e-mail
            await updateEmail(currentUser, newEmail.trim());

            // Atualizar perfil no contexto
            if (user) {
                const updatedUser = { ...user, email: newEmail.trim() };
                setUser(updatedUser);
                await saveOrUpdateUser(updatedUser as any);
            }

            Alert.alert('Sucesso', 'E-mail atualizado com sucesso!');
            setShowChangeEmailModal(false);
            setNewEmail('');
            setCurrentPassword('');
        } catch (error: any) {
            console.error('Erro ao alterar e-mail:', error);
            let errorMessage = 'Não foi possível alterar o e-mail.';
            
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Senha atual incorreta.';
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está sendo usado.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido.';
            }
            
            Alert.alert('Erro', errorMessage);
        }
    };

    const handleChangePassword = async () => {
        // ✅ CORREÇÃO: Verificar se o e-mail foi verificado
        if (!user?.emailVerified) {
            Alert.alert(
                '🔒 Funcionalidade Bloqueada', 
                'Você precisa verificar seu e-mail antes de poder alterar sua senha.\n\n📧 Verifique sua caixa de entrada e clique no link de verificação enviado.',
                [
                    {
                        text: 'Entendi',
                        style: 'default'
                    }
                ]
            );
            return;
        }

        if (!currentPassword.trim()) {
            Alert.alert('Erro', 'Digite sua senha atual.');
            return;
        }

        if (!newPassword.trim() || newPassword.length < 6) {
            Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem.');
            return;
        }

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Erro', 'Usuário não encontrado.');
                return;
            }

            // Reautenticar usuário
            const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Atualizar senha
            await updatePassword(currentUser, newPassword);

            Alert.alert('Sucesso', 'Senha alterada com sucesso!');
            setShowChangePasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Erro ao alterar senha:', error);
            let errorMessage = 'Não foi possível alterar a senha.';
            
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Senha atual incorreta.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'A nova senha é muito fraca.';
            }
            
            Alert.alert('Erro', errorMessage);
        }
    };

    return (
        <ScrollView style={styles.container}>
            
            {/* User Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                </View>
                <Text style={styles.profileName}>{user?.name || 'Usuário Não Conectado'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'N/A'}</Text>
            </View>

            {/* Account Settings */}
            <Text style={styles.sectionTitle}>CONFIGURAÇÕES DA CONTA</Text>
            <View style={styles.cardGroup}>
                {/* Mudar E-mail - com estilo de bloqueio se não verificado */}
                <TouchableOpacity 
                    style={[
                        styles.cardContainer,
                        !user?.emailVerified && styles.lockedCard
                    ]} 
                    onPress={() => setShowChangeEmailModal(true)}
                    disabled={!user?.emailVerified}
                >
                    <View style={[
                        styles.iconBackground,
                        !user?.emailVerified && styles.lockedIconBackground
                    ]}>
                        <MaterialIcons 
                            name="email" 
                            size={24} 
                            color={user?.emailVerified ? "#FFFFFF" : "#9CA3AF"} 
                        />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[
                            styles.cardTitle,
                            !user?.emailVerified && styles.lockedText
                        ]}>
                            Mudar E-mail
                        </Text>
                        <Text style={[
                            styles.cardDescription,
                            !user?.emailVerified && styles.lockedDescription
                        ]}>
                            {user?.emailVerified ? "Atualize seu endereço de e-mail." : "Verifique seu e-mail primeiro."}
                        </Text>
                    </View>
                    {!user?.emailVerified && (
                        <MaterialIcons name="lock" size={20} color="#9CA3AF" />
                    )}
                    {user?.emailVerified && (
                        <MaterialIcons name="chevron-right" size={24} color="#B0B0B0" />
                    )}
                </TouchableOpacity>

                {/* Mudar Senha - com estilo de bloqueio se não verificado */}
                <TouchableOpacity 
                    style={[
                        styles.cardContainer,
                        !user?.emailVerified && styles.lockedCard
                    ]} 
                    onPress={() => setShowChangePasswordModal(true)}
                    disabled={!user?.emailVerified}
                >
                    <View style={[
                        styles.iconBackground,
                        !user?.emailVerified && styles.lockedIconBackground
                    ]}>
                        <MaterialIcons 
                            name="lock" 
                            size={24} 
                            color={user?.emailVerified ? "#FFFFFF" : "#9CA3AF"} 
                        />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[
                            styles.cardTitle,
                            !user?.emailVerified && styles.lockedText
                        ]}>
                            Mudar Senha
                        </Text>
                        <Text style={[
                            styles.cardDescription,
                            !user?.emailVerified && styles.lockedDescription
                        ]}>
                            {user?.emailVerified ? "Altere sua senha de login." : "Verifique seu e-mail primeiro."}
                        </Text>
                    </View>
                    {!user?.emailVerified && (
                        <MaterialIcons name="lock" size={20} color="#9CA3AF" />
                    )}
                    {user?.emailVerified && (
                        <MaterialIcons name="chevron-right" size={24} color="#B0B0B0" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Security Settings */}
            <Text style={styles.sectionTitle}>SEGURANÇA</Text>
            <View style={styles.cardGroup}>
                {biometricSupported && !biometricEnabled && (
                    <SettingsCard
                        title="Configurar Biometria"
                        description="Configure a biometria para maior segurança."
                        iconName="fingerprint"
                        onPress={handleBiometricToggle}
                    />
                )}
                {biometricSupported && biometricEnabled && (
                    <View style={styles.cardContainer}>
                        <View style={styles.iconBackground}>
                            <MaterialIcons name="fingerprint" size={24} color="#FFFFFF" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>Biometria</Text>
                            <Text style={styles.cardDescription}>
                                Configurada e ativa
                            </Text>
                        </View>
                        <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                )}
            </View>

            {/* General Settings */}
            <Text style={styles.sectionTitle}>GERAL</Text>
            <View style={styles.cardGroup}>
                <View style={styles.cardContainer}>
                    <View style={styles.iconBackground}>
                        <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.cardTitle}>Notificações</Text>
                        <Text style={styles.cardDescription}>
                            {notificationsEnabled ? 'Ativadas' : 'Desativadas'}
                        </Text>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={handleNotificationsToggle}
                        trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                        thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
                    />
                </View>
                <SettingsCardCommunity
                    title="Backup e Sincronização"
                    description="Faça backup dos seus dados na nuvem."
                    iconName="cloud-upload" 
                    onPress={() => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve.')}
                />
                <SettingsCard
                    title="Sobre o App"
                    description="Informações de versão e termos de uso."
                    iconName="info" 
                    onPress={() => Alert.alert('GlucoCare', 'Versão 1.0.0\n\nDesenvolvido para controle de glicemia.')}
                />
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                <Text style={styles.logoutButtonText}>SAIR DA CONTA</Text>
            </TouchableOpacity>

            {/* Modal para Mudar E-mail */}
            <Modal
                visible={showChangeEmailModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Mudar E-mail</Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Novo e-mail"
                            value={newEmail}
                            onChangeText={setNewEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Senha atual"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowChangeEmailModal(false);
                                    setNewEmail('');
                                    setCurrentPassword('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleChangeEmail}
                            >
                                <Text style={styles.confirmButtonText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal para Mudar Senha */}
            <Modal
                visible={showChangePasswordModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Mudar Senha</Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Senha atual"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                        />
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Nova senha"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Confirmar nova senha"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowChangePasswordModal(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleChangePassword}
                            >
                                <Text style={styles.confirmButtonText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        padding: 16,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333333',
    },
    profileEmail: {
        fontSize: 14,
        color: '#666666',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
        marginTop: 15,
        marginBottom: 8,
        paddingHorizontal: 5,
    },
    cardGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        marginBottom: 10,
    },
    cardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    iconBackground: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
    },
    cardDescription: {
        fontSize: 12,
        color: '#888888',
    },
    logoutButton: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#FF4D4D',
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#FF4D4D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    // Estilos para os modais
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#F9F9F9',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    cancelButton: {
        backgroundColor: '#E0E0E0',
    },
    confirmButton: {
        backgroundColor: '#2563eb',
    },
    cancelButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Estilos para elementos bloqueados
    lockedCard: {
        opacity: 0.5,
        backgroundColor: '#F5F5F5',
    },
    lockedIconBackground: {
        backgroundColor: '#E5E5E5',
    },
    lockedText: {
        color: '#9CA3AF',
    },
    lockedDescription: {
        color: '#9CA3AF',
    },
});

export default SettingsScreen;