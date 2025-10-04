import { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { listReadings, initDB, deleteReading } from '../services/dbService'; 
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { measurementRecommendationService, PatternAnalysis, TimeRecommendation } from '../services/measurementRecommendationService';

// CORREÇÃO 1.2: Adicionando tipagem para os props
interface MessageOverlayProps {
  message: string | null;
  type: 'success' | 'error';
  onClose: () => void;
  showCheckEmailButton?: boolean;
  onCheckEmail?: () => void;
}

// Componente de mensagem de alerta personalizado
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

const WINDOW_HEIGHT = Dimensions.get('window').height;

// CORREÇÃO 1.5: Adicionando a tipagem do navigation
type DashboardScreenProps = {
  navigation: { 
    addListener: (event: 'focus', callback: () => void) => () => void;
    navigate: (screen: string, params?: any) => void;
  };
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { theme } = useContext(ThemeContext);
  const { user, refreshUserEmailStatus } = useAuth(); // ✅ NOVO: Importa função de verificação
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();

  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [longPressId, setLongPressId] = useState<string | null>(null);
  
  // Estados para recomendações de IA
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysis | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // alturas medidas via onLayout
  const [headerHeight, setHeaderHeight] = useState(0);
  const [cardsHeight, setCardsHeight] = useState(0);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => setMessage(null);

  // Função para analisar padrões e gerar recomendações
  const analyzePatterns = async () => {
    if (readings.length < 3) {
      showMessage('Precisamos de pelo menos 3 medições para gerar recomendações personalizadas.', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await measurementRecommendationService.analyzeMeasurementPatterns(readings);
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

  // ✅ NOVA FUNÇÃO: Verifica status do email
  const handleCheckEmailStatus = async () => {
    try {
      const isVerified = await refreshUserEmailStatus();
      if (isVerified) {
        showMessage('✅ E-mail verificado com sucesso! Agora você tem acesso a todas as funcionalidades.', 'success');
        // Remove a mensagem de erro após 5 segundos
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadReadings();
    });

    (async () => {
      try {
        setLoading(true);
        await initDB();
        await loadReadings();

        // Verifica o status de verificação de e-mail ao acessar a Dashboard
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

  const loadReadings = async () => {
    try {
      const data = (await listReadings()) || [];

      if (Array.isArray(data)) {
        const sorted = data
          .map((r) => ({ ...r, glucose_level: Number(r.glucose_level) || 0 }))
          .sort((a, b) => new Date(b.measurement_time || b.timestamp).getTime() - new Date(a.measurement_time || a.timestamp).getTime());
        setReadings(sorted);
      } else {
        setReadings([]);
      }
    } catch (error) {
      console.error('Erro ao carregar medições:', error);
      showMessage('Não foi possível carregar as medições.', 'error');
      setReadings([]);
    }
  };

  const getReadingStatus = (value: number) => {
    if (!value || isNaN(value)) return { label: 'Inválido', text: theme.secundaryText, bg: theme.background };
    if (value < 70) return { label: 'Baixo', text: '#b45309', bg: '#fef3c7' };
    if (value > 180) return { label: 'Alto', text: '#b91c1c', bg: '#fee2e2' };
    return { label: 'Normal', text: '#047857', bg: '#d1fae5' };
  };

  // KPIs
  const ultima = readings.length > 0 ? readings[0]?.glucose_level ?? '-' : '-';
  const media =
    readings.length > 0
      ? Math.round(
          readings.reduce((sum, r) => sum + (Number(r.glucose_level) || 0), 0) / readings.length
        )
      : '-';
  const normais =
    readings.length > 0
      ? Math.round(
          (readings.filter((r) => Number(r.glucose_level) >= 70 && Number(r.glucose_level) <= 180)
            .length /
            readings.length) *
            100
        )
      : 0;
  const total = readings.length;

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
    setLongPressId(null); // Fecha os botões de ação
  };

  const handleDeleteReading = async (id: string) => {
    try {
      await deleteReading(id); // Função de exclusão da medição
      showMessage('Medição excluída com sucesso!', 'success');
      setLongPressId(null); // Fecha o botão de exclusão
      loadReadings(); // Recarrega as leituras após a exclusão
    } catch (err) {
      console.error('Erro ao excluir medição:', err);
      showMessage('Falha ao excluir medição.', 'error');
    }
  };

  const listHeight = WINDOW_HEIGHT - insets.top - insets.bottom - headerHeight - cardsHeight - 120;

  return (
    <SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom + 12 }]} edges={['top', 'bottom']}>
      <View
        style={styles.headerRow}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setHeaderHeight(h);
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.pageSubtitle}>
            Acompanhe sua glicemia e mantenha sua saúde em dia
          </Text>
        </View>
        <View style={styles.buttonContainer}>
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
          
          <TouchableOpacity
            style={styles.actionButtonWrapper}
            onPress={analyzePatterns}
            disabled={analyzing || readings.length < 3}
          >
            <LinearGradient
              colors={analyzing || readings.length < 3 ? ['#f3f4f6', '#e5e7eb'] : ['#fef3c7', '#fde68a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButton}
            >
              {analyzing ? (
                <ActivityIndicator size="small" color="#d97706" />
              ) : (
                <MaterialIcons name="psychology" size={16} color="#d97706" />
              )}
              <Text style={[styles.addButtonText, { color: '#d97706' }]}>
                {analyzing ? 'Analisando...' : 'Recomendações IA'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={styles.cardsContainer}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setCardsHeight(h);
        }}
      >
        <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
            <MaterialIcons name="show-chart" size={20} color="#fff" />
          </View>
          <Text style={styles.cardLabel}>Última Medição</Text>
          <Text style={styles.cardValue}>
            {String(ultima)} <Text style={styles.unit}>mg/dL</Text>
          </Text>
        </LinearGradient>

        <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: theme.accent }]}>
            <Ionicons name="stats-chart" size={20} color="#fff" />
          </View>
          <Text style={styles.cardLabel}>Média Geral</Text>
          <Text style={styles.cardValue}>
            {String(media)} <Text style={styles.unit}>mg/dL</Text>
          </Text>
        </LinearGradient>

        <LinearGradient colors={['#faf5ff', '#ede9fe']} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: theme.secundary }]}>
            <FontAwesome5 name="bullseye" size={18} color="#fff" />
          </View>
          <Text style={styles.cardLabel}>Medições Normais</Text>
          <Text style={styles.cardValue}>
            {String(normais)} <Text style={styles.unit}>%</Text>
          </Text>
        </LinearGradient>

        <LinearGradient colors={['#fff7ed', '#ffedd5']} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#f97316' }]}>
            <MaterialIcons name="history" size={20} color="#fff" />
          </View>
          <Text style={styles.cardLabel}>Total de Medições</Text>
          <Text style={styles.cardValue}>
            {String(total)} <Text style={styles.unit}>registros</Text>
          </Text>
        </LinearGradient>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
      ) : (
        <View style={[styles.recentBox, { maxHeight: listHeight }]}>
          <Text style={styles.sectionTitle}>Medições Recentes</Text>

          <FlatList
            data={readings}
            keyExtractor={(item, index) => (item?.id ? String(item.id) : `reading-${index}`)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator
            initialNumToRender={8}
            maxToRenderPerBatch={12}
            windowSize={10}
            ListEmptyComponent={
              <View>
                <Text style={styles.empty}>Nenhuma medição registrada.</Text>
              </View>
            }
          />
        </View>
      )}

      <MessageOverlay 
        message={message} 
        type={messageType} 
        onClose={clearMessage}
        showCheckEmailButton={messageType === 'error' && !user?.emailVerified}
        onCheckEmail={handleCheckEmailStatus}
      />

      {/* Modal de Recomendações IA */}
      <Modal
        visible={showRecommendations}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecommendations(false)}
      >
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <MaterialIcons name="psychology" size={24} color={theme.primary} />
              <Text style={styles.modalTitle}>Recomendações IA</Text>
            </View>
            <TouchableOpacity onPress={() => setShowRecommendations(false)}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {patternAnalysis && (
            <View style={styles.modalContent}>
              {/* Resumo */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Análise dos seus Padrões</Text>
                <Text style={styles.summaryText}>
                  Baseado em {patternAnalysis.totalMeasurements} medições, sua média é de {patternAnalysis.averageGlucose.toFixed(1)} mg/dL
                </Text>
                <Text style={styles.summaryText}>
                  Variabilidade: {(patternAnalysis.variability * 100).toFixed(1)}%
                </Text>
              </View>

              {/* Insights */}
              {patternAnalysis.insights.length > 0 && (
                <View style={styles.insightsCard}>
                  <Text style={styles.modalSectionTitle}>💡 Insights</Text>
                  {patternAnalysis.insights.map((insight, index) => (
                    <Text key={index} style={styles.insightText}>• {insight}</Text>
                  ))}
                </View>
              )}

              {/* Recomendações */}
              <View style={styles.recommendationsCard}>
                <Text style={styles.modalSectionTitle}>🎯 Recomendações de Horários</Text>
                {patternAnalysis.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationHeader}>
                      <View style={[
                        styles.priorityBadge, 
                        { backgroundColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981' }
                      ]}>
                        <Text style={styles.priorityText}>
                          {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Text>
                      </View>
                      <Text style={styles.timeRange}>{rec.timeRange}</Text>
                    </View>
                    <Text style={styles.recommendationTitle}>{rec.recommendation}</Text>
                    <Text style={styles.recommendationReason}>{rec.reasoning}</Text>
                    {rec.frequency > 0 && (
                      <Text style={styles.recommendationFrequency}>
                        {rec.frequency} medições neste horário • Média: {rec.averageGlucose.toFixed(1)} mg/dL
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Distribuição por período */}
              <View style={styles.distributionCard}>
                <Text style={styles.modalSectionTitle}>📊 Distribuição por Período</Text>
                <View style={styles.distributionGrid}>
                  <View style={styles.distributionItem}>
                    <Text style={styles.distributionPeriod}>Manhã</Text>
                    <Text style={styles.distributionCount}>
                      {patternAnalysis.timeSlotDistribution.morning} medições
                    </Text>
                  </View>
                  <View style={styles.distributionItem}>
                    <Text style={styles.distributionPeriod}>Tarde</Text>
                    <Text style={styles.distributionCount}>
                      {patternAnalysis.timeSlotDistribution.afternoon} medições
                    </Text>
                  </View>
                  <View style={styles.distributionItem}>
                    <Text style={styles.distributionPeriod}>Noite</Text>
                    <Text style={styles.distributionCount}>
                      {patternAnalysis.timeSlotDistribution.evening} medições
                    </Text>
                  </View>
                  <View style={styles.distributionItem}>
                    <Text style={styles.distributionPeriod}>Madrugada</Text>
                    <Text style={styles.distributionCount}>
                      {patternAnalysis.timeSlotDistribution.night} medições
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  pageSubtitle: { fontSize: 14, color: theme.secundaryText, maxWidth: 220 },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addButtonText: { color: '#0369a1', fontWeight: '700', fontSize: 14 },

  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flexBasis: '48%',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: { color: theme.secundaryText, fontSize: 14, marginBottom: 6 },
  cardValue: { color: theme.text, fontSize: 20, fontWeight: '700' },
  unit: { fontSize: 13, fontWeight: '400', color: theme.secundaryText },

  recentBox: {
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: theme.text,
  },
  list: { marginBottom: 20 },
  empty: { textAlign: 'center', color: theme.secundaryText, marginTop: 20 },

  readingCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
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
  readingStatus: { fontSize: 13, fontWeight: '700' },
  readingDate: { fontSize: 12, color: theme.secundaryText, marginTop: 4 },

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

  // ✅ NOVO: Estilos para botões de ação
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

  deleteButton: {
    marginTop: 10,
    backgroundColor: theme.error,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Estilos do modal de recomendações
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.secundaryText + '20',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: theme.secundaryText,
    marginBottom: 4,
  },
  insightsCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationsCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  distributionCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: theme.secundaryText,
    marginBottom: 6,
    lineHeight: 20,
  },
  recommendationItem: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  timeRange: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 13,
    color: theme.secundaryText,
    marginBottom: 4,
  },
  recommendationFrequency: {
    fontSize: 12,
    color: theme.secundaryText,
    fontStyle: 'italic',
  },
  distributionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  distributionItem: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  distributionPeriod: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  distributionCount: {
    fontSize: 12,
    color: theme.secundaryText,
  },
});
