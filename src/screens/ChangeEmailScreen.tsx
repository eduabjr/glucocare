import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  getAuth,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
} from 'firebase/auth';

/**
 * Componente responsável por exibir o e-mail atual e gerenciar a troca de e-mail do usuário.
 * Este componente utiliza a lógica de reautenticação do Firebase.
 */
const EmailManagement: React.FC = () => {
    const [newEmail, setNewEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'success' | 'error' | null>(null);
    const [message, setMessage] = useState('');
  
    const auth = getAuth();
    const user = auth.currentUser; 
    // Correção do erro 2532: Acessa o email de forma segura
    const currentEmail = user?.email || 'N/A';
  
    const handleChangeEmail = async () => {
      setStatus(null);
      setMessage('');
      setLoading(true);
  
      if (!user) {
        setMessage('Usuário não logado. Por favor, faça login novamente.');
        setStatus('error');
        setLoading(false);
        return;
      }
  
      if (!password || !newEmail) {
        setMessage('Por favor, preencha o novo e-mail e sua senha atual.');
        setStatus('error');
        setLoading(false);
        return;
      }

      if (newEmail === currentEmail) {
        setMessage('O novo e-mail é o mesmo que o atual.');
        setStatus('error');
        setLoading(false);
        return;
      }
  
      try {
        // 1. Reautenticar o usuário usando a senha atual
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
  
        // 2. Atualizar o e-mail
        await updateEmail(user, newEmail);
        
        // 3. Enviar verificação para o novo e-mail (Correção do erro 2304)
        await sendEmailVerification(user); 
  
        setMessage(
          'E-mail alterado com sucesso! Um link de verificação foi enviado para o novo endereço.',
        );
        setStatus('success');
        setNewEmail('');
        setPassword('');
  
      } catch (e: any) {
        console.error('Erro ao mudar e-mail:', e);
        if (e.code === 'auth/requires-recent-login') {
          setMessage(
            'Esta operação requer que você faça login novamente. Por favor, saia e entre novamente no aplicativo.',
          );
        } else if (e.code === 'auth/invalid-email') {
          setMessage('O novo e-mail fornecido é inválido.');
        } else if (e.code === 'auth/wrong-password') {
          setMessage('A senha atual fornecida está incorreta.');
        }
        else {
          setMessage('Ocorreu um erro ao atualizar o e-mail. Tente novamente.');
        }
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    const handleResendVerification = async () => {
      if (!user) {
        Alert.alert("Erro", "Usuário não logado.");
        return;
      }
      setLoading(true);
      try {
        await sendEmailVerification(user);
        Alert.alert("Sucesso", "Novo link de verificação enviado para seu e-mail.");
      } catch (e) {
        Alert.alert("Erro", "Não foi possível enviar o link de verificação. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <View>
        <Text style={styles.text}>
          Seu e-mail atual é: <Text style={styles.highlightText}>{currentEmail}</Text>
        </Text>
        
        {user && !user.emailVerified && (
          <View style={styles.verificationWarning}>
            <MaterialIcons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.verificationText}>Seu e-mail não está verificado. </Text>
            <TouchableOpacity onPress={handleResendVerification} disabled={loading}>
              <Text style={styles.resendLink}>
                {loading ? 'Enviando...' : 'Reenviar link'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.text, { marginTop: 10, fontWeight: '600' }]}>
          Mudar E-mail:
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Novo E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={newEmail}
          onChangeText={setNewEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Sua Senha Atual (Para confirmar a mudança)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
  
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#2563eb', marginTop: 10 }]} 
          onPress={handleChangeEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionText}>Atualizar E-mail</Text>
          )}
        </TouchableOpacity>
        
        {message ? (
          <Text style={[styles.statusText, { color: status === 'error' ? '#dc2626' : '#16a34a' }]}>
            {message}
          </Text>
        ) : null}
      </View>
    );
};

const styles = StyleSheet.create({
    text: { fontSize: 14, color: '#555' },
    highlightText: {
        fontWeight: 'bold',
        color: '#000',
    },
    input: {
        height: 44,
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginTop: 8,
        backgroundColor: '#f9fafb',
        fontSize: 14,
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    actionText: { 
        color: '#fff', 
        fontWeight: '600', 
        fontSize: 14 
    },
    statusText: {
        fontSize: 14,
        marginTop: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    verificationWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 8,
        backgroundColor: '#fef3c7', // Amarelo claro
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    verificationText: {
        fontSize: 13,
        color: '#d97706',
        marginLeft: 4,
    },
    resendLink: {
        fontSize: 13,
        color: '#f59e0b',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    }
});

export default EmailManagement;
