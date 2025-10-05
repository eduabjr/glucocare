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

// === CONSTANTES MOVIDAS PARA FORA DO COMPONENTE ===
// Agora elas são acessíveis tanto pelo componente quanto pela função getStyles.
const CHART_HEIGHT = 280;
const Y_AXIS_LABEL_WIDTH = 40;
const X_AXIS_SPACING_INITIAL = 20;
const X_AXIS_SPACING_END = 20;
const X_AXIS_SPACING_TOTAL = X_AXIS_SPACING_INITIAL + X_AXIS_SPACING_END;


const ChartsScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const styles = getStyles(theme);

  const { readings, loading, loadReadings } = useReadings();

  const [showHighestGlucose, setShowHighestGlucose] = useState(false);
  const [showLowestGlucose, setShowLowestGlucose] = useState(false);
  const [showAverageLine, setShowAverageLine] = useState(false);
  const [showIdealRange, setShowIdealRange] = useState(true);
  const [focusedDataPoint, setFocusedDataPoint] = useState<Reading | null>(null);

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

  // Função de cálculo ajustada para maior precisão
  const calculateChartPosition = (value: number, minValue: number, maxValue: number) => {
    const range = maxValue - minValue;
    if (range <= 0) return CHART_HEIGHT / 2; // Evita divisão por zero
    // Normaliza o valor (0 a 1) dentro da faixa
    const normalizedValue = (value - minValue) / range;
    // Inverte o resultado, pois o eixo Y no React Native começa de cima para baixo
    return CHART_HEIGHT - (normalizedValue * CHART_HEIGHT);
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

  const chartWidth = Math.max(350, chartData.length * 50);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            {/* View para conter o gráfico e os overlays */}
            <View>
              <LineChart
                data={chartData}
                height={CHART_HEIGHT}
                width={chartWidth}
                yAxisOffset={glucoseStats.minValue}
                maxValue={glucoseStats.maxValue}
                noOfSections={6}
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
                spacing={50}
                initialSpacing={X_AXIS_SPACING_INITIAL}
                endSpacing={X_AXIS_SPACING_END}
                yAxisThickness={1}
                xAxisThickness={1}
                rulesType="solid"
                rulesColor={theme.secundaryText + '40'}
                yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
              />
              {/* Overlays posicionados sobre o gráfico */}
              <View style={[styles.overlayContainer, { width: chartWidth }]}>
                {showAverageLine && (
                  <>
                    <View style={[styles.averageLine, { top: calculateChartPosition(glucoseStats.average, glucoseStats.minValue, glucoseStats.maxValue) }]} />
                    <Text style={[styles.averageLabel, { top: calculateChartPosition(glucoseStats.average, glucoseStats.minValue, glucoseStats.maxValue) - 15, left: 5 }]}>
                      Média: {glucoseStats.average} mg/dL
                    </Text>
                  </>
                )}
                {showIdealRange && (() => {
                  const maxPosition = calculateChartPosition(glucoseStats.idealRange.max, glucoseStats.minValue, glucoseStats.maxValue);
                  const minPosition = calculateChartPosition(glucoseStats.idealRange.min, glucoseStats.minValue, glucoseStats.maxValue);
                  const bandHeight = Math.abs(minPosition - maxPosition);

                  return (
                    <>
                      <View style={[styles.idealRangeBand, { top: maxPosition, height: bandHeight }]} />
                      {/* Marcadores no Eixo Y */}
                      <Text style={[styles.yAxisMarkerLabel, { top: maxPosition - 8, left: -Y_AXIS_LABEL_WIDTH }]}>
                        {glucoseStats.idealRange.max}
                      </Text>
                      <Text style={[styles.yAxisMarkerLabel, { top: minPosition - 8, left: -Y_AXIS_LABEL_WIDTH }]}>
                        {glucoseStats.idealRange.min}
                      </Text>
                    </>
                  );
                })()}
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity style={[styles.infoCard, styles.highestCard]} onPress={() => setShowHighestGlucose(!showHighestGlucose)}>
            <Text style={styles.cardTitle}>Glicemia Mais Alta</Text>
            <Text style={styles.cardValue}>{glucoseStats.highest?.glucose_level || '--'} mg/dL</Text>
            <Text style={styles.cardDetail}>
              {glucoseStats.highest ? `Às ${new Date(glucoseStats.highest.measurement_time || glucoseStats.highest.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : (showHighestGlucose ? 'Ocultar' : 'Destacar')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.infoCard, styles.lowestCard]} onPress={() => setShowLowestGlucose(!showLowestGlucose)}>
            <Text style={styles.cardTitle}>Glicemia Mais Baixa</Text>
            <Text style={styles.cardValue}>{glucoseStats.lowest?.glucose_level || '--'} mg/dL</Text>
            <Text style={styles.cardDetail}>
              {glucoseStats.lowest ? `Às ${new Date(glucoseStats.lowest.measurement_time || glucoseStats.lowest.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : (showLowestGlucose ? 'Ocultar' : 'Destacar')}
            </Text>
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
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
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
     fontSize: 18,
     fontWeight: 'bold',
     color: theme.text,
     marginBottom: 12,
     marginTop: 0,
     textAlign: 'center'
   },
  tooltipContainer: {
    backgroundColor: theme.card,
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
    alignItems: 'center',
    minHeight: 50,
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
     borderRadius: 8,
     paddingVertical: 8,
     paddingLeft: 0,
     marginBottom: 8,
     elevation: 3,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
   },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: theme.secundaryText + '20',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.secundaryText,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardDetail: {
    fontSize: 10,
    color: theme.secundaryText,
    textAlign: 'center',
    opacity: 0.8,
  },
  highestCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    backgroundColor: '#FFEBEE',
  },
  lowestCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD93D',
    backgroundColor: '#FFFDE7',
  },
  averageCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  idealCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  // ESTILOS DOS OVERLAYS (CORRIGIDOS)
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: Y_AXIS_LABEL_WIDTH,
    height: CHART_HEIGHT,
    pointerEvents: 'none',
  },
  idealRangeBand: {
    position: 'absolute',
    left: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#4CAF50',
    borderRadius: 1,
  },
  averageLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: theme.card,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  yAxisMarkerLabel: {
    position: 'absolute',
    width: Y_AXIS_LABEL_WIDTH,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF9800',
    paddingRight: 4,
  },
});

export default ChartsScreen;