import { useEffect, useState } from 'react';
import { // Removida a importação 'React'
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

// CORREÇÃO 1.2: Adicionando tipagem para os props
interface MessageOverlayProps {
  message: string | null;
  type: 'success' | 'error';
  onClose: () => void;
}

// Componente de mensagem de alerta personalizado
const MessageOverlay = ({ message, type, onClose }: MessageOverlayProps) => {
  return (
    <Modal transparent animationType="fade" visible={!!message}>
      <View style={styles.modalOverlay}>
        <View style={styles.messageBox}>
          <MaterialIcons
            name={type === 'success' ? 'check-circle' : 'error'}
            size={40}
            color={type === 'success' ? '#16a34a' : '#dc2626'}
          />
          <Text style={styles.messageText}>{message}</Text>
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
    navigate: (screen: string) => void;
  };
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();

  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [longPressId, setLongPressId] = useState<string | null>(null);

  // alturas medidas via onLayout
  const [headerHeight, setHeaderHeight] = useState(0);
  const [cardsHeight, setCardsHeight] = useState(0);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => setMessage(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadReadings();
    });

    (async () => {
      try {
        setLoading(true);
        await initDB();
        await loadReadings();
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
      const data = await listReadings();
      if (Array.isArray(data)) {
        const sorted = data
          .map((r) => ({ ...r, glucose_level: Number(r.glucose_level) || 0 }))
          // CORREÇÃO 1.3: Usando getTime() para garantir comparação numérica
          .sort((a, b) => new Date(b.measurement_time).getTime() - new Date(a.measurement_time).getTime()); 
        setReadings(sorted);
      } else {
        setReadings([]);
      }
    } catch (error) {
      console.error('Erro ao carregar medições:', error);
      setReadings([]);
    }
  };

  const getReadingStatus = (value: number) => {
    if (!value || isNaN(value)) return { label: 'Inválido', text: '#6b7280', bg: '#f3f4f6' };
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
    const status = getReadingStatus(item.glucose_level);
    
    // CORREÇÃO 1.4: Trocando View por TouchableOpacity para suportar onLongPress
    return (
      <TouchableOpacity
        style={styles.readingCard}
        onLongPress={() => handleLongPress(item.id)} // Inicia a exclusão ao pressionar por 5 segundos
        onPressOut={() => setLongPressId(null)} // Cancela a exibição se o usuário soltar rápido
        activeOpacity={0.9} 
      >
        <View style={styles.readingRow}>
          <Text style={styles.readingValue}>{item.glucose_level} mg/dL</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.readingStatus, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.readingDate}>
          {item.measurement_time ? new Date(item.measurement_time).toLocaleString() : 'Sem data'}
        </Text>
        {longPressId === item.id && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteReading(item.id)}
          >
            <Text style={styles.deleteButtonText}>Excluir Medição</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Função para lidar com o LongPress e aguardar 5 segundos
  const handleLongPress = (id: string) => {
    setLongPressId(id);
    setTimeout(() => {
      if (longPressId === id) {
        setLongPressId(null);
      }
    }, 5000); // Aguarda 5 segundos para mostrar a opção de excluir
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

  // CORREÇÃO 2.1: Cálculo da altura disponível para a FlatList
  const listHeight = WINDOW_HEIGHT - insets.top - insets.bottom - headerHeight - cardsHeight - 120; // 120 é uma estimativa de paddings e margens

  return (
    <SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom + 12 }]} edges={['top', 'bottom']}>
      {/* Subtítulo e botão */}
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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddReading')}
        >
          <Text style={styles.addButtonText}>+ Nova Medição</Text>
        </TouchableOpacity>
      </View>

      {/* KPIs */}
      <View
        style={styles.cardsContainer}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setCardsHeight(h);
        }}
      >
        <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#3b82f6' }]}>
            <MaterialIcons name="show-chart" size={20} color="#fff" />
          </View>
          <Text style={styles.cardLabel}>Última Medição</Text>
          <Text style={styles.cardValue}>
            {ultima} <Text style={styles.unit}>mg/dL</Text>
          </Text>
        </LinearGradient>

        <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#10b981' }]}>
            <Ionicons name="stats-chart" size={20} color="#fff" />
          </View>
          <Text style={styles.cardLabel}>Média Geral</Text>
          <Text style={styles.cardValue}>
            {media} <Text style={styles.unit}>mg/dL</Text>
          </Text>
        </LinearGradient>

        <LinearGradient colors={['#faf5ff', '#ede9fe']} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#8b5cf6' }]}>
            <FontAwesome5 name="bullseye" size={18} color="#fff" />
          </View>
          <Text style={styles.cardLabel}>Medições Normais</Text>
          <Text style={styles.cardValue}>
            {normais} <Text style={styles.unit}>%</Text>
          </Text>
        </LinearGradient>

        <LinearGradient colors={['#fff7ed', '#ffedd5']} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#f97316' }]}>
            <MaterialIcons name="history" size={20} color="#fff" />
          </View>
          <Text style={styles.cardLabel}>Total de Medições</Text>
          <Text style={styles.cardValue}>
            {total} <Text style={styles.unit}>registros</Text>
          </Text>
        </LinearGradient>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        // CORREÇÃO 2.1: Usando o listHeight calculado
        <View style={[styles.recentBox, { maxHeight: listHeight }]}> 
          <Text style={styles.sectionTitle}>Medições Recentes</Text>

          <FlatList
            data={readings}
            keyExtractor={(item) => (item.id ? item.id.toString() : `${item.measurement_time}-${Math.random()}`)}
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

      <MessageOverlay message={message} type={messageType} onClose={clearMessage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f0f6ff',
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  pageSubtitle: { fontSize: 14, color: '#6b7280', maxWidth: 220 },

  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 3,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },

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
  cardLabel: { color: '#374151', fontSize: 14, marginBottom: 6 },
  cardValue: { color: '#111827', fontSize: 20, fontWeight: '700' },
  unit: { fontSize: 13, fontWeight: '400', color: '#6b7280' },

  recentBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#111827',
  },
  list: { marginBottom: 20 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },

  readingCard: {
    backgroundColor: '#f9fafb',
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
  readingValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  readingStatus: { fontSize: 13, fontWeight: '700' },
  readingDate: { fontSize: 12, color: '#6b7280', marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBox: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  messageText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  deleteButton: {
    marginTop: 10,
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});