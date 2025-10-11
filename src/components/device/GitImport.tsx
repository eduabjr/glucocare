import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { gitImportService, GitRepositoryConfig, GitImportResult } from '../../services/gitImportService';
import { createReading } from '../../services/glucoseService';

interface GitImportProps {
  onImportComplete?: (result: GitImportResult) => void;
}

export default function GitImport({ onImportComplete }: GitImportProps) {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const styles = getStyles(theme);

  // Estados do formulário
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [filePath, setFilePath] = useState('data/glucose.csv');
  const [useAuthentication, setUseAuthentication] = useState(false);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');

  // Estados de controle
  const [isImporting, setIsImporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importResult, setImportResult] = useState<GitImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Validação
  const isFormValid = repositoryUrl.trim() && branch.trim() && filePath.trim();

  const handleImport = async () => {
    if (!isFormValid) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    setIsImporting(true);

    try {
      const config: GitRepositoryConfig = {
        repositoryUrl: repositoryUrl.trim(),
        branch: branch.trim(),
        filePath: filePath.trim(),
        authentication: useAuthentication && token.trim() ? {
          token: token.trim(),
          username: username.trim() || undefined
        } : undefined
      };

      console.log('🔄 Iniciando importação do Git...');
      const result = await gitImportService.importFromGit(config, user.id);

      if (result.success && result.readings.length > 0) {
        // Salva as leituras no banco local
        let savedCount = 0;
        for (const reading of result.readings) {
          try {
            await createReading({
              measurement_time: reading.measurement_time || new Date(reading.timestamp).toISOString(),
              glucose_level: reading.glucose_level,
              meal_context: reading.meal_context,
              time_since_meal: reading.time_since_meal,
              notes: reading.notes
            });
            savedCount++;
          } catch (error) {
            console.warn('Erro ao salvar leitura:', error);
          }
        }

        setImportResult({
          ...result,
          metadata: {
            ...result.metadata,
            validRows: savedCount
          }
        });

        Alert.alert(
          'Importação Concluída',
          `${savedCount} leituras foram importadas com sucesso do repositório Git.`,
          [
            {
              text: 'Ver Detalhes',
              onPress: () => setShowResult(true)
            },
            {
              text: 'OK',
              onPress: () => {
                onImportComplete?.(result);
                resetForm();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Importação Falhou',
          result.errors.length > 0 
            ? result.errors.join('\n')
            : 'Nenhuma leitura válida foi encontrada no arquivo.'
        );
      }

    } catch (error) {
      console.error('Erro na importação:', error);
      Alert.alert(
        'Erro na Importação',
        error instanceof Error ? error.message : 'Erro desconhecido durante a importação.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setRepositoryUrl('');
    setBranch('main');
    setFilePath('data/glucose.csv');
    setUseAuthentication(false);
    setToken('');
    setUsername('');
    setImportResult(null);
    setShowResult(false);
  };

  const fillExampleData = () => {
    setRepositoryUrl('https://github.com/usuario/glucose-data');
    setBranch('main');
    setFilePath('data/readings.csv');
  };

  const renderResultModal = () => (
    <Modal
      visible={showResult}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowResult(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.resultModal}>
          <Text style={styles.modalTitle}>Resultado da Importação</Text>
          
          {importResult && (
            <ScrollView style={styles.resultContent}>
              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Repositório:</Text>
                <Text style={styles.resultValue}>{importResult.metadata.repository}</Text>
              </View>
              
              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Arquivo:</Text>
                <Text style={styles.resultValue}>{importResult.metadata.filePath}</Text>
              </View>
              
              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Branch:</Text>
                <Text style={styles.resultValue}>{importResult.metadata.branch}</Text>
              </View>
              
              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Leituras Importadas:</Text>
                <Text style={[styles.resultValue, styles.successText]}>
                  {importResult.metadata.validRows} de {importResult.metadata.totalRows}
                </Text>
              </View>
              
              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>Data da Importação:</Text>
                <Text style={styles.resultValue}>
                  {new Date(importResult.metadata.importDate).toLocaleString('pt-BR')}
                </Text>
              </View>

              {importResult.errors.length > 0 && (
                <View style={styles.resultSection}>
                  <Text style={styles.resultLabel}>Erros:</Text>
                  {importResult.errors.map((error, index) => (
                    <Text key={index} style={[styles.resultValue, styles.errorText]}>
                      • {error}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowResult(false)}
          >
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Importar do Git</Text>
      <Text style={styles.subtitle}>
        Importe dados de glicose de um repositório GitHub
      </Text>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* URL do Repositório */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <MaterialIcons name="link" size={16} color={theme.primary} /> URL do Repositório *
          </Text>
          <TextInput
            style={styles.input}
            value={repositoryUrl}
            onChangeText={setRepositoryUrl}
            placeholder="https://github.com/usuario/repositorio"
            placeholderTextColor={theme.secundaryText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        {/* Branch */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <MaterialIcons name="account-tree" size={16} color={theme.primary} /> Branch *
          </Text>
          <TextInput
            style={styles.input}
            value={branch}
            onChangeText={setBranch}
            placeholder="main"
            placeholderTextColor={theme.secundaryText}
          />
        </View>

        {/* Caminho do Arquivo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <MaterialIcons name="description" size={16} color={theme.primary} /> Caminho do Arquivo *
          </Text>
          <TextInput
            style={styles.input}
            value={filePath}
            onChangeText={setFilePath}
            placeholder="data/glucose.csv"
            placeholderTextColor={theme.secundaryText}
          />
        </View>

        {/* Configurações Avançadas */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Text style={styles.advancedToggleText}>
            <MaterialIcons name="settings" size={16} color={theme.primary} /> Configurações Avançadas
          </Text>
          <MaterialIcons
            name={showAdvanced ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color={theme.secundaryText}
          />
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedSection}>
            {/* Autenticação */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Usar Autenticação</Text>
              <Switch
                value={useAuthentication}
                onValueChange={setUseAuthentication}
                trackColor={{ false: theme.secundaryText, true: theme.primary }}
                thumbColor={useAuthentication ? theme.accent : theme.secundaryText}
              />
            </View>

            {useAuthentication && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Token de Acesso</Text>
                  <TextInput
                    style={styles.input}
                    value={token}
                    onChangeText={setToken}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    placeholderTextColor={theme.secundaryText}
                    secureTextEntry={true}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="seu-usuario"
                    placeholderTextColor={theme.secundaryText}
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}
          </View>
        )}

        {/* Botão de Exemplo */}
        <TouchableOpacity style={styles.exampleButton} onPress={fillExampleData}>
          <MaterialIcons name="lightbulb-outline" size={16} color={theme.accent} />
          <Text style={styles.exampleButtonText}>Preencher com Exemplo</Text>
        </TouchableOpacity>

        {/* Informações de Ajuda */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>
            <Ionicons name="information-circle" size={16} color={theme.accent} /> Formatos Suportados
          </Text>
          <Text style={styles.helpText}>
            • CSV: data,valor ou data,hora,valor,contexto{'\n'}
            • JSON: {"{data, valor, contexto}"}{'\n'}
            • TSV: data	valor	contexto{'\n'}
            • Espaços: data valor contexto
          </Text>
        </View>
      </ScrollView>

      {/* Botão de Importação */}
      <TouchableOpacity
        style={[styles.importButton, !isFormValid && styles.importButtonDisabled]}
        onPress={handleImport}
        disabled={!isFormValid || isImporting}
      >
        <LinearGradient
          colors={isFormValid ? ['#10b981', '#059669'] : ['#6b7280', '#4b5563']}
          style={styles.importButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isImporting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.importButtonText}>Importando...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="cloud-download" size={20} color="#fff" />
              <Text style={styles.importButtonText}>Importar Dados</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {renderResultModal()}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.secundaryText,
    marginBottom: 24,
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    flexDirection: 'row',
    alignItems: 'center',
  },
  advancedSection: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: theme.text,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  exampleButtonText: {
    fontSize: 14,
    color: theme.accent,
    marginLeft: 8,
    fontWeight: '500',
  },
  helpSection: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: theme.secundaryText,
    lineHeight: 18,
  },
  importButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal de Resultado
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  resultContent: {
    maxHeight: 300,
  },
  resultSection: {
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.secundaryText,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  successText: {
    color: '#10b981',
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
  },
  closeButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});




