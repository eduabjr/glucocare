import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native'; // Removed since it's unused (Warning 6133)

// --- Type Definitions for Fixes ---

// 1. FIX: Define a placeholder for AuthContextType with the missing 'signOut' function (Error 2339)
// NOTE: You should ensure this matches the actual definition in '../context/AuthContext'
interface AuthContextType {
    user: { id: string; email: string; name: string } | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    // FIX 2339: Added the missing 'signOut' property
    signOut: () => Promise<void>; 
}

// NOTE: Assuming this hook is defined elsewhere.
const useAuth = () => {
    // Placeholder implementation for demonstration
    const authContext: AuthContextType = {
        user: { id: 'user123', email: 'user@example.com', name: 'John Doe' },
        isLoading: false,
        signIn: async () => {},
        signUp: async () => {},
        signOut: async () => { console.log("User signed out."); }
    };
    return authContext;
}

// 2. FIX: Correctly derive icon name types for Material and MaterialCommunity (Error 2339 & 2322)
// This uses the standard way to extract a prop's type from a component in React.
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];
type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];


// Interface for settings card using MaterialIcons
interface SettingsCardProps {
    title: string;
    description: string;
    // FIX 2322: Use the correctly derived icon name type
    iconName: MaterialIconName; 
    onPress: () => void;
}

// Interface for settings card using MaterialCommunityIcons
interface SettingsCardCommunityProps {
    title: string;
    description: string;
    // FIX 2322: Use the correctly derived icon name type
    iconName: MaterialCommunityIconName; 
    onPress: () => void;
}

// --- Component Definitions ---

const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, iconName, onPress }) => (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
        <View style={styles.iconBackground}>
            {/* The type for 'name' is now correctly inferred */}
            <MaterialIcons name={iconName} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#B0B0B0" />
    </TouchableOpacity>
);

const SettingsCardCommunity: React.FC<SettingsCardCommunityProps> = ({ title, description, iconName, onPress }) => (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
        <View style={styles.iconBackground}>
            {/* The type for 'name' is now correctly inferred */}
            <MaterialCommunityIcons name={iconName} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#B0B0B0" />
    </TouchableOpacity>
);


// --- Main Screen Component ---

const SettingsScreen: React.FC = () => {
    // FIX 6133: Removed unused 'navigation' declaration
    // const navigation = useNavigation();
    
    // FIX 2339: 'signOut' is now included in the destructured properties (Retained user's fix)
    const { user, signOut } = useAuth(); 

    const handleSignOut = async () => {
        try {
            await signOut();
            // Assuming navigation logic to login screen
            // navigation.navigate('Login'); 
        } catch (error) {
            Alert.alert("Erro ao Sair", "Não foi possível realizar o logout.");
            console.error("Sign Out Error:", error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            
            {/* User Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name[0] || 'U'}</Text>
                </View>
                <Text style={styles.profileName}>{user?.name || 'Usuário Não Conectado'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'N/A'}</Text>
            </View>

            {/* Account Settings */}
            <Text style={styles.sectionTitle}>CONFIGURAÇÕES DA CONTA</Text>
            <View style={styles.cardGroup}>
                <SettingsCard
                    title="Mudar E-mail"
                    description="Atualize seu endereço de e-mail."
                    // Icon name is now correctly validated
                    iconName="email" 
                    onPress={() => console.log('Mudar E-mail')}
                />
                <SettingsCard
                    title="Mudar Senha"
                    description="Altere sua senha de login."
                    // Icon name is now correctly validated
                    iconName="lock" 
                    onPress={() => console.log('Mudar Senha')}
                />
            </View>

            {/* General Settings */}
            <Text style={styles.sectionTitle}>GERAL</Text>
            <View style={styles.cardGroup}>
                <SettingsCard
                    title="Notificações"
                    description="Gerencie alertas e lembretes."
                    // Icon name is now correctly validated
                    iconName="notifications" 
                    onPress={() => console.log('Notificações')}
                />
                <SettingsCardCommunity
                    title="Backup e Sincronização"
                    description="Faça backup dos seus dados na nuvem."
                    // Icon name is now correctly validated
                    iconName="cloud-upload" 
                    onPress={() => console.log('Backup')}
                />
                <SettingsCard
                    title="Sobre o App"
                    description="Informações de versão e termos de uso."
                    // Icon name is now correctly validated
                    iconName="info" 
                    onPress={() => console.log('Sobre o App')}
                />
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                <Text style={styles.logoutButtonText}>SAIR DA CONTA</Text>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA', // Light background
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
        backgroundColor: '#007BFF', // Primary color for avatar
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
        backgroundColor: '#4A90E2', // Icon background color
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
        backgroundColor: '#FF4D4D', // Red color for danger action
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
});

export default SettingsScreen;
