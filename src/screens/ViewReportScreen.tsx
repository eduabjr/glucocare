import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreenProps } from '../navigation/types';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { listReadings, Reading } from '../services/dbService';
import { getReadingStatus } from '../components/utils/getReadingStatus';

type ViewReportScreenProps = AppScreenProps<'ViewReport'>;

export default function ViewReportScreen({ navigation, route }: ViewReportScreenProps) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  
  const { reportType, title } = route.params || { reportType: 'monthly', title: 'Relatório' };
  
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para obter status com cores (similar ao DashboardScreen)
  const getReadingStatusWithColors = (value: number) => {
    if (value < 70) return { label: 'Baixo', text: '#b45309', bg: '#fef3c7' };
    if (value > 140) return { label: 'Alto', text: '#b91c1c', bg: '#fee2e2' };
    return { label: 'Normal', text: '#047857', bg: '#d1fae5' };
  };

  useEffect(() => {
    const loadReadings = async () => {
      try {
        setLoading(true);
        const allReadings = await listReadings();
        
        let filteredReadings = allReadings;
        
        if (reportType === 'monthly') {
          // Filtra medições do último mês
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          
          filteredReadings = allReadings.filter(reading => {
            const readingDate = new Date(reading.timestamp);
            return readingDate >= oneMonthAgo;
          });
        }
        // Para 'full', usa todas as medições
        
        setReadings(filteredReadings);
      } catch (error) {
        console.error('Erro ao carregar medições:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReadings();
  }, [reportType]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Carregando relatório...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {readings.length} medição{readings.length !== 1 ? 'ões' : ''} encontrada{readings.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => navigation.navigate('Report')}
          >
            <MaterialIcons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        {readings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma medição encontrada</Text>
          </View>
        ) : (
          readings.map((item, index) => {
            const glucoseLevel = Number(item.glucose_level) || 0;
            const status = getReadingStatusWithColors(glucoseLevel);
            
            return (
              <View key={item.id || index} style={styles.readingCard}>
                <View style={styles.readingRow}>
                  <Text style={styles.readingValue}>{String(glucoseLevel)} mg/dL</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.readingStatus, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>
                <Text style={styles.readingDate}>
                  {item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : 'Sem data'}
                </Text>
                {item.meal_context && (
                  <Text style={styles.readingContext}>{item.meal_context}</Text>
                )}
                {item.notes && (
                  <Text style={styles.readingNotes}>📝 {item.notes}</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.secundaryText,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.secundaryText + '20',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.secundaryText,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.secundaryText + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: theme.secundaryText,
    textAlign: 'center',
  },
  readingCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  readingStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  readingDate: {
    fontSize: 14,
    color: theme.secundaryText,
    marginBottom: 4,
  },
  readingContext: {
    fontSize: 14,
    color: theme.secundaryText,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  readingNotes: {
    fontSize: 14,
    color: theme.text,
    backgroundColor: theme.background,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
});
