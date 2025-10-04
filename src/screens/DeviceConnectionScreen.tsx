import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
// IMPORTANTE: O tipo 'DocumentPickerResult' não é estritamente necessário aqui,
// mas 'as any' é usado para contornar problemas de tipagem.
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialCommunityIcons,
  Feather,
  MaterialIcons,
} from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import { glucoseSyncService, SyncProgress, SyncResult } from "../services/glucoseSyncService";
import { GlucoseReading } from "../services/bluetoothService";
import { parseFileForReadings } from "../services/fileParsingService";
import { useAuth } from '../context/AuthContext';
import { addReading } from '../services/dbService';
// import { linkingService, FileLinkingResult } from "../services/linkingService";

interface ConnectionProps {
  navigation: any;
}

const DeviceConnectionScreen: React.FC<ConnectionProps> = ({ navigation: _navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const styles = getStyles(theme);

  // Estados para sincronização real
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    progress: 0,
    message: '',
    readingsCount: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [recentReadings, setRecentReadings] = useState<GlucoseReading[]>([]);
  
  // Estados para importação de arquivos
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  
  // Estado para dispositivo conectado (usado para exibir status)
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  
  // Estado para arquivo compartilhado
  // const [sharedFileResult, setSharedFileResult] = useState<FileLinkingResult | null>(null);
  // const [isProcessingFile, setIsProcessingFile] = useState(false);

  useEffect(() => {
    // Configura callback de progresso do serviço de sincronização
    glucoseSyncService.setProgressCallback((progress) => {
      setSyncProgress(progress);
      
      if (progress.status === 'completed') {
        setIsSyncing(false);
      } else if (progress.status === 'error') {
        setIsSyncing(false);
      }
    });

    // Verifica se há arquivo compartilhado para processar
    // checkForSharedFile();

    // Limpa recursos ao desmontar
    return () => {
      if (isSyncing) {
        glucoseSyncService.stopSync();
      }
    };
  }, [isSyncing]);

  // Função para verificar se há arquivo compartilhado
  // const checkForSharedFile = async () => {
  //   try {
  //     setIsProcessingFile(true);
  //     const result = await linkingService.processSharedFile();
      
  //     if (result.success && result.readings && result.readings.length > 0) {
  //       setSharedFileResult(result);
  //       Alert.alert(
  //         "Arquivo Detectado",
  //         `Arquivo ${result.fileName} encontrado com ${result.readings.length} leituras. Deseja importar?`,
  //         [
  //           { text: "Cancelar", style: "cancel" },
  //           { text: "Importar", onPress: () => importSharedFile(result) }
  //         ]
  //       );
  //     } else if (result.error) {
  //       console.log("Nenhum arquivo compartilhado ou erro:", result.error);
  //     }
  //   } catch (error) {
  //     console.error("Erro ao verificar arquivo compartilhado:", error);
  //   } finally {
  //     setIsProcessingFile(false);
  //   }
  // };

  // Função para importar arquivo compartilhado
  // const importSharedFile = async (fileResult: FileLinkingResult) => {
  //   if (!fileResult.readings) return;

  //   try {
  //     // Aqui você pode implementar a lógica para salvar as leituras
  //     // Por enquanto, apenas mostra uma mensagem de sucesso
  //     Alert.alert(
  //       "Sucesso",
  //       `${fileResult.readings.length} leituras importadas do arquivo ${fileResult.fileName}`
  //     );
      
  //     // Limpa o resultado
  //     setSharedFileResult(null);
      
  //     // Recarrega as leituras recentes
  //     // loadRecentReadings(); // TODO: Implementar função para recarregar leituras
  //   } catch (error) {
  //     console.error("Erro ao importar arquivo:", error);
  //     Alert.alert("Erro", "Não foi possível importar o arquivo.");
  //   }
  // };

  // Função para iniciar sincronização automática
  const startAutoSync = async () => {
    if (isSyncing) {
      Alert.alert("Aviso", "Sincronização já em andamento.");
      return;
    }

    setIsSyncing(true);
    setLastSyncResult(null);

    try {
      const result = await glucoseSyncService.startAutoSync();
      setLastSyncResult(result);

      if (result.success) {
        Alert.alert(
          "Sucesso", 
          `${result.readingsAdded} leituras sincronizadas do ${result.deviceName}!`
        );
      } else {
        Alert.alert("Erro", result.error || "Falha na sincronização");
      }
    } catch (error) {
      console.error("Erro na sincronização:", error);
      Alert.alert("Erro", "Falha na sincronização");
    }
  };

  // Função para parar sincronização
  const stopSync = () => {
    if (isSyncing) {
      glucoseSyncService.stopSync();
      setIsSyncing(false);
      setSyncProgress({
        status: 'idle',
        progress: 0,
        message: '',
        readingsCount: 0
      });
    }
  };

  // Função para ler dados uma única vez
  const readSingleData = async () => {
    if (!glucoseSyncService.isBluetoothConnected()) {
      Alert.alert("Erro", "Nenhum dispositivo conectado");
      return;
    }

    try {
      const readings = await glucoseSyncService.readSingleData();
      setRecentReadings(readings);
      
      Alert.alert(
        "Dados lidos", 
        `${readings.length} leituras encontradas`
      );
    } catch (error) {
      console.error("Erro ao ler dados:", error);
      Alert.alert("Erro", "Falha ao ler dados do dispositivo");
    }
  };

  // Atualiza o status do dispositivo conectado
  useEffect(() => {
    const checkConnection = () => {
      const device = glucoseSyncService.getConnectedDevice();
      setConnectedDevice(device);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleFileImport = async () => {
    if (!user?.id) {
      Alert.alert("Erro", "Usuário não logado");
      return;
    }

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/xml",
          "application/pdf",
        ],
        copyToCacheDirectory: true,
      });

      const result = res as any;

      if (result.type === 'success' && result.assets && result.assets.length > 0) {
        const fileName = result.assets[0].name;
        console.log("Arquivo selecionado:", fileName);

        try {
          setIsImporting(true);
          setImportProgress(`🤖 Analisando arquivo ${fileName}...`);
          
          // Processa o arquivo usando IA (gestão automática)
          const readings = await parseFileForReadings(result, user.id);
          
          if (readings.length > 0) {
            setImportProgress(`💾 Salvando ${readings.length} leituras no banco...`);
            
            // Salva leituras no banco de dados
            let savedCount = 0;
            let errors = 0;
            
            for (const reading of readings) {
              try {
                await addReading(reading);
                savedCount++;
              } catch (saveError) {
                console.error("Erro ao salvar leitura:", saveError);
                errors++;
              }
            }
            
            setImportProgress('');
            setIsImporting(false);
            
            if (errors > 0) {
              Alert.alert(
                "Importação Parcial", 
                `${savedCount} de ${readings.length} leituras importadas com sucesso.\n${errors} leituras falharam.\n\nArquivo: ${fileName}\n\n🤖 Análise inteligente com IA`,
                [{ text: "OK" }]
              );
            } else {
              Alert.alert(
                "✅ Importação Concluída", 
                `${savedCount} leituras importadas com sucesso!\n\nArquivo: ${fileName}\n\n🤖 Análise inteligente com IA`,
                [{ text: "OK" }]
              );
            }
            
            console.log("Leituras salvas:", savedCount, "de", readings.length, "erros:", errors);
          } else {
            setImportProgress('');
            setIsImporting(false);
            
            Alert.alert(
              "⚠️ Nenhuma Leitura Encontrada", 
              `Nenhuma leitura válida encontrada no arquivo ${fileName}.\n\n🤖 A IA não conseguiu identificar dados de glicose.\n\nTente:\n• Verificar se o arquivo contém dados de glicose\n• Usar um formato mais simples (CSV)\n• Verificar se as colunas estão nomeadas corretamente`,
              [{ text: "OK" }]
            );
          }
        } catch (parseError) {
          setImportProgress('');
          setIsImporting(false);
          
          console.error("Erro ao processar arquivo:", parseError);
          Alert.alert(
            "❌ Erro no Processamento", 
            `Não foi possível processar o arquivo ${fileName}.\n\nErro: ${parseError instanceof Error ? parseError.message : 'Erro desconhecido'}\n\n🤖 A IA falhou na análise\n\nTente:\n• Verificar se o arquivo não está corrompido\n• Usar um formato suportado (CSV, Excel, XML, PDF)\n• Verificar se contém dados de glicose`,
            [{ text: "OK" }]
          );
        }
      } else if (result.type === 'cancel') {
        console.log("Importação de arquivo cancelada.");
      } else {
        console.log("Falha na leitura ou nenhum arquivo selecionado.");
      }
    } catch (err) {
      setImportProgress('');
      setIsImporting(false);
      console.error("Erro ao importar arquivo:", err);
      Alert.alert("Erro", "Não foi possível importar o arquivo.");
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="bluetooth-connect"
            size={22}
            color={theme.primary}
          />
          <Text style={styles.cardTitle}>Conexão Bluetooth</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              Alert.alert(
                "Aparelhos Suportados",
                "• Accu-Chek Guide\n• OneTouch Verio\n• FreeStyle Libre",
                [{ text: "OK" }]
              );
            }}
          >
            <MaterialIcons name="info-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.centerIcon}>
          <View style={styles.circleIcon}>
            <MaterialCommunityIcons name="bluetooth" size={40} color={theme.primary} />
          </View>
        </View>

        <View
          style={[ 
            styles.statusBox,
            { backgroundColor: connectedDevice ? theme.accent + '20' : theme.background },
          ]}
        >
          <MaterialCommunityIcons
            name={connectedDevice ? "check-circle" : "wifi-off"}
            size={18}
            color={connectedDevice ? theme.accent : theme.secundaryText}
          />
          <Text
            style={[ 
              styles.statusText,
              { color: connectedDevice ? theme.accent : theme.secundaryText },
            ]}
          >
            {connectedDevice ? connectedDevice.name : "Desconectado"}
          </Text>
        </View>

        {/* Botão de Sincronização Automática */}
        <TouchableOpacity
          style={styles.actionButtonWrapper}
          onPress={isSyncing ? stopSync : startAutoSync}
          disabled={false}
        >
          <LinearGradient
            colors={isSyncing ? ['#fef2f2', '#fee2e2'] : ['#ecfdf5', '#d1fae5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <MaterialCommunityIcons 
                name={isSyncing ? "stop" : "bluetooth"} 
                size={18} 
                color="#059669" 
              />
            )}
            <Text style={styles.buttonText}>
              {isSyncing ? "Parar Sincronização" : "Sincronizar Glicosímetro"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Barra de Progresso */}
        {isSyncing && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${syncProgress.progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {syncProgress.message}
            </Text>
            {syncProgress.readingsCount > 0 && (
              <Text style={styles.readingsCount}>
                {syncProgress.readingsCount} leituras processadas
              </Text>
            )}
          </View>
        )}

        {/* Resultado da Última Sincronização */}
        {lastSyncResult && (
          <View style={[
            styles.resultContainer,
            { backgroundColor: lastSyncResult.success ? theme.accent + '20' : theme.error + '20' }
          ]}>
            <MaterialCommunityIcons
              name={lastSyncResult.success ? "check-circle" : "alert-circle"}
              size={20}
              color={lastSyncResult.success ? theme.accent : theme.error}
            />
            <Text style={[
              styles.resultText,
              { color: lastSyncResult.success ? theme.accent : theme.error }
            ]}>
              {lastSyncResult.success 
                ? `${lastSyncResult.readingsAdded} leituras sincronizadas`
                : `Erro: ${lastSyncResult.error}`
              }
            </Text>
          </View>
        )}

        <Text style={styles.instructions}>
          • Certifique-se que o Bluetooth está ativado{"\n"}
          • Mantenha o glicosímetro próximo ao dispositivo{"\n"}
          • A sincronização é automática e segura{"\n"}
          • Dados são salvos localmente e sincronizados
        </Text>

        {/* Botões Adicionais */}
        <View style={styles.additionalButtons}>
          <TouchableOpacity
            style={[styles.additionalButton, { backgroundColor: theme.card }]}
            onPress={readSingleData}
            disabled={!glucoseSyncService.isBluetoothConnected()}
          >
            <MaterialCommunityIcons 
              name="download" 
              size={16} 
              color={theme.primary} 
            />
            <Text style={[styles.additionalButtonText, { color: theme.primary }]}>
              Ler Dados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.additionalButton, { backgroundColor: theme.card }]}
            onPress={() => setRecentReadings([])}
            disabled={recentReadings.length === 0}
          >
            <MaterialCommunityIcons 
              name="refresh" 
              size={16} 
              color={theme.secundary} 
            />
            <Text style={[styles.additionalButtonText, { color: theme.secundary }]}>
              Limpar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="upload" size={20} color={theme.accent} />
          <Text style={styles.cardTitle}>Importar Arquivo</Text>
        </View>

        {/* Indicador de Progresso */}
        {isImporting && importProgress && (
          <View style={styles.importProgressContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.importProgressText, { color: theme.text }]}>{importProgress}</Text>
          </View>
        )}


        <TouchableOpacity 
          style={[
            styles.uploadBox, 
            isImporting && styles.uploadBoxDisabled
          ]} 
          onPress={handleFileImport}
          disabled={isImporting}
        >
          <View style={styles.uploadIconContainer}>
            <MaterialCommunityIcons 
              name={isImporting ? "loading" : "file-upload"} 
              size={48} 
              color={isImporting ? theme.secundaryText : theme.accent} 
            />
            <View style={styles.uploadIconOverlay}>
              <MaterialCommunityIcons 
                name={isImporting ? "loading" : "plus"} 
                size={20} 
                color="#fff" 
              />
            </View>
          </View>
          <Text style={[
            styles.uploadText,
            isImporting && styles.uploadTextDisabled
          ]}>
            {isImporting ? importProgress : "Arraste seu arquivo aqui ou clique para selecionar"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.formats}>
          Formatos aceitos: CSV (.csv) · Excel (.xlsx) · XML (.xml) · PDF (.pdf)
        </Text>

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color={theme.primary} />
          <Text style={styles.infoText}>
            Como exportar do seu glicosímetro: conecte o dispositivo no
            computador e exporte os dados como CSV ou PDF através do software do
            fabricante.
          </Text>
        </View>

        {/* Seção para arquivo compartilhado */}
        {/* {sharedFileResult && (
          <View style={styles.sharedFileBox}>
            <View style={styles.sharedFileHeader}>
              <MaterialCommunityIcons name="file-check" size={20} color={theme.primary} />
              <Text style={styles.sharedFileTitle}>Arquivo Processado</Text>
            </View>
            <Text style={styles.sharedFileName}>{sharedFileResult.fileName}</Text>
            <Text style={styles.sharedFileInfo}>
              {sharedFileResult.readings?.length || 0} leituras encontradas
            </Text>
            <TouchableOpacity 
              style={styles.importButton} 
              onPress={() => importSharedFile(sharedFileResult)}
            >
              <Text style={styles.importButtonText}>Importar Leituras</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setSharedFileResult(null)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )} */}
      </View>

    </View>
  );

  // Renderiza leituras recentes
  const renderRecentReading = ({ item }: { item: GlucoseReading }) => (
    <View style={styles.readingItem}>
      <View style={styles.readingInfo}>
        <Text style={styles.readingValue}>{item.value} mg/dL</Text>
        <Text style={styles.readingTime}>
          {item.timestamp.toLocaleString('pt-BR')}
        </Text>
        {item.deviceName && (
          <Text style={styles.readingDevice}>{item.deviceName}</Text>
        )}
      </View>
      {item.mealContext && (
        <View style={styles.mealContextBadge}>
          <Text style={styles.mealContextText}>{item.mealContext}</Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={recentReadings}
      keyExtractor={(item) => item.id}
      renderItem={renderRecentReading}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        recentReadings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="bluetooth-off" 
              size={48} 
              color={theme.secundaryText} 
            />
            <Text style={styles.emptyStateText}>
              Nenhuma leitura encontrada
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Conecte um glicosímetro para sincronizar dados
            </Text>
          </View>
        ) : null
      }
      style={styles.container}
    />
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.background },

  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontWeight: "600", marginLeft: 8, color: theme.text, flex: 1 },
  infoButton: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: theme.primary + '10',
  },

  centerIcon: { alignItems: "center", marginVertical: 10 },
  circleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary + '20',
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  statusBox: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 14,
  },
  statusText: { fontSize: 14, marginLeft: 6 },

  actionButtonWrapper: {
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    marginBottom: 12,
  },
  gradientButton: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonText: { color: theme.text, fontWeight: "600", fontSize: 14, marginLeft: 6 },

  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.secundaryText,
  },
  deviceName: { fontSize: 15, fontWeight: "600", color: theme.text },
  deviceId: { fontSize: 12, color: theme.secundaryText },

  instructions: { fontSize: 13, color: theme.secundaryText, marginTop: 10, lineHeight: 20 },

  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.secundaryText,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: theme.background,
  },
  uploadIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  uploadIconOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.background,
  },
  uploadText: {
    fontSize: 13,
    color: theme.secundaryText,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6,
  },
  formats: { fontSize: 12, color: theme.secundaryText, marginBottom: 12 },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.primary + '20',
    borderRadius: 8,
    padding: 10,
  },
  infoText: { flex: 1, marginLeft: 6, fontSize: 12, color: theme.primary },


  // Novos estilos para sincronização
  progressContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.card,
    borderRadius: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.secundaryText + '30',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  readingsCount: {
    fontSize: 11,
    color: theme.secundaryText,
    textAlign: 'center',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  additionalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  additionalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  additionalButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Estilos para leituras recentes
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  readingInfo: {
    flex: 1,
  },
  readingValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  readingTime: {
    fontSize: 12,
    color: theme.secundaryText,
    marginBottom: 2,
  },
  readingDevice: {
    fontSize: 11,
    color: theme.primary,
    fontWeight: '500',
  },
  mealContextBadge: {
    backgroundColor: theme.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealContextText: {
    fontSize: 10,
    color: theme.accent,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Estado vazio
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: theme.secundaryText,
    marginTop: 4,
    textAlign: 'center',
  },

  // Estilos para arquivo compartilhado
  sharedFileBox: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.primary + '30',
  },
  sharedFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sharedFileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  sharedFileName: {
    fontSize: 13,
    color: theme.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  sharedFileInfo: {
    fontSize: 12,
    color: theme.secundaryText,
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.secundaryText + '40',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.secundaryText,
  },
  
  // Estilos para progresso e IA
  importProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  importProgressText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadBoxDisabled: {
    opacity: 0.6,
  },
  uploadTextDisabled: {
    opacity: 0.7,
  },
});

export default DeviceConnectionScreen;
