import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';

// Tipagem para o estado do componente
export default function BluetoothConnection() {
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);

  // Função para simular a conexão Bluetooth
  const connect = async () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      Alert.alert('Sucesso', 'Dispositivo conectado (simulado).');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conectar Glicosímetro via Bluetooth</Text>
      <TouchableOpacity style={styles.button} onPress={connect} disabled={connecting}>
        {connecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.bt}>{connected ? 'Conectado' : 'Conectar'}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  bt: { color: '#fff', fontWeight: '700' },
});
