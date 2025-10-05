import React, { useContext, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useReadings } from '../context/ReadingsContext';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Reading } from '../services/dbService';

const ChartsScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const styles = getStyles(theme);

  const { readings, loading, loadReadings } = useReadings();

  // Estados que controlam a visibilidade dos elementos do gráfico
  const [showHighestGlucose, setShowHighestGlucose] = useState(false);
  const [showLowestGlucose, setShowLowestGlucose] = useState(false);
  const [showAverageLine, setShowAverageLine] = useState(false);
  const [showIdealRange, setShowIdealRange] = useState(false);
  const [focusedDataPoint, setFocusedDataPoint] = useState<Reading | null>(null);

  const CHART_HEIGHT = 320;

  const getIdealGlucoseRange = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case 'pré-diabético':
      case 'pre-diabetic':
        return { min: 100, max: 140 };
      case 'tipo 1':
      case 'type 1':
      case 'tipo 2':
      case 'type 2':
        return { min: 80, max: 180 };
      default:
        return { min: 70, max: 110 };
    }
  };

  const filteredReadings = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return readings
      .filter(reading => new Date(reading.measurement_time || reading.timestamp) >= thirtyDaysAgo)
      .sort((a, b) => new Date(a.measurement_time || a.timestamp).getTime() - new Date(b.measurement_time || b.timestamp).getTime());
  }, [readings]);

  const glucoseStats = useMemo(() => {
    const idealRange = getIdealGlucoseRange(user?.condition);
    if (filteredReadings.length === 0) {
      return {
        highest: null, lowest: null, average: 0, idealRange,
        minValue: 50,
        maxValue: 350
      };
    }
    const glucoseLevels = filteredReadings.map(r => r.glucose_level);
    const highestReading = filteredReadings.reduce((prev, current) => (prev.glucose_level > current.glucose_level) ? prev : current);
    const lowestReading = filteredReadings.reduce((prev, current) => (prev.glucose_level < current.glucose_level) ? prev : current);
    const average = glucoseLevels.reduce((sum, level) => sum + level, 0) / glucoseLevels.length;
    const dataMin = Math.min(...glucoseLevels);
    const dataMax = Math.max(...glucoseLevels);
    return {
      highest: highestReading,
      lowest: lowestReading,
      average: Math.round(average),
      idealRange,
      minValue: Math.floor(Math.min(50, dataMin - 20)),
      maxValue: Math.ceil(Math.max(300, dataMax + 20))
    };
  }, [filteredReadings, user?.condition]);

  useFocusEffect(
    React.useCallback(() => {
      loadReadings();
    }, [])
  );

  useEffect(() => {
    const showFirstTimeNotification = async () => {
      const hasSeen = await AsyncStorage.getItem('chartsScreenNotificationSeen');
      if (!hasSeen) {
        Alert.alert(
          'Gráfico de Glicose',
          'Os dados refletem as leituras dos últimos 30 dias. Arraste o dedo sobre o gráfico para ver detalhes de cada medição.',
          [{ text: 'Entendi', onPress: () => AsyncStorage.setItem('chartsScreenNotificationSeen', 'true') }]
        );
      }
    };
    showFirstTimeNotification();
  }, []);

  const chartData = useMemo(() => {
    return filteredReadings.map((r: Reading) => ({
      value: r.glucose_level,
      label: new Date(r.measurement_time || r.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      measurementData: r,
      dataPointColor:
        (showHighestGlucose && r.id === glucoseStats.highest?.id) ? '#FF6B6B' :
        (showLowestGlucose && r.id === glucoseStats.lowest?.id) ? '#FFD93D' :
        '#2563eb',
      dataPointShape:
        (showHighestGlucose && r.id === glucoseStats.highest?.id) ||
        (showLowestGlucose && r.id === glucoseStats.lowest?.id)
        ? 'diamond'
        : 'circular',
      dataPointRadius:
        (showHighestGlucose && r.id === glucoseStats.highest?.id) ||
        (showLowestGlucose && r.id === glucoseStats.lowest?.id)
        ? 8
        : 5,
    }));
  }, [filteredReadings, glucoseStats, showHighestGlucose, showLowestGlucose]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Carregando gráfico...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (filteredReadings.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Gráfico de Glicose</Text>
          <View style={styles.cardsContainer}>
            <View style={[styles.infoCard, styles.highestCard]}><Text style={styles.cardTitle}>Glicemia Mais Alta</Text><Text style={styles.cardValue}>-- mg/dL</Text></View>
            <View style={[styles.infoCard, styles.lowestCard]}><Text style={styles.cardTitle}>Glicemia Mais Baixa</Text><Text style={styles.cardValue}>-- mg/dL</Text></View>
            <View style={[styles.infoCard, styles.averageCard]}><Text style={styles.cardTitle}>Glicemia Diária Média</Text><Text style={styles.cardValue}>-- mg/dL</Text></View>
            <View style={[styles.infoCard, styles.idealCard]}><Text style={styles.cardTitle}>Faixa de Glicose Ideal</Text><Text style={styles.cardValue}>{glucoseStats.idealRange.min}-{glucoseStats.idealRange.max} mg/dL</Text></View>
          </View>
          <View style={styles.center}><Text style={styles.emptyText}>Nenhuma medição disponível para exibir.</Text></View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Gráfico de Glicose</Text>
        <View style={styles.tooltipContainer}>
          {focusedDataPoint ? (
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipValue}>{focusedDataPoint.glucose_level} mg/dL</Text>
              <Text style={styles.tooltipTime}>
                {new Date(focusedDataPoint.measurement_time || focusedDataPoint.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                {' - '}
                {new Date(focusedDataPoint.measurement_time || focusedDataPoint.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ) : (
            <Text style={styles.tooltipPlaceholder}>Arraste no gráfico para ver detalhes</Text>
          )}
        </View>
        <View style={styles.chartWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.chartScrollContent}>
            <LineChart
              data={chartData}
              height={CHART_HEIGHT}
               width={Math.max(350, chartData.length * 50)} // Diminuí o espaçamento para caber mais dados
               yAxisOffset={glucoseStats.minValue}
               maxValue={glucoseStats.maxValue}
              noOfSections={6}
              // ✨ **LÓGICA ADICIONADA:** Exibe a linha de média condicionalmente
              referenceLine1Position={showAverageLine ? glucoseStats.average : undefined}
              referenceLine1Config={{
                  color: '#4CAF50',
                  thickness: 2,
                  dashWidth: 4,
                  dashGap: 6,
                  labelText: `Média: ${glucoseStats.average}`,
                  labelTextStyle: { color: '#4CAF50', fontSize: 10, fontWeight: 'bold' }
              }}

              isAnimated
              curved
              pointerConfig={{
                  pointerStripHeight: CHART_HEIGHT,
                  pointerStripColor: theme.primary + '80',
                  pointerStripWidth: 2,
                  strokeDashArray: [2, 5],
                  pointerColor: '#FF9800',
                  radius: 8,
                  activatePointersOnLongPress: false,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: () => <View />,
              }}
              getPointerProps={(props: any) => {
                  if (!props || props.pointerIndex === -1) {
                      setFocusedDataPoint(null);
                      return;
                  }
                  if (chartData[props.pointerIndex]) {
                      setFocusedDataPoint(chartData[props.pointerIndex].measurementData);
                  }
              }}
              color1="#2563eb"
              yAxisColor={theme.secundaryText}
              xAxisColor={theme.secundaryText}
              yAxisTextStyle={{ color: theme.secundaryText, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: theme.secundaryText, fontSize: 10, width: 60, textAlign: 'center' }}
              spacing={50} // Diminuído
              initialSpacing={20}
              endSpacing={20}
              yAxisThickness={1}
              xAxisThickness={1}
              rulesType="solid"
              rulesColor={theme.secundaryText + '40'}
            />
          </ScrollView>
        </View>
        
        {/* BOTÕES INTERATIVOS AJUSTADOS */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity style={[styles.infoCard, styles.highestCard]} onPress={() => setShowHighestGlucose(!showHighestGlucose)}>
            <Text style={styles.cardTitle}>Glicemia Mais Alta</Text>
            <Text style={styles.cardValue}>{glucoseStats.highest?.glucose_level || '--'} mg/dL</Text>
            <Text style={styles.cardDetail}>{showHighestGlucose ? 'Ocultar destaque' : 'Destacar no gráfico'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.infoCard, styles.lowestCard]} onPress={() => setShowLowestGlucose(!showLowestGlucose)}>
            <Text style={styles.cardTitle}>Glicemia Mais Baixa</Text>
            <Text style={styles.cardValue}>{glucoseStats.lowest?.glucose_level || '--'} mg/dL</Text>
            <Text style={styles.cardDetail}>{showLowestGlucose ? 'Ocultar destaque' : 'Destacar no gráfico'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.infoCard, styles.averageCard]} onPress={() => setShowAverageLine(!showAverageLine)}>
            <Text style={styles.cardTitle}>Glicemia Diária Média</Text>
            <Text style={styles.cardValue}>{glucoseStats.average} mg/dL</Text>
            <Text style={styles.cardDetail}>{showAverageLine ? 'Esconder linha' : 'Mostrar linha'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.infoCard, styles.idealCard]} onPress={() => setShowIdealRange(!showIdealRange)}>
            <Text style={styles.cardTitle}>Faixa de Glicose Ideal</Text>
            <Text style={styles.cardValue}>{glucoseStats.idealRange.min}-{glucoseStats.idealRange.max} mg/dL</Text>
            <Text style={styles.cardDetail}>{showIdealRange ? 'Esconder área' : 'Mostrar área'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: theme.background
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Adiciona espaço na parte inferior
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.secundaryText
  },
  emptyText: {
    fontSize: 14,
    color: theme.secundaryText,
    textAlign: 'center',
    marginTop: 20
  },
   pageTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: theme.text,
     marginBottom: 8,
     marginTop: 8,
     textAlign: 'center'
   },
   tooltipContainer: {
     backgroundColor: theme.card,
     borderRadius: 8,
     padding: 10,
     marginBottom: 8,
     alignItems: 'center',
     minHeight: 60,
     justifyContent: 'center',
     borderWidth: 1,
     borderColor: theme.secundaryText + '20',
   },
  tooltipPlaceholder: {
    fontSize: 12,
    color: theme.secundaryText,
    fontStyle: 'italic',
  },
  tooltipContent: {
    alignItems: 'center',
  },
  tooltipValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
  },
  tooltipTime: {
    fontSize: 12,
    color: theme.secundaryText,
    marginTop: 4,
  },
   chartWrapper: {
     backgroundColor: theme.card,
     borderRadius: 12,
     paddingVertical: 8,
     marginBottom: 8,
     elevation: 3,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
   },
  chartScrollContent: {
    minWidth: '100%',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  infoCard: {
    width: '48.5%',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.secundaryText,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 3,
    textAlign: 'center',
  },
  cardDetail: {
    fontSize: 9,
    color: theme.secundaryText,
    textAlign: 'center',
    opacity: 0.8,
  },
  highestCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    backgroundColor: theme.card,
  },
  lowestCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD93D',
    backgroundColor: theme.card,
  },
  averageCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    backgroundColor: theme.card,
  },
  idealCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    backgroundColor: theme.card,
  },
});

export default ChartsScreen;