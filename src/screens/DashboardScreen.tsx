import { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listReadings, initDB, deleteReading } from '../services/dbService'; 
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { measurementRecommendationService, MeasurementPattern } from '../services/measurementRecommendationService';
import { getUserGlycemicGoals, classifyGlucoseReading, getGlucoseStatusStyle } from '../utils/glycemicGoals';

interface MessageOverlayProps {
  message: string | null;
  type: 'success' | 'error';
  onClose: () => void;
  showCheckEmailButton?: boolean;
  onCheckEmail?: () => void;
}

const MessageOverlay = ({ message, type, onClose, showCheckEmailButton = false, onCheckEmail }: MessageOverlayProps) => {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <Modal transparent animationType="fade" visible={!!message}>
      <View style={styles.modalOverlay}>
        <View style={styles.messageBox}>
          <MaterialIcons
            name={type === 'success' ? 'check-circle' : 'error'}
            size={40}
            color={type === 'success' ? theme.accent : theme.error}
          />
          <Text style={styles.messageText}>{message}</Text>
          
          {showCheckEmailButton && onCheckEmail && (
            <TouchableOpacity onPress={onCheckEmail} style={styles.checkEmailButton}>
              <MaterialIcons name="refresh" size={16} color="#fff" />
              <Text style={styles.checkEmailButtonText}>Verificar E-mail</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

type DashboardScreenProps = {
  navigation: { 
    addListener: (event: 'focus', callback: () => void) => () => void;
    navigate: (screen: string, params?: any) => void;
  };
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { theme } = useContext(ThemeContext);
  const { user, refreshUserEmailStatus } = useAuth();
  const styles = getStyles(theme);

  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const [measurementRecommendations, setMeasurementRecommendations] = useState<MeasurementPattern | null>(null);
  const [analyzingPatterns, setAnalyzingPatterns] = useState(false);

  // Cálculo das estatísticas
  const ultima = readings.length > 0 ? readings[0].glucose_level || 0 : 0;
  const media = readings.length > 0 
    ? Math.round(readings.reduce((sum, r) => sum + (r.glucose_level || 0), 0) / readings.length)
    : 0;
  const normais = readings.length > 0
    ? Math.round((readings.filter(r => {
        const level = Number(r.glucose_level) || 0;
        const userGoals = getUserGlycemicGoals(user?.glycemicGoals, user?.condition);
        const status = classifyGlucoseReading(level, userGoals, 'preMeal');
        return status === 'Normal';
      }).length / readings.length) * 100)
    : 0;
  const total = readings.length;

  const [patternAnalysis, setPatternAnalysis] = useState<any | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => setMessage(null);

  // Função para analisar padrões de medição e gerar recomendações
  const analyzeMeasurementPatterns = async () => {
    if (readings.length < 3) {
      console.log('Poucas medições para análise de padrões');
      return;
    }

    setAnalyzingPatterns(true);
    try {
      const recommendations = await measurementRecommendationService.generateAndScheduleRecommendations(user?.glycemicGoals, user?.condition);
      
      if (recommendations) {
        setMeasurementRecommendations(recommendations);
        console.log('Recomendações geradas:', recommendations);
        
        // Mostra mensagem de sucesso se for a primeira análise
        const hasAnalyzed = await AsyncStorage.getItem('hasAnalyzedPatterns');
        if (!hasAnalyzed) {
          showMessage(`Análise concluída! Recomendamos medir às ${recommendations.bestMeasurementTime}`, 'success');
          await AsyncStorage.setItem('hasAnalyzedPatterns', 'true');
        }
      }
    } catch (error) {
      console.error('Erro ao analisar padrões:', error);
      showMessage('Erro ao analisar padrões de medição', 'error');
    } finally {
      setAnalyzingPatterns(false);
    }
  };

  const analyzePatterns = async () => {
    if (readings.length < 3) {
      showMessage('Precisamos de pelo menos 3 medições para gerar recomendações personalizadas.', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await measurementRecommendationService.analyzeMeasurementPatterns(user?.glycemicGoals, user?.condition);
      setPatternAnalysis(analysis);
      setShowRecommendations(true);
      showMessage('🤖 Recomendações personalizadas geradas com base nas suas medições!', 'success');
    } catch (error) {
      console.error('Erro ao analisar padrões:', error);
      showMessage('Erro ao gerar recomendações. Tente novamente.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCheckEmailStatus = async () => {
    try {
      const isVerified = await refreshUserEmailStatus();
      if (isVerified) {
        showMessage('✅ E-mail verificado com sucesso! Agora você tem acesso a todas as funcionalidades.', 'success');
        setTimeout(() => {
          setMessage(null);
        }, 5000);
      } else {
        showMessage('❌ E-mail ainda não verificado. Verifique sua caixa de entrada e clique no link de verificação.', 'error');
      }
    } catch (error) {
      showMessage('❌ Erro ao verificar status do e-mail. Tente novamente.', 'error');
    }
  };

  const loadReadings = async () => {
    try {
      const data = (await listReadings()) || [];
      
      if (!Array.isArray(data)) {
        showMessage('Erro ao carregar as medições.', 'error');
        return;
      }

      const sorted = data
        .map((r) => ({ ...r, glucose_level: Number(r.glucose_level) || 0 }))
        .sort((a, b) => new Date(b.measurement_time || b.timestamp).getTime() - new Date(a.measurement_time || a.timestamp).getTime());
      
      setReadings(sorted);
    } catch (error) {
      console.error('Erro ao carregar medições:', error);
      showMessage('Não foi possível carregar as medições.', 'error');
      setReadings([]);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadReadings();
    });

    (async () => {
      try {
        setLoading(true);
        await initDB();
        await loadReadings();

        // Analisa padrões de medição para gerar recomendações
        if (readings.length >= 3) {
          analyzeMeasurementPatterns();
        }

        if (!user?.emailVerified) {
          setMessage('Por favor, verifique seu e-mail para ter acesso a todas as funcionalidades!');
          setMessageType('error');
        }
      } catch (err) {
        console.error('Dashboard - erro inicial:', err);
        showMessage('Falha ao carregar dados iniciais.', 'error');
      } finally {
        setLoading(false);
      }
    })();

    return unsubscribe;
  }, [navigation]);

  const getReadingStatus = (value: number) => {
    if (!value || isNaN(value)) return { label: 'Inválido', text: theme.secundaryText, bg: theme.background };
    
    const userGoals = getUserGlycemicGoals(user?.glycemicGoals, user?.condition);
    const status = classifyGlucoseReading(value, userGoals, 'preMeal');
    return getGlucoseStatusStyle(status);
  };

  const renderItem = ({ item }: { item: any }) => {
    if (!item) return null;

    const glucoseLevel = Number(item.glucose_level) || 0;
    const status = getReadingStatus(glucoseLevel);

    return (
      <TouchableOpacity
        style={styles.readingCard}
        onLongPress={() => handleLongPress(item.id || '')}
        activeOpacity={0.9}
      >
        <View style={styles.readingRow}>
          <Text style={styles.readingValue}>{String(glucoseLevel)} mg/dL</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.readingStatus, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.readingDate}>
          {item.measurement_time ? new Date(item.measurement_time).toLocaleString() : 'Sem data'}
        </Text>
        {longPressId === item.id && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={() => handleEditReading(item)}
            >
              <LinearGradient
                colors={['#f0f9ff', '#e0f2fe']}
                style={styles.actionButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="edit" size={16} color="#0369a1" />
                <Text style={styles.actionButtonText}>Editar</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={() => handleDeleteReading(item.id || '')}
            >
              <LinearGradient
                colors={['#fef2f2', '#fee2e2']}
                style={styles.actionButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="delete" size={16} color="#dc2626" />
                <Text style={styles.actionButtonText}>Excluir</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleLongPress = (id: string) => {
    setLongPressId((currentId) => (currentId === id ? null : id));
  };

  const handleEditReading = (reading: any) => {
    navigation.navigate('AddReading', { readingToEdit: reading });
    setLongPressId(null); 
  };

  const handleDeleteReading = async (id: string) => {
    try {
      await deleteReading(id);
      showMessage('Medição excluída com sucesso!', 'success');
      setLongPressId(null); 
      loadReadings(); 
    } catch (err) {
      console.error('Erro ao excluir medição:', err);
      showMessage('Falha ao excluir medição.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* Botão Nova Medição no topo */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.pageSubtitle}>
                Acompanhe a glicemia e mantenha a saúde em dia
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={() => navigation.navigate('AddReading')}
            >
              <LinearGradient
                colors={['#f0f9ff', '#e0f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>+ Nova Medição</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards de estatísticas */}
        <View style={styles.cardsContainer}>
          <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
              <MaterialIcons name="show-chart" size={18} color="#fff" />
            </View>
            <Text style={styles.cardLabel}>Última Medição</Text>
            <Text style={styles.cardValue}>
              {String(ultima)} <Text style={styles.unit}>mg/dL</Text>
            </Text>
          </LinearGradient>

          <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accent }]}>
              <Ionicons name="stats-chart" size={18} color="#fff" />
            </View>
            <Text style={styles.cardLabel}>Média Geral</Text>
            <Text style={styles.cardValue}>
              {String(media)} <Text style={styles.unit}>mg/dL</Text>
            </Text>
          </LinearGradient>

          <LinearGradient colors={['#faf5ff', '#ede9fe']} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: theme.secundary }]}>
              <FontAwesome5 name="bullseye" size={16} color="#fff" />
            </View>
            <Text style={styles.cardLabel}>Medições Normais</Text>
            <Text style={styles.cardValue}>
              {String(normais)} <Text style={styles.unit}>%</Text>
            </Text>
          </LinearGradient>

          <LinearGradient colors={['#fff7ed', '#ffedd5']} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#f97316' }]}>
              <MaterialIcons name="history" size={18} color="#fff" />
            </View>
            <Text style={styles.cardLabel}>Total de Medições</Text>
            <Text style={styles.cardValue}>
              {String(total)} <Text style={styles.unit}>registros</Text>
            </Text>
          </LinearGradient>
        </View>

        {/* Medições Recentes com scroll interno */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.recentBox}>
            <Text style={styles.sectionTitle}>Medições Recentes</Text>

            <ScrollView style={styles.readingsScrollContainer} showsVerticalScrollIndicator={true}>
              {readings.map((item, index) => (
                <View key={item?.id ? String(item.id) : `reading-${index}`}>
                  {renderItem({ item })}
                </View>
              ))}
              {readings.length === 0 && (
                <View>
                  <Text style={styles.empty}>Nenhuma medição registrada.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      <MessageOverlay 
        message={message} 
        type={messageType} 
        onClose={clearMessage}
        showCheckEmailButton={messageType === 'error' && !user?.emailVerified}
        onCheckEmail={handleCheckEmailStatus}
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1, // Ocupa toda a tela disponível
    backgroundColor: theme.background,
  },
  readingsScrollContainer: {
    height: 220, // Altura fixa para exibir exatamente 3 medições
    paddingBottom: 8,
  },
  
  // Seção do header com botão Nova Medição
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 40, // Aumentado para dar mais espaço entre DrawerRoutes e DashboardScreen
    paddingBottom: 16, // Mais espaço abaixo
    backgroundColor: theme.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16, // Espaço entre o texto e o botão
  },
  pageSubtitle: { 
    fontSize: 14, 
    color: theme.secundaryText, 
    maxWidth: 200, // Reduzido para dar mais espaço ao botão
    flex: 1, // Permite que o texto ocupe o espaço disponível
  },

  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addButtonText: { color: '#0369a1', fontWeight: '700', fontSize: 16 },


  // Cards de estatísticas
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    backgroundColor: theme.background,
    gap: 12, // Espaço entre as linhas dos cards
  },
  card: {
    flexBasis: '48%',
    borderRadius: 18, // Aumentado de 16 para 18
    padding: 20, // Aumentado de 16 para 20
    marginBottom: 16, // Aumentado de 12 para 16
    elevation: 5, // Aumentado de 4 para 5
    shadowColor: '#000',
    shadowOpacity: 0.15, // Aumentado de 0.12 para 0.15
    shadowRadius: 8, // Aumentado de 6 para 8
    shadowOffset: {
      width: 0,
      height: 4, // Aumentado de 3 para 4
    },
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLabel: { color: theme.secundaryText, fontSize: 14, marginBottom: 5 },
  cardValue: { color: theme.text, fontSize: 20, fontWeight: '700' },
  unit: { fontSize: 14, fontWeight: '400', color: theme.secundaryText },

  // Seção de medições recentes (altura fixa para 3 medições)
  recentBox: {
    backgroundColor: theme.card,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 0, // Aumentado significativamente para subir a caixa inteira
    marginBottom: 0, // Removido para ir até o limite da tela
    borderRadius: 12,
    elevation: 2,
    flex: 1, // Ocupa todo o espaço disponível
    borderBottomLeftRadius: 0, // Remove borda inferior esquerda
    borderBottomRightRadius: 0, // Remove borda inferior direita
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.text,
  },
  list: { marginBottom: 20 },
  empty: { textAlign: 'center', color: theme.secundaryText, marginTop: 20 },

  readingCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    minHeight: 60, // Altura mínima para cada medição
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readingValue: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  readingStatus: { fontSize: 14, fontWeight: '700' },
  readingDate: { fontSize: 12, color: theme.secundaryText, marginTop: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBox: {
    width: 300,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  messageText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: theme.text,
  },
  checkEmailButton: {
    marginTop: 12,
    backgroundColor: theme.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkEmailButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
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
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
});
