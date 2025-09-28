import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoadingScreen: React.FC = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.text}>Carregando GlucoCare...</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f6ff",
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        marginTop: 15,
        fontSize: 16,
        color: "#4b5563",
        fontWeight: '500',
    }
});

export default LoadingScreen;
