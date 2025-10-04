import React, { useContext, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useReadings } from '../context/ReadingsContext';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Reading } from '../services/dbService'; // Importa o tipo

const ChartsScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const styles = getStyles(theme);

  const { readings, loading, loadReadings } = useReadings();

  // Estados para controlar as visualizações no gráfico
  const [showHighestGlucose, setShowHighestGlucose] = useState(false);
  const [showLowestGlucose, setShowLowestGlucose] = useState(false);
  const [showAverageLine, setShowAverageLine] = useState(false);
  const [showIdealRange, setShowIdealRange] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<Reading | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

      // Função para obter a faixa ideal baseada na condição do usuário (baseada em diretrizes médicas)
      const getIdealGlucoseRange = (condition?: string) => {
        switch (condition?.toLowerCase()) {
          case 'pré-diabético':
          case 'pre-diabetic':
            // Pré-diabetes: jejum 100-125 mg/dL, pós-prandial 140-199 mg/dL
            return { min: 100, max: 140 };
          case 'tipo 1':
          case 'type 1':
            // Diabetes Tipo 1: jejum 80-130 mg/dL, pós-prandial <180 mg/dL
            return { min: 80, max: 180 };
          case 'tipo 2':
          case 'type 2':
            // Diabetes Tipo 2: jejum 80-130 mg/dL, pós-prandial <180 mg/dL
            return { min: 80, max: 180 };
          default:
            // Padrão para pessoas sem diabetes conhecido (faixa normal)
            return { min: 70, max: 110 };
        }
      };

      // Função para calcular a posição correta no gráfico
      const calculateChartPosition = (value: number, minValue: number, maxValue: number, chartHeight: number = 320, chartTop: number = 0) => {
        const range = maxValue - minValue;
        if (range === 0) return chartTop;
        
        // Inverte o cálculo: valores maiores ficam mais no topo
        const normalizedValue = (maxValue - value) / range;
        return chartTop + (normalizedValue * chartHeight);
      };

  // Cálculos dos dados - MOVIDO PARA ANTES DOS RETURNS CONDICIONAIS
  // Filtrar dados para mostrar apenas últimas 30 dias (configurável)
  const filteredReadings = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); // Últimos 30 dias
    
    return readings.filter(reading => 
      new Date(reading.measurement_time || reading.timestamp) >= thirtyDaysAgo
    );
  }, [readings]);

  const glucoseStats = useMemo(() => {
    if (filteredReadings.length === 0) {
      return {
        highest: null,
        lowest: null,
        average: 0,
        idealRange: getIdealGlucoseRange(user?.condition),
        minValue: 70,
        maxValue: 300
      };
    }

    const glucoseLevels = filteredReadings.map(r => r.glucose_level);
    const highestReading = filteredReadings.reduce((prev, current) =>
      (prev.glucose_level > current.glucose_level) ? prev : current
    );
    const lowestReading = filteredReadings.reduce((prev, current) =>
      (prev.glucose_level < current.glucose_level) ? prev : current
    );
    const average = glucoseLevels.reduce((sum, level) => sum + level, 0) / glucoseLevels.length;

    // Calcular os limites do gráfico
    const minValue = Math.min(70, Math.min(...glucoseLevels) - 20);
    const maxValue = Math.max(300, Math.max(...glucoseLevels) + 20);

    return {
      highest: highestReading,
      lowest: lowestReading,
      average: Math.round(average),
      idealRange: getIdealGlucoseRange(user?.condition),
      minValue,
      maxValue
    };
  }, [filteredReadings, user?.condition]);

  useFocusEffect(
    React.useCallback(() => {
      loadReadings();
    }, [])
  );

  // Notificação explicativa na primeira vez
  useEffect(() => {
    const showFirstTimeNotification = async () => {
      try {
        const hasSeenNotification = await AsyncStorage.getItem('chartsScreenNotificationSeen');
        if (!hasSeenNotification) {
          Alert.alert(
            'Gráfico de Glicose',
           'Os dados de medição são atualizados diariamente e refletem as leituras das últimas 24 horas. dição.',
            [
              {
                text: 'Entendi',
                onPress: () => AsyncStorage.setItem('chartsScreenNotificationSeen', 'true')
              }
            ]
          );
        }
      } catch (error) {
        console.error('Erro ao verificar notificação:', error);
      }
    };

    showFirstTimeNotification();
  }, []);

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
          
          {/* Cards informativos mesmo sem dados */}
          <View style={styles.cardsContainer}>
            {/* Card Glicemia Mais Alta */}
            <TouchableOpacity style={[styles.infoCard, styles.highestCard]}>
              <Text style={styles.cardTitle}>Glicemia Mais Alta</Text>
              <Text style={styles.cardValue}>-- mg/dL</Text>
              <Text style={styles.cardDetail}>Nenhuma medição</Text>
            </TouchableOpacity>

            {/* Card Glicemia Mais Baixa */}
            <TouchableOpacity style={[styles.infoCard, styles.lowestCard]}>
              <Text style={styles.cardTitle}>Glicemia Mais Baixa</Text>
              <Text style={styles.cardValue}>-- mg/dL</Text>
              <Text style={styles.cardDetail}>Nenhuma medição</Text>
            </TouchableOpacity>

            {/* Card Média Diária */}
            <TouchableOpacity style={[styles.infoCard, styles.averageCard]}>
              <Text style={styles.cardTitle}>Glicemia Diária Média</Text>
              <Text style={styles.cardValue}>-- mg/dL</Text>
              <Text style={styles.cardDetail}>Toque para esconder a linha</Text>
            </TouchableOpacity>

            {/* Card Faixa Ideal */}
            <TouchableOpacity style={[styles.infoCard, styles.idealCard]}>
              <Text style={styles.cardTitle}>Faixa de Glicose Ideal</Text>
              <Text style={styles.cardValue}>{glucoseStats.idealRange.min}-{glucoseStats.idealRange.max} mg/dL</Text>
              <Text style={styles.cardDetail}>Toque para mostrar a área de medição ideal</Text>
            </TouchableOpacity>
          </View>

        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhuma medição disponível para exibir.</Text>
        </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Prepara os dados para o react-native-gifted-charts
      const chartData = filteredReadings
    .slice()
    .sort((a: Reading, b: Reading) => new Date(a.measurement_time || a.timestamp).getTime() - new Date(b.measurement_time || b.timestamp).getTime())
        .map((r: Reading, index) => ({
      value: r.glucose_level,
      label: new Date(r.measurement_time || r.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
          // Adiciona cores especiais para glicemia mais alta e mais baixa
          dataPointColor:
            showHighestGlucose && r.id === glucoseStats.highest?.id ? '#FF6B6B' :
            showLowestGlucose && r.id === glucoseStats.lowest?.id ? '#FFD93D' :
            selectedMeasurement?.id === r.id ? '#FF9800' :
            '#2563eb',
          dataPointRadius:
            showHighestGlucose && r.id === glucoseStats.highest?.id ? 10 :
            showLowestGlucose && r.id === glucoseStats.lowest?.id ? 10 :
            selectedMeasurement?.id === r.id ? 10 :
            6,
          // Adiciona dados extras para identificar a medição
          measurementData: r,
    }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.pageTitle}>Gráfico de Glicose</Text>


      {/* Gráfico */}
      <View style={styles.chartContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.chartScrollContent}
              >
        <LineChart
          data={chartData}
                  height={320}
                  width={Math.max(350, chartData.length * 80)} // Largura dinâmica baseada no número de pontos (atualizado)
          // Estilização do gráfico para combinar com o tema
          color1="#2563eb" // Azul primário
          dataPointsColor1="#2563eb"
          
          // Linhas de referência e eixos
                  rulesColor={theme.secundaryText}
                  yAxisColor={theme.secundaryText}
                  xAxisColor={theme.secundaryText}
          
          // Labels
          yAxisTextStyle={{ color: theme.secundaryText }}
          xAxisLabelTextStyle={{ color: theme.secundaryText, fontSize: 10 }}
          
          // Configurações de interatividade e aparência
          spacing={80} // Aumentado o espaçamento entre os pontos
          initialSpacing={30}
          endSpacing={30}
          
          isAnimated
          curved
          
          // Aumentar o tamanho das bolinhas para facilitar o clique
          dataPointsRadius={12} // Aumentado para 12
          dataPointsWidth={24} // Aumentado para área de toque maior
          dataPointsHeight={24}
            
                // Handler para cliques nos pontos - TOGGLE SIMPLES COM POSICIONAMENTO
                onPress={(item: any) => {
                  console.log('Ponto clicado:', item);
                  // Se o mesmo ponto for clicado, deseleciona; senão, seleciona o novo
                  if (selectedMeasurement?.id === item.measurementData?.id) {
                    setSelectedMeasurement(null);
                    setTooltipPosition(null);
                  } else {
                    setSelectedMeasurement(item.measurementData);
                    // Calcula posição aproximada baseada no índice do ponto
                    const pointIndex = filteredReadings.findIndex(r => r.id === item.measurementData?.id);
                    const chartWidth = Math.max(350, filteredReadings.length * 80); // Largura dinâmica
                    const chartHeight = 320; // Altura do gráfico
                    const spacing = 80; // Espaçamento entre pontos (atualizado)
                    const initialSpacing = 30;
                    
                    // Posição X: baseada no índice do ponto
                    const x = initialSpacing + (pointIndex * spacing);
                    // Posição Y: centro vertical do gráfico
                    const y = chartHeight / 2 - 20; // Ajuste para centralizar a tooltip
                    
                    setTooltipPosition({ 
                      x: Math.min(x + 50, chartWidth - 200), // Limita ao lado direito
                      y: Math.max(20, Math.min(y, chartHeight - 100)) // Mantém dentro do gráfico
                    });
                  }
                }}
              />
              </ScrollView>
          
          {/* Indicadores visuais sobrepostos */}
          {showAverageLine && (() => {
            const averagePosition = calculateChartPosition(glucoseStats.average, glucoseStats.minValue, glucoseStats.maxValue, 320, 0);
            console.log('📊 Debug Média:', {
              average: glucoseStats.average,
              minValue: glucoseStats.minValue,
              maxValue: glucoseStats.maxValue,
              position: averagePosition
            });
            
            return (
              <View style={styles.averageLineOverlay}>
                <View style={[
                  styles.averageLine,
                  {
                    // Cálculo baseado na escala real do gráfico
                    top: averagePosition,
                    left: 50, // Dentro do gráfico, alinhado com eixo Y
                    right: 20, // Deixa espaço para não sair do gráfico
                    backgroundColor: '#4CAF50',
                  }
                ]} />
                <Text style={[styles.averageLabel, { 
                  top: averagePosition - 15,
                  left: 55, // Dentro do gráfico, alinhado com eixo Y
                  color: '#4CAF50' 
                }]}>
                  Média: {glucoseStats.average} mg/dL
                </Text>
              </View>
            );
          })()}
          
          {showIdealRange && (() => {
            const maxPosition = calculateChartPosition(glucoseStats.idealRange.max, glucoseStats.minValue, glucoseStats.maxValue, 320, 0);
            const minPosition = calculateChartPosition(glucoseStats.idealRange.min, glucoseStats.minValue, glucoseStats.maxValue, 320, 0);
            console.log('📊 Debug Faixa Ideal:', {
              idealMin: glucoseStats.idealRange.min,
              idealMax: glucoseStats.idealRange.max,
              minValue: glucoseStats.minValue,
              maxValue: glucoseStats.maxValue,
              minPosition,
              maxPosition,
              height: Math.abs(minPosition - maxPosition)
            });
            
            return (
              <View style={styles.idealRangeOverlay}>
                <View style={[
                  styles.idealRangeBand,
                  {
                    // Usa a função de cálculo para posicionamento correto
                    top: maxPosition,
                    left: 50, // Dentro do gráfico, alinhado com eixo Y
                    right: 20, // Deixa espaço para não sair do gráfico
                    height: Math.abs(minPosition - maxPosition),
                    backgroundColor: 'rgba(255, 152, 0, 0.4)',
                    borderRadius: 4,
                  }
                ]} />
                <View style={[
                  styles.idealRangeBorder,
                  {
                    // Linha superior da faixa ideal
                    top: maxPosition,
                    left: 50, // Dentro do gráfico, alinhado com eixo Y
                    right: 20, // Deixa espaço para não sair do gráfico
                    height: 2,
                    backgroundColor: '#FF9800',
                  }
                ]} />
                <View style={[
                  styles.idealRangeBorder,
                  {
                    // Linha inferior da faixa ideal
                    top: minPosition,
                    left: 50, // Dentro do gráfico, alinhado com eixo Y
                    right: 20, // Deixa espaço para não sair do gráfico
                    height: 2,
                    backgroundColor: '#FF9800',
                  }
                ]} />
                <Text style={[styles.rangeLabel, { 
                  top: maxPosition - 20,
                  left: 55, // Dentro do gráfico, alinhado com eixo Y
                  color: '#FF9800',
                  fontSize: 10,
                  fontWeight: 'bold'
                }]}>
                  {glucoseStats.idealRange.max} mg/dL
                </Text>
                <Text style={[styles.rangeLabel, { 
                  top: minPosition + 5,
                  left: 55, // Dentro do gráfico, alinhado com eixo Y
                  color: '#FF9800',
                  fontSize: 10,
                  fontWeight: 'bold'
                }]}>
                  {glucoseStats.idealRange.min} mg/dL
                </Text>
              </View>
            );
          })()}
          
          {/* Tooltip da medição selecionada - POSICIONAMENTO DINÂMICO */}
          {selectedMeasurement && tooltipPosition && (
            <View style={[
              styles.measurementTooltip,
              {
                left: tooltipPosition.x,
                top: tooltipPosition.y,
              }
            ]}>
              <View style={styles.tooltipContent}>
                <Text style={styles.tooltipTitle}>Medição Selecionada</Text>
                <Text style={styles.tooltipValue}>{selectedMeasurement.glucose_level} mg/dL</Text>
                <Text style={styles.tooltipTime}>
                  {new Date(selectedMeasurement.measurement_time || selectedMeasurement.timestamp).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                {selectedMeasurement.meal_context && (
                  <Text style={styles.tooltipContext}>
                    Contexto: {selectedMeasurement.meal_context}
                  </Text>
                )}
                {selectedMeasurement.time_since_meal && (
                  <Text style={styles.tooltipContext}>
                    Tempo após refeição: {selectedMeasurement.time_since_meal}
                  </Text>
                )}
                {selectedMeasurement.notes && (
                  <Text style={styles.tooltipNotes}>
                    Notas: {selectedMeasurement.notes}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

      {/* Legenda abaixo do gráfico */}
      <View style={styles.legendBelowChart}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#2563eb' }]} />
          <Text style={styles.legendText}>Leituras de Glicose (toque nas bolinhas para ver mais detalhes da medição)</Text>
        </View>
      </View>
      
      {/* Cards informativos interativos */}
      <View style={styles.cardsContainer}>
        {/* Card Glicemia Mais Alta */}
        <TouchableOpacity
          style={[styles.infoCard, styles.highestCard]}
          onPress={() => setShowHighestGlucose(!showHighestGlucose)}
        >
          <Text style={styles.cardTitle}>Glicemia Mais Alta</Text>
          <Text style={styles.cardValue}>{glucoseStats.highest?.glucose_level || 0} mg/dL</Text>
          <Text style={styles.cardDetail}>
            {glucoseStats.highest ? 
              `Horário: ${new Date(glucoseStats.highest.measurement_time || glucoseStats.highest.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
              : '--:--'
            }
          </Text>
        </TouchableOpacity>

        {/* Card Glicemia Mais Baixa */}
        <TouchableOpacity
          style={[styles.infoCard, styles.lowestCard]}
          onPress={() => setShowLowestGlucose(!showLowestGlucose)}
        >
          <Text style={styles.cardTitle}>Glicemia Mais Baixa</Text>
          <Text style={styles.cardValue}>{glucoseStats.lowest?.glucose_level || 0} mg/dL</Text>
          <Text style={styles.cardDetail}>
            {glucoseStats.lowest ? 
              `Horário: ${new Date(glucoseStats.lowest.measurement_time || glucoseStats.lowest.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
              : '--:--'
            }
          </Text>
        </TouchableOpacity>

        {/* Card Glicemia Diária Média */}
        <TouchableOpacity
          style={[styles.infoCard, styles.averageCard]}
          onPress={() => setShowAverageLine(!showAverageLine)}
        >
          <Text style={styles.cardTitle}>Glicemia Diária Média</Text>
          <Text style={styles.cardValue}>{glucoseStats.average} mg/dL</Text>
          <Text style={styles.cardDetail}>
            {showAverageLine ? 'Toque para esconder a linha' : 'Toque para mostrar a linha'}
          </Text>
        </TouchableOpacity>

        {/* Card Faixa de Glicose Ideal */}
        <TouchableOpacity
          style={[styles.infoCard, styles.idealCard]}
          onPress={() => setShowIdealRange(!showIdealRange)}
        >
          <Text style={styles.cardTitle}>Faixa de Glicose Ideal</Text>
          <Text style={styles.cardValue}>{glucoseStats.idealRange.min}-{glucoseStats.idealRange.max} mg/dL</Text>
          <Text style={styles.cardDetail}>
            {showIdealRange ? 'Toque para esconder a área' : 'Toque para mostrar a área'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: theme.background 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
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
        marginBottom: 4,
        marginTop: -4,
        textAlign: 'center'
      },
      
      // Container do gráfico
      chartContainer: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 6,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
      },
      
      // Conteúdo do scroll horizontal do gráfico
      chartScrollContent: {
        minWidth: '100%',
      },
  
      // Legenda abaixo do gráfico
      legendBelowChart: {
        backgroundColor: theme.card,
        borderRadius: 8,
        padding: 6,
        marginBottom: 6,
        marginHorizontal: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },

      // Estilos para os cards informativos - AUMENTADOS PARA MELHOR VISUALIZAÇÃO
      cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 8,
        gap: 8,
        paddingBottom: 4,
      },
      infoCard: {
        width: '48%',
        backgroundColor: theme.background,
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: theme.secundaryText + '20',
      },
      cardTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.secundaryText,
        marginBottom: 4,
        textAlign: 'center',
      },
      cardValue: {
        fontSize: 14,
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
  
  // Cores específicas para cada card - COM CORES DE FUNDO SUAVES
  highestCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
    backgroundColor: '#FFEBEE',
  },
  lowestCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFD93D',
    backgroundColor: '#FFFDE7',
  },
  averageCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  idealCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
      legendText: {
        fontSize: 10,
        color: theme.secundaryText,
        fontWeight: '500',
      },

      // Instrução para o usuário
      instructionText: {
        fontSize: 10,
        color: theme.secundaryText,
        textAlign: 'center',
        marginTop: 6,
        fontStyle: 'italic',
      },

      // Estilos para os indicadores visuais
  idealRangeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320, // Altura do gráfico
    pointerEvents: 'none',
  },
      
      // Estilos para a legenda
      legendContainer: {
    backgroundColor: theme.card,
    borderRadius: 12,
        padding: 12,
        marginTop: 8,
    elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      legendTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 8,
        textAlign: 'center',
      },
  idealRangeBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 8,
  },
  idealRangeBorder: {
    position: 'absolute',
  },
  rangeLabel: {
    position: 'absolute',
    left: 10,
    fontSize: 10,
    fontWeight: 'bold',
  },
  averageLineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320, // Altura do gráfico
    pointerEvents: 'none',
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  averageLabel: {
    position: 'absolute',
    left: 10,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
      // Estilos para a tooltip da medição selecionada - POSICIONAMENTO DINÂMICO
      measurementTooltip: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 12,
        padding: 16,
        minWidth: 200,
        maxWidth: 280,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        borderWidth: 3,
        borderColor: '#2563eb',
        zIndex: 1000, // Garante que fica por cima de tudo
        // Posição dinâmica será calculada baseada no ponto clicado
      },
  tooltipContent: {
    position: 'relative',
  },
  tooltipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  tooltipValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 8,
  },
  tooltipTime: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  tooltipContext: {
    fontSize: 10,
    color: '#555',
    marginBottom: 4,
    textAlign: 'left',
  },
  tooltipNotes: {
    fontSize: 10,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'left',
  },
      tooltipCloseButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF4444',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
      },
      tooltipCloseText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
  },
});

export default ChartsScreen;