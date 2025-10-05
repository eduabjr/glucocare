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
  Modal,
  ScrollView,
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
import { addReading, listReadings, deleteReading } from '../services/dbService';
import { useReadings } from '../context/ReadingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GitImport from '../components/device/GitImport';
import { GitImportResult } from '../services/gitImportService';
// import { linkingService, FileLinkingResult } from "../services/linkingService";

interface ConnectionProps {
  navigation: any;
}

const DeviceConnectionScreen: React.FC<ConnectionProps> = ({ navigation: _navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const { loadReadings, deleteReading: contextDeleteReading } = useReadings();
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
  const [showGitImport, setShowGitImport] = useState(false);
  
  // Estado para dispositivo conectado (usado para exibir status)
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  
  // Estado para arquivo compartilhado
  // const [sharedFileResult, setSharedFileResult] = useState<FileLinkingResult | null>(null);
  // const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // Estado para modo de teste
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Estados para modais
  const [showAllMeasurements, setShowAllMeasurements] = useState(false);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  
  // Estado para controlar atualização do ícone de conexão
  const [connectionStatus, setConnectionStatus] = useState(false);
  
  // Estados para popup e animação
  const [showDataPopup, setShowDataPopup] = useState(false);
  const [dataPopupMessage, setDataPopupMessage] = useState('');
  const [isInfoButtonBlinking, setIsInfoButtonBlinking] = useState(false);
  
  // Estado para notificação de primeira visita
  const [showFirstTimeNotification, setShowFirstTimeNotification] = useState(false);

  // Função para fazer o InfoButton piscar
  const blinkInfoButton = () => {
    setIsInfoButtonBlinking(true);
    setTimeout(() => {
      setIsInfoButtonBlinking(false);
    }, 3000); // Pisca por 3 segundos
  };

  // Função para mostrar popup de dados capturados
  const showDataCapturedPopup = (count: number) => {
    setDataPopupMessage(`${count} dados foram capturados com sucesso!`);
    setShowDataPopup(true);
    blinkInfoButton();
    
    // Fecha o popup automaticamente após 3 segundos
    setTimeout(() => {
      setShowDataPopup(false);
    }, 3000);
  };

  // Função para verificar se é a primeira visita
  const checkFirstTimeVisit = async () => {
    try {
      const hasVisited = await AsyncStorage.getItem('DeviceConnectionScreen_visited');
      if (!hasVisited) {
        // É a primeira visita
        setShowFirstTimeNotification(true);
        // Marca como visitado
        await AsyncStorage.setItem('DeviceConnectionScreen_visited', 'true');
      }
    } catch (error) {
      console.error('Erro ao verificar primeira visita:', error);
    }
  };

  // Função para fechar a notificação de primeira visita
  const closeFirstTimeNotification = () => {
    setShowFirstTimeNotification(false);
  };

  // Função para simular leituras de teste
  const generateTestReadings = () => {
    const testReadings: GlucoseReading[] = [
      {
        id: '1',
        value: 120,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        mealContext: 'jejum',
        deviceName: 'Glicosímetro Teste'
      },
      {
        id: '2',
        value: 145,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
        mealContext: 'pos-refeicao',
        deviceName: 'Glicosímetro Teste'
      },
      {
        id: '3',
        value: 98,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
        mealContext: 'pre-refeicao',
        deviceName: 'Glicosímetro Teste'
      },
      {
        id: '4',
        value: 165,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 horas atrás
        mealContext: 'pos-refeicao',
        deviceName: 'Glicosímetro Teste'
      },
      {
        id: '5',
        value: 110,
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 horas atrás
        mealContext: 'jejum',
        deviceName: 'Glicosímetro Teste'
      }
    ];
    return testReadings;
  };

  // Função para ativar/desativar modo de teste
  const toggleTestMode = () => {
    console.log('Botão de teste pressionado! Modo atual:', isTestMode);
    if (isTestMode) {
      setIsTestMode(false);
      setRecentReadings([]);
      console.log('Modo teste DESATIVADO');
    } else {
      setIsTestMode(true);
      setRecentReadings(generateTestReadings());
      console.log('Modo teste ATIVADO - Leituras de teste adicionadas:', generateTestReadings().length);
    }
  };

  useEffect(() => {
    // Verifica se é a primeira visita
    checkFirstTimeVisit();

    // Configura callback de progresso do serviço de sincronização
    glucoseSyncService.setProgressCallback((progress) => {
      setSyncProgress(progress);
      
      if (progress.status === 'completed') {
        setIsSyncing(false);
      } else if (progress.status === 'error') {
        setIsSyncing(false);
      }
    });

    // Verifica status de conexão periodicamente
    const checkConnectionStatus = () => {
      const isConnected = glucoseSyncService.isBluetoothConnected();
      console.log('Status de conexão Bluetooth:', isConnected);
      setConnectionStatus(isConnected);
    };

    // Verifica imediatamente
    checkConnectionStatus();

    // Verifica a cada 2 segundos
    const interval = setInterval(checkConnectionStatus, 2000);

    return () => clearInterval(interval);

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
    console.log('Botão "Ler Dados" pressionado');
    console.log('Status de conexão (estado):', connectionStatus);
    console.log('Status de conexão (serviço):', glucoseSyncService.isBluetoothConnected());
    
    if (!connectionStatus) {
      console.log('Nenhum dispositivo conectado - mostrando alert');
      Alert.alert("Erro", "Nenhum dispositivo conectado");
      return;
    }

    try {
      console.log('Tentando ler dados do dispositivo...');
      const readings = await glucoseSyncService.readSingleData();
      console.log('Dados lidos com sucesso:', readings.length, 'leituras');
      
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

  const handleGitImportComplete = (result: GitImportResult) => {
    setShowGitImport(false);
    if (result.success) {
      loadReadings(); // Recarrega as leituras
      Alert.alert(
        'Importação Concluída',
        `${result.metadata.validRows} leituras foram importadas com sucesso do Git.`
      );
    }
  };

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
            onPress={() => setShowDeviceInfo(true)}
          >
            <MaterialIcons name="info-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.infoButton,
              isInfoButtonBlinking && styles.infoButtonBlinking
            ]}
            onPress={() => setShowAllMeasurements(true)}
          >
            <MaterialCommunityIcons 
              name="format-list-bulleted" 
              size={20} 
              color={isInfoButtonBlinking ? '#ff6b6b' : theme.primary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.centerIcon}>
          <View style={[styles.circleIcon, { 
            backgroundColor: connectionStatus 
              ? theme.primary + '30' 
              : theme.secundaryText + '20' 
          }]}>
            <MaterialCommunityIcons 
              name={connectionStatus ? "bluetooth" : "bluetooth-off"} 
              size={40} 
              color={connectionStatus ? theme.primary : theme.secundaryText} 
            />
          </View>
          {/* Debug info */}
          <Text style={{ fontSize: 12, color: theme.secundaryText, marginTop: 4 }}>
            Status: {connectionStatus ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>






        {/* Botão de Sincronização Automática */}
        <TouchableOpacity
          style={styles.actionButtonWrapper}
          onPress={isSyncing ? stopSync : startAutoSync}
          disabled={false}
        >
          <LinearGradient
            colors={isSyncing ? ['#fef2f2', '#fee2e2'] : ['#1e3a8a', '#1e40af']}
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
                color="#ffffff" 
              />
            )}
            <Text style={[styles.buttonText, { color: isSyncing ? theme.text : '#ffffff' }]}>
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



        {/* Botões Ler Dados e Limpar */}
        <View style={styles.mainButtons}>
          <TouchableOpacity 
            style={styles.actionButtonWrapper} 
            onPress={() => {
              console.log('=== BOTÃO LER DADOS PRESSIONADO ===');
              console.log('Status de conexão:', connectionStatus ? 'Conectado' : 'Desconectado');
              
              if (connectionStatus) {
                // Simular dados lidos do Bluetooth
                const simulatedReadings = [
                  {
                    id: 'bt-read-1',
                    value: 125,
                    timestamp: new Date(),
                    mealContext: 'jejum' as const,
                    deviceName: 'Glicosímetro Bluetooth'
                  },
                  {
                    id: 'bt-read-2',
                    value: 155,
                    timestamp: new Date(Date.now() - 30 * 60 * 1000),
                    mealContext: 'pos-refeicao' as const,
                    deviceName: 'Glicosímetro Bluetooth'
                  }
                ];
                
                // Salvar dados no banco de dados
                const saveReadingsToDB = async () => {
                  try {
                    let savedCount = 0;
                    for (const reading of simulatedReadings) {
                      const dbReading = {
                        id: reading.id,
                        glucose_level: reading.value,
                        timestamp: reading.timestamp.getTime(),
                        measurement_time: reading.timestamp.toISOString(),
                        meal_context: reading.mealContext,
                        time_since_meal: null,
                        notes: `Importado via Bluetooth - ${reading.deviceName}`
                      };
                      
                      console.log('Salvando leitura no DB:', dbReading);
                      await addReading(dbReading);
                      savedCount++;
                    }
                    
                    console.log(`${savedCount} leituras salvas no banco de dados com sucesso!`);
                    return savedCount;
                  } catch (error) {
                    console.error('Erro ao salvar leituras no banco:', error);
                    return 0;
                  }
                };

                // Executar salvamento e atualizar UI
                saveReadingsToDB().then(async (savedCount) => {
                  if (savedCount > 0) {
                    setRecentReadings(simulatedReadings);
                    console.log('Dados salvos e exibidos:', savedCount, 'leituras');
                    
                    // Atualizar contexto para que outras telas vejam os novos dados
                    try {
                      await loadReadings();
                      console.log('Contexto de leituras atualizado com sucesso');
                    } catch (error) {
                      console.error('Erro ao atualizar contexto:', error);
                    }
                    
                    // Mostra popup e faz InfoButton piscar
                    showDataCapturedPopup(savedCount);
                  } else {
                    Alert.alert("Erro", "Não foi possível salvar os dados no banco");
                  }
                });
              } else {
                console.log('Dispositivo não conectado - não é possível ler dados');
                Alert.alert("Erro", "Dispositivo não conectado");
              }
            }}
          >
            <LinearGradient
              colors={['#dbeafe', '#bfdbfe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <MaterialCommunityIcons 
                name="download" 
                size={16} 
                color="#2563eb" 
                style={{ marginRight: 6 }}
              />
              <Text style={styles.readDataText}>Ler Dados</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButtonWrapper} 
            onPress={() => {
              console.log('=== BOTÃO LIMPAR PRESSIONADO ===');
              
              // Mostrar confirmação antes de limpar
              Alert.alert(
                "Confirmar Limpeza",
                "Tem certeza que deseja limpar todas as leituras importadas via Bluetooth? Esta ação não pode ser desfeita.",
                [
                  {
                    text: "Cancelar",
                    style: "cancel"
                  },
                  {
                    text: "Limpar",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        console.log('Iniciando limpeza das leituras...');
                        
                        // Buscar todas as leituras do banco
                        const allReadings = await listReadings();
                        
                        // Filtrar apenas leituras importadas via Bluetooth
                        const bluetoothReadings = allReadings.filter(reading => 
                          reading.notes && reading.notes.includes('Importado via Bluetooth')
                        );
                        
                        console.log(`Encontradas ${bluetoothReadings.length} leituras Bluetooth para remover`);
                        
                        if (bluetoothReadings.length === 0) {
                          Alert.alert("Info", "Nenhuma leitura importada via Bluetooth encontrada para remover.");
                          return;
                        }
                        
                        // Remover cada leitura do banco
                        let deletedCount = 0;
                        for (const reading of bluetoothReadings) {
                          try {
                            await contextDeleteReading(reading.id);
                            deletedCount++;
                            console.log(`Leitura ${reading.id} removida do banco`);
                          } catch (error) {
                            console.error(`Erro ao remover leitura ${reading.id}:`, error);
                          }
                        }
                        
                        // Limpar estado local
                        setRecentReadings([]);
                        
                        // Atualizar contexto
                        await loadReadings();
                        
                        console.log(`${deletedCount} leituras removidas com sucesso`);
                        
                        // Mostrar confirmação
                        Alert.alert(
                          "Limpeza Concluída", 
                          `${deletedCount} leitura(s) importada(s) via Bluetooth foram removidas com sucesso.`
                        );
                        
                      } catch (error) {
                        console.error('Erro durante a limpeza:', error);
                        Alert.alert("Erro", "Ocorreu um erro ao limpar as leituras. Tente novamente.");
                      }
                    }
                  }
                ]
              );
            }}
          >
            <LinearGradient
              colors={['#fef2f2', '#fee2e2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <MaterialCommunityIcons 
                name="broom" 
                size={16} 
                color="#dc2626" 
                style={{ marginRight: 6 }}
              />
              <Text style={styles.clearText}>Limpar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );


  // Renderiza seção de importação de arquivos
  const renderFileImport = () => (
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

      {/* Botão para Importação Git */}
      <TouchableOpacity 
        style={styles.gitImportButton}
        onPress={() => setShowGitImport(true)}
      >
        <MaterialIcons name="cloud-download" size={20} color={theme.accent} />
        <Text style={styles.gitImportButtonText}>Importar do GitHub</Text>
        <MaterialIcons name="keyboard-arrow-right" size={20} color={theme.secundaryText} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        {renderHeader()}
        {renderFileImport()}
      </ScrollView>

      {/* Modal de Importação Git */}
      <Modal
        visible={showGitImport}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Importar do GitHub
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowGitImport(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <GitImport onImportComplete={handleGitImportComplete} />
        </View>
      </Modal>

      {/* Modal de Informações dos Aparelhos */}
    <Modal
      visible={showDeviceInfo}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Aparelhos Suportados
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDeviceInfo(false)}
          >
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={[styles.deviceCard, { backgroundColor: theme.card }]}>
            <View style={styles.deviceHeader}>
              <MaterialCommunityIcons name="hospital-box" size={24} color={theme.primary} />
              <Text style={[styles.deviceBrand, { color: theme.text }]}>Accu-Chek (Roche)</Text>
            </View>
            <Text style={[styles.deviceModels, { color: theme.secundaryText }]}>
              Guide, Performa, Aviva Connect
            </Text>
          </View>

          <View style={[styles.deviceCard, { backgroundColor: theme.card }]}>
            <View style={styles.deviceHeader}>
              <MaterialCommunityIcons name="hospital-box" size={24} color={theme.primary} />
              <Text style={[styles.deviceBrand, { color: theme.text }]}>FreeStyle (Abbott)</Text>
            </View>
            <Text style={[styles.deviceModels, { color: theme.secundaryText }]}>
              Libre, Lite, Optium
            </Text>
          </View>

          <View style={[styles.deviceCard, { backgroundColor: theme.card }]}>
            <View style={styles.deviceHeader}>
              <MaterialCommunityIcons name="hospital-box" size={24} color={theme.primary} />
              <Text style={[styles.deviceBrand, { color: theme.text }]}>OneTouch (LifeScan)</Text>
            </View>
            <Text style={[styles.deviceModels, { color: theme.secundaryText }]}>
              Verio, Select, Ultra
            </Text>
          </View>

          <View style={[styles.deviceCard, { backgroundColor: theme.card }]}>
            <View style={styles.deviceHeader}>
              <MaterialCommunityIcons name="hospital-box" size={24} color={theme.primary} />
              <Text style={[styles.deviceBrand, { color: theme.text }]}>Contour (Bayer)</Text>
            </View>
            <Text style={[styles.deviceModels, { color: theme.secundaryText }]}>
              Next, Plus, One
            </Text>
          </View>

          <View style={[styles.deviceCard, { backgroundColor: theme.card }]}>
            <View style={styles.deviceHeader}>
              <MaterialCommunityIcons name="hospital-box" size={24} color={theme.primary} />
              <Text style={[styles.deviceBrand, { color: theme.text }]}>GlucoMen (Menarini)</Text>
            </View>
            <Text style={[styles.deviceModels, { color: theme.secundaryText }]}>
              Areo, Xceed, Day
            </Text>
          </View>

          <View style={[styles.deviceCard, { backgroundColor: theme.card }]}>
            <View style={styles.deviceHeader}>
              <MaterialCommunityIcons name="hospital-box" size={24} color={theme.primary} />
              <Text style={[styles.deviceBrand, { color: theme.text }]}>CareSens (i-SENS)</Text>
            </View>
            <Text style={[styles.deviceModels, { color: theme.secundaryText }]}>
              N, Premium, Dual
            </Text>
          </View>

          <View style={[styles.deviceCard, { backgroundColor: theme.card }]}>
            <View style={styles.deviceHeader}>
              <MaterialCommunityIcons name="hospital-box" size={24} color={theme.primary} />
              <Text style={[styles.deviceBrand, { color: theme.text }]}>Fora (Fora Care)</Text>
            </View>
            <Text style={[styles.deviceModels, { color: theme.secundaryText }]}>
              TD-4227, TN'G, 6 Connect
            </Text>
          </View>

          <View style={[styles.deviceCard, { backgroundColor: theme.card }]}>
            <View style={styles.deviceHeader}>
              <MaterialCommunityIcons name="bluetooth" size={24} color={theme.primary} />
              <Text style={[styles.deviceBrand, { color: theme.text }]}>Outros Aparelhos</Text>
            </View>
            <Text style={[styles.deviceModels, { color: theme.secundaryText }]}>
              Compatíveis com Bluetooth 4.0+
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>

    {/* Modal de Todas as Medições */}
    <Modal
      visible={showAllMeasurements}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Todas as Medições Bluetooth
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAllMeasurements(false)}
          >
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={recentReadings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.measurementCard, { backgroundColor: theme.card }]}>
              <View style={styles.measurementHeader}>
                <Text style={[styles.measurementValue, { color: theme.text }]}>
                  {item.value} mg/dL
                </Text>
                <Text style={[styles.measurementDate, { color: theme.secundaryText }]}>
                  {item.timestamp.toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <View style={styles.measurementDetails}>
                <Text style={[styles.measurementTime, { color: theme.secundaryText }]}>
                  {item.timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                {item.deviceName && (
                  <Text style={[styles.measurementDevice, { color: theme.primary }]}>
                    {item.deviceName}
                  </Text>
                )}
                {item.mealContext && (
                  <View style={styles.mealContextContainer}>
                    <Text style={[styles.mealContextLabel, { color: theme.secundaryText }]}>
                      Contexto: {item.mealContext}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyModalState}>
              <MaterialCommunityIcons 
                name="bluetooth-off" 
                size={64} 
                color={theme.secundaryText} 
              />
              <Text style={[styles.emptyModalText, { color: theme.text }]}>
                Nenhuma medição encontrada
              </Text>
              <Text style={[styles.emptyModalSubtext, { color: theme.secundaryText }]}>
                Conecte um glicosímetro para ver as medições aqui
              </Text>
            </View>
          )}
          style={styles.modalList}
        />
      </View>
    </Modal>

    {/* Notificação de primeira visita */}
    {showFirstTimeNotification && (
      <View style={styles.popupOverlay}>
        <View style={[styles.popupContainer, { backgroundColor: theme.card }]}>
          <MaterialCommunityIcons 
            name="information" 
            size={32} 
            color={theme.primary} 
            style={{ marginBottom: 12 }}
          />
          <Text style={[styles.popupTitle, { color: theme.text }]}>
            Bem-vindo!
          </Text>
          <Text style={[styles.popupMessage, { color: theme.secundaryText }]}>
            Para saber quais aparelhos funcionam com conexão Bluetooth, toque no ícone de informação (i) ao lado do título "Conexão Bluetooth".
          </Text>
          <TouchableOpacity
            style={[styles.popupButton, { backgroundColor: theme.primary }]}
            onPress={closeFirstTimeNotification}
          >
            <Text style={styles.popupButtonText}>Entendi</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}

    {/* Popup de dados capturados */}
    {showDataPopup && (
      <View style={styles.popupOverlay}>
        <View style={[styles.popupContainer, { backgroundColor: theme.card }]}>
          <MaterialCommunityIcons 
            name="check-circle" 
            size={32} 
            color="#059669" 
            style={{ marginBottom: 12 }}
          />
          <Text style={[styles.popupTitle, { color: theme.text }]}>
            Dados Capturados!
          </Text>
          <Text style={[styles.popupMessage, { color: theme.secundaryText }]}>
            {dataPopupMessage}
          </Text>
          <Text style={[styles.popupSubtext, { color: theme.secundaryText }]}>
            Toque no ícone de lista para ver as medições
          </Text>
        </View>
      </View>
    )}
    </View>
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
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginLeft: 8, color: theme.text, flex: 1, marginRight: 8 },
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


  actionButtonWrapper: {
    flex: 1,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    marginHorizontal: 6,
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

  gitImportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  gitImportButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
    flex: 1,
    marginLeft: 8,
  },

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
  

  // Estilos do botão de teste
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
    textTransform: 'uppercase',
  },

  // Estilos para botões principais
  mainButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  mainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 8,
  },
  mainButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Estilos para modais
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalList: {
    flex: 1,
    padding: 20,
  },

  // Estilos para cards de dispositivos
  deviceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  deviceBrand: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceModels: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Estilos para cards de medições
  measurementCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  measurementDate: {
    fontSize: 12,
  },
  measurementDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  measurementTime: {
    fontSize: 12,
  },
  measurementDevice: {
    fontSize: 12,
    fontWeight: '500',
  },
  mealContextContainer: {
    marginTop: 4,
  },
  mealContextLabel: {
    fontSize: 11,
    fontStyle: 'italic',
  },

  // Estilos para estado vazio dos modais
  emptyModalState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyModalText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyModalSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Estilos dos botões (igual ao AddReadingScreen)
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  readDataText: { 
    color: '#2563eb', 
    fontWeight: '600', 
    fontSize: 14 
  },
  clearText: { 
    color: '#dc2626', 
    fontWeight: '600', 
    fontSize: 14 
  },

  // Estilos para popup
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popupContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  popupMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  popupSubtext: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  popupButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Estilos para animação do InfoButton
  infoButtonBlinking: {
    transform: [{ scale: 1.1 }],
    backgroundColor: '#ff6b6b20',
  },
});

export default DeviceConnectionScreen;