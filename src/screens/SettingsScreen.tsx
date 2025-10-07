import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Modal, Appearance } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { saveOrUpdateUser } from '../services/dbService';
import { ThemeContext } from '../context/ThemeContext';
import { GlycemicGoals, getUserGlycemicGoals } from '../utils/glycemicGoals';

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
const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, iconName, onPress }) => {
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);

    return (
        <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
            <View style={styles.iconBackground}>
                <MaterialIcons name={iconName} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.secundaryText} />
        </TouchableOpacity>
    );
};

// Componente para cards com MaterialCommunityIcons
const SettingsCardCommunity: React.FC<SettingsCardCommunityProps> = ({ title, description, iconName, onPress }) => {
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);

    return (
        <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
            <View style={styles.iconBackground}>
                <MaterialCommunityIcons name={iconName} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.secundaryText} />
        </TouchableOpacity>
    );
};

// Componente principal
const SettingsScreen: React.FC = () => {
    const { user, setUser, logout } = useAuth();
    const { theme, toggleTheme, isDarkMode } = useContext(ThemeContext);
    const styles = getStyles(theme);

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricSupported, setBiometricSupported] = useState(false);
    const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showGlycemicGoalsModal, setShowGlycemicGoalsModal] = useState(false);
    const [glycemicGoals, setGlycemicGoals] = useState<GlycemicGoals>(() => getUserGlycemicGoals(user?.glycemicGoals, user?.condition));

    // Interface para regras de senha
    interface PasswordRules {
        length: boolean;
        uppercase: boolean;
        lowercase: boolean;
        number: boolean;
        specialChar: boolean;
    }

    // Hook para validação de senha
    const usePasswordValidation = (password: string) => {
        const rules: PasswordRules = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            specialChar: /[^A-Za-z0-9\s]/.test(password),
        };

        const isPasswordValid = Object.values(rules).every(Boolean);
        return { rules, isPasswordValid };
    };

    const { rules: passwordRules, isPasswordValid } = usePasswordValidation(newPassword);

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

    const handleThemeChange = async (value: boolean) => {
        toggleTheme();
        Alert.alert('Sucesso', `Tema alterado para ${value ? 'escuro' : 'claro'}!`);
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

        if (!newPassword.trim() || !isPasswordValid) {
            Alert.alert('Erro', 'A nova senha deve atender a todos os requisitos de segurança.');
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

    const handleSaveGlycemicGoals = async () => {
        try {
            if (!user) {
                Alert.alert('Erro', 'Usuário não encontrado.');
                return;
            }

            const updatedUser = {
                ...user,
                glycemicGoals: JSON.stringify(glycemicGoals),
                updated_at: new Date().toISOString(),
                pending_sync: true
            };

            await saveOrUpdateUser(updatedUser as any);
            setUser(updatedUser);

            Alert.alert('Sucesso', 'Objetivos glicêmicos atualizados com sucesso!');
            setShowGlycemicGoalsModal(false);
        } catch (error) {
            console.error('Erro ao salvar objetivos glicêmicos:', error);
            Alert.alert('Erro', 'Não foi possível salvar os objetivos glicêmicos.');
        }
    };

    const handleInputChange = (period: keyof GlycemicGoals, field: 'min' | 'ideal' | 'max', value: string) => {
        const numericValue = parseInt(value) || 0;
        
        setGlycemicGoals(prev => ({
            ...prev,
            [period]: {
                ...prev[period],
                [field]: numericValue
            }
        }));
    };

    return (
        <ScrollView style={styles.container}>
            
            {/* User Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.avatar}>
                    <MaterialIcons name="settings" size={32} color="#FFFFFF" />
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
                        <MaterialIcons name="chevron-right" size={24} color={theme.secundaryText} />
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
                        <MaterialIcons name="chevron-right" size={24} color={theme.secundaryText} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Health Settings */}
            <Text style={styles.sectionTitle}>SAÚDE</Text>
            <View style={styles.cardGroup}>
                <SettingsCard
                    title="Objetivo Glicêmico"
                    description="Configure suas metas de glicemia personalizadas."
                    iconName="favorite"
                    onPress={() => setShowGlycemicGoalsModal(true)}
                />
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
                        <MaterialIcons name="check-circle" size={24} color={theme.accent} />
                    </View>
                )}
            </View>

            {/* General Settings */}
            <Text style={styles.sectionTitle}>GERAL</Text>
            <View style={styles.cardGroup}>
                <View style={styles.cardContainer}>
                    <View style={styles.iconBackground}>
                        <MaterialIcons name="brightness-6" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.cardTitle}>Tema do Aplicativo</Text>
                        <Text style={styles.cardDescription}>
                            {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
                        </Text>
                    </View>
                    <Switch
                        value={isDarkMode}
                        onValueChange={handleThemeChange}
                        trackColor={{ false: '#E0E0E0', true: theme.accent }}
                        thumbColor={'#FFFFFF'}
                    />
                </View>
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
                        trackColor={{ false: '#E0E0E0', true: theme.accent }}
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
                    <View style={styles.changeEmailModalContent}>
                        <Text style={styles.modalTitle}>Mudar E-mail</Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Novo e-mail"
                            value={newEmail}
                            onChangeText={setNewEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.modalInputNoBorder}
                                placeholder="Senha atual"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showCurrentPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                <Ionicons
                                    name={showCurrentPassword ? 'eye' : 'eye-off'}
                                    size={22}
                                    color={theme.secundaryText}
                                />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowChangeEmailModal(false);
                                    setNewEmail('');
                                    setCurrentPassword('');
                                    setShowCurrentPassword(false);
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
                    <View style={styles.changePasswordModalContent}>
                        <Text style={styles.modalTitle}>Mudar Senha</Text>
                        
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.modalInputNoBorder}
                                placeholder="Senha atual"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showCurrentPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                <Ionicons
                                    name={showCurrentPassword ? 'eye' : 'eye-off'}
                                    size={22}
                                    color={theme.secundaryText}
                                />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Nova senha"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                                <Ionicons
                                    name={showNewPassword ? 'eye' : 'eye-off'}
                                    size={22}
                                    color={theme.secundaryText}
                                />
                            </TouchableOpacity>
                        </View>
                        
                        {/* Regras de senha */}
                        {newPassword.length > 0 && (
                            <View style={styles.passwordRulesContainer}>
                                <Text style={styles.passwordRulesTitle}>Certifique-se de que sua nova senha contém:</Text>
                                <Text style={[styles.passwordRule, passwordRules.length ? styles.passwordRuleValid : styles.passwordRuleInvalid]}>
                                    {passwordRules.length ? '✓' : '✗'} No mínimo 8 dígitos
                                </Text>
                                <Text style={[styles.passwordRule, passwordRules.uppercase ? styles.passwordRuleValid : styles.passwordRuleInvalid]}>
                                    {passwordRules.uppercase ? '✓' : '✗'} Pelo menos 1 letra maiúscula (A–Z)
                                </Text>
                                <Text style={[styles.passwordRule, passwordRules.lowercase ? styles.passwordRuleValid : styles.passwordRuleInvalid]}>
                                    {passwordRules.lowercase ? '✓' : '✗'} Pelo menos 1 letra minúscula (a–z)
                                </Text>
                                <Text style={[styles.passwordRule, passwordRules.number ? styles.passwordRuleValid : styles.passwordRuleInvalid]}>
                                    {passwordRules.number ? '✓' : '✗'} Pelo menos 1 número (0–9)
                                </Text>
                                <Text style={[styles.passwordRule, passwordRules.specialChar ? styles.passwordRuleValid : styles.passwordRuleInvalid]}>
                                    {passwordRules.specialChar ? '✓' : '✗'} Pelo menos 1 caractere especial (ex.: !@#$%^&*)
                                </Text>
                            </View>
                        )}
                        
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Confirmar nova senha"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                                    size={22}
                                    color={theme.secundaryText}
                                />
                            </TouchableOpacity>
                        </View>
                        
                        {/* Validação de confirmação */}
                        {confirmPassword.length > 0 && (
                            <Text style={[styles.passwordValidationText, newPassword === confirmPassword ? styles.passwordValidationValid : styles.passwordValidationInvalid]}>
                                {newPassword === confirmPassword ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                            </Text>
                        )}
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowChangePasswordModal(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setShowCurrentPassword(false);
                                    setShowNewPassword(false);
                                    setShowConfirmPassword(false);
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

            {/* Modal de Objetivos Glicêmicos */}
            <Modal
                visible={showGlycemicGoalsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowGlycemicGoalsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Objetivo Glicêmico</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowGlycemicGoalsModal(false)}
                            >
                                <MaterialIcons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalDescription}>
                                Configure suas metas de glicemia para diferentes períodos do dia.
                            </Text>

                            {/* Pré-refeição */}
                            <View style={styles.goalsSection}>
                                <Text style={styles.periodTitle}>Pré-refeição:</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Min</Text>
                                        <TextInput
                                            style={styles.goalInput}
                                            value={glycemicGoals.preMeal.min.toString()}
                                            onChangeText={(value) => handleInputChange('preMeal', 'min', value)}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Ideal</Text>
                                        <TextInput
                                            style={styles.goalInput}
                                            value={glycemicGoals.preMeal.ideal.toString()}
                                            onChangeText={(value) => handleInputChange('preMeal', 'ideal', value)}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Max</Text>
                                        <TextInput
                                            style={styles.goalInput}
                                            value={glycemicGoals.preMeal.max.toString()}
                                            onChangeText={(value) => handleInputChange('preMeal', 'max', value)}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Pós-refeição */}
                            <View style={styles.goalsSection}>
                                <Text style={styles.periodTitle}>Pós-refeição:</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Min</Text>
                                        <TextInput
                                            style={styles.goalInput}
                                            value={glycemicGoals.postMeal.min.toString()}
                                            onChangeText={(value) => handleInputChange('postMeal', 'min', value)}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Ideal</Text>
                                        <TextInput
                                            style={styles.goalInput}
                                            value={glycemicGoals.postMeal.ideal.toString()}
                                            onChangeText={(value) => handleInputChange('postMeal', 'ideal', value)}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Max</Text>
                                        <TextInput
                                            style={styles.goalInput}
                                            value={glycemicGoals.postMeal.max.toString()}
                                            onChangeText={(value) => handleInputChange('postMeal', 'max', value)}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Noite/Madrugada */}
                            <View style={styles.goalsSection}>
                                <Text style={styles.periodTitle}>Noite/Madrugada:</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Min</Text>
                                        <TextInput
                                            style={styles.goalInput}
                                            value={glycemicGoals.night.min.toString()}
                                            onChangeText={(value) => handleInputChange('night', 'min', value)}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Ideal</Text>
                                        <TextInput
                                            style={styles.goalInput}
                                            value={glycemicGoals.night.ideal.toString()}
                                            onChangeText={(value) => handleInputChange('night', 'ideal', value)}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Max</Text>
                                        <TextInput
                                            style={styles.goalInput}
                                            value={glycemicGoals.night.max.toString()}
                                            onChangeText={(value) => handleInputChange('night', 'max', value)}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowGlycemicGoalsModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleSaveGlycemicGoals}
                            >
                                <Text style={styles.confirmButtonText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
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
        backgroundColor: theme.primary,
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
        color: theme.text,
    },
    profileEmail: {
        fontSize: 14,
        color: theme.secundaryText,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.secundaryText,
        marginTop: 15,
        marginBottom: 8,
        paddingHorizontal: 5,
    },
    cardGroup: {
        backgroundColor: theme.card,
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
        borderBottomColor: theme.background,
    },
    iconBackground: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.secundary,
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
        color: theme.text,
    },
    cardDescription: {
        fontSize: 12,
        color: theme.secundaryText,
    },
    logoutButton: {
        marginTop: 30,
        padding: 15,
        backgroundColor: theme.error,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: theme.error,
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
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    changeEmailModalContent: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: '100%',
        marginHorizontal: 5,
        minWidth: 300,
        minHeight: 250,
    },
    changePasswordModalContent: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 24,
        width: '95%',
        maxWidth: 500,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
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
        backgroundColor: theme.background,
        color: theme.text,
        flex: 1,
        minWidth: 0,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: theme.background,
    },
    modalInputNoBorder: {
        borderWidth: 0,
        borderRadius: 0,
        padding: 12,
        marginBottom: 0,
        fontSize: 16,
        backgroundColor: 'transparent',
        color: theme.text,
        flex: 1,
    },
    eyeIcon: {
        position: 'absolute',
        right: 12,
        padding: 4,
    },
    passwordRulesContainer: {
        backgroundColor: theme.background,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    passwordRulesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
    },
    passwordRule: {
        fontSize: 12,
        marginBottom: 4,
        lineHeight: 16,
    },
    passwordRuleValid: {
        color: '#059669',
    },
    passwordRuleInvalid: {
        color: theme.error,
    },
    passwordValidationText: {
        fontSize: 12,
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    passwordValidationValid: {
        color: '#059669',
    },
    passwordValidationInvalid: {
        color: theme.error,
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
        backgroundColor: theme.primary,
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
        backgroundColor: theme.background,
    },
    lockedIconBackground: {
        backgroundColor: '#E5E5E5',
    },
    lockedText: {
        color: theme.secundaryText,
    },
    lockedDescription: {
        color: theme.secundaryText,
    },
    // Estilos para o modal de objetivos glicêmicos
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalBody: {
        maxHeight: 400,
    },
    modalDescription: {
        fontSize: 14,
        color: theme.secundaryText,
        marginBottom: 20,
        textAlign: 'center',
    },
    goalsSection: {
        marginBottom: 24,
    },
    periodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputGroup: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    inputLabel: {
        fontSize: 14,
        color: theme.secundaryText,
        marginBottom: 8,
        fontWeight: '500',
    },
    goalInput: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.text,
        backgroundColor: theme.background,
        textAlign: 'center',
        minWidth: 60,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    closeButton: {
        padding: 8,
    },
});

export default SettingsScreen;