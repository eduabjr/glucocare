import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../context/ThemeContext';

const LoadingScreen: React.FC = () => {
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.text}>Carregando GlucoCare...</Text>
            </View>
        </SafeAreaView>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        marginTop: 15,
        fontSize: 16,
        color: theme.secundaryText,
        fontWeight: '500',
    }
});

export default LoadingScreen;
