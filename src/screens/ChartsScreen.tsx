import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { listReadings, initDB } from '../services/dbService';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Text as SvgText } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

interface Reading {
  glucose_level: number;
  measurement_time: string;
}

// CORREÇÃO 1: Definição do tipo para as chaves do objeto 'ranges'
type ProfileTypeKey = 'prediabetes' | 'tipo1' | 'tipo2';

const CGMChartScreen: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<any>(null);
  const [highlight, setHighlight] = useState<any>(null);
  const [tooltip, setTooltip] = useState<any>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        await loadReadings();
        const storedProfile = await SecureStore.getItemAsync('user_profile');
        if (storedProfile) setProfile(JSON.parse(storedProfile));
      } catch (err) {
        console.error('Erro ao inicializar:', err);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReadings();
    }, [])
  );

  const loadReadings = async () => {
    try {
      const data = await listReadings();
      if (!data || data.length === 0) {
        setReadings([]);
        return;
      }
      const filtered = data.filter(
        (r: any) =>
          r &&
          r.measurement_time &&
          !Number.isNaN(Number(r.glucose_level)) &&
          Number(r.glucose_level) > 0 &&
          Number(r.glucose_level) < 1000
      );
      const normalized = filtered.map((r: any) => ({
        ...r,
        glucose_level: Number(r.glucose_level),
        measurement_time: new Date(r.measurement_time).toISOString(),
      }));
      setReadings(normalized);
    } catch (err) {
      console.error('Erro ao carregar leituras:', err);
      setReadings([]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Carregando gráfico...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Nenhuma medição disponível para exibir.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const ordered = readings.slice().reverse();
  const values = ordered.map((r) => Number(r.glucose_level) || 0);

  const labels = ordered.map((r) =>
    new Date(r.measurement_time).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const highestIndex = values.indexOf(highest);
  const lowestIndex = values.indexOf(lowest);

  const chartWidth = Math.max(screenWidth - 32, labels.length * 60);
  const chartHeight = 260;

  // CORREÇÃO 1: Usa o novo tipo ProfileTypeKey para userType e ranges
  const userType: ProfileTypeKey = (profile?.type || 'prediabetes') as ProfileTypeKey;
  const ranges: Record<ProfileTypeKey, { min: number; max: number }> = {
    prediabetes: { min: 70, max: 180 },
    tipo1: { min: 80, max: 150 },
    tipo2: { min: 90, max: 160 },
  };
  const rangeForType = ranges[userType] || ranges['prediabetes'];
  const minTarget = rangeForType.min;
  const maxTarget = rangeForType.max;

  const avg =
    values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;

  const toggleHighlight = (type: string) => {
    if (highlight?.type === type) {
      setHighlight(null);
    } else {
      setHighlight(
        type === 'highest'
          ? { index: highestIndex, type }
          : { index: lowestIndex, type }
      );
    }
  };

  const toggleTooltip = (index: number, x: number, y: number) => {
    if (tooltip && tooltip.index === index) {
      setTooltip(null);
    } else {
      setTooltip({
        index,
        value: values[index],
        label: labels[index],
        x,
        y,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Gráfico de Glicose</Text>
      </View>

      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <LineChart
            data={{ labels: [], datasets: [{ data: values }] }} // Não exibindo labels no eixo X
            width={chartWidth}
            height={chartHeight}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#fff',
              },
              propsForBackgroundLines: {
                strokeWidth: '0.5',
                stroke: '#e0e0e0',
              },
            }}
            bezier
            withInnerLines
            withOuterLines
            fromZero
            style={styles.chart}
            segments={4}
            // CORREÇÃO 2: Usa _ para indicar que dataPoint não é usado
            getDotColor={(_, index) => { 
              if (highlight?.type === 'highest' && index === highestIndex) {
                return 'red';
              }
              if (highlight?.type === 'lowest' && index === lowestIndex) {
                return 'green';
              }
              return '#2563eb';
            }}
            decorator={() => (
              <Svg>
                {labels.map((l, i) => (
                  <SvgText
                    key={`lab-${i}`}
                    x={40 + (i / (labels.length - 1)) * (chartWidth - 80)}
                    y={chartHeight - 10} // Posicionando as horas abaixo das bolinhas
                    fontSize="10"
                    fill="#444"
                    textAnchor="middle"
                  >
                    {l}
                  </SvgText>
                ))}
              </Svg>
            )}
            onDataPointClick={({ index, x, y }) => toggleTooltip(index, x, y)}
          />
        </ScrollView>
        <Text style={styles.axisLabel}>Glicose (mg/dL)</Text>

        {tooltip && (
          <View
            style={[
              styles.tooltip,
              { left: tooltip.x - 40, top: tooltip.y - 50 },
            ]}
          >
            <Text style={styles.tooltipText}>{tooltip.value} mg/dL</Text>
            <Text style={styles.tooltipSub}>{tooltip.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoGrid}>
        <TouchableOpacity
          style={[styles.infoBox, { backgroundColor: '#fee2e2' }]}
          onPress={() => toggleHighlight('highest')}
        >
          <Text style={[styles.infoTitle, { color: '#b91c1c' }]}>
            Glicemia Mais Alta
          </Text>
          <Text style={[styles.infoValue, { color: '#7f1d1d' }]}>{highest} mg/dL</Text>
          <Text style={[styles.infoSub, { color: '#b91c1c' }]}>
            Horário: {labels[highestIndex]}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.infoBox, { backgroundColor: '#dcfce7' }]}
          onPress={() => toggleHighlight('lowest')}
        >
          <Text style={[styles.infoTitle, { color: '#15803d' }]}>
            Glicemia Mais Baixa
          </Text>
          <Text style={[styles.infoValue, { color: '#166534' }]}>{lowest} mg/dL</Text>
          <Text style={[styles.infoSub, { color: '#15803d' }]}>
            Horário: {labels[lowestIndex]}
          </Text>
        </TouchableOpacity>

        <View style={[styles.infoBox, { backgroundColor: '#fef9c3' }]}>
          <Text style={[styles.infoTitle, { color: '#b45309' }]}>
            Faixa de Glicose Ideal
          </Text>
          <Text style={[styles.infoValue, { color: '#92400e' }]}>
            {minTarget}-{maxTarget} mg/dL
          </Text>
          <Text style={[styles.infoSub, { color: '#b45309' }]}>
            Intervalo recomendado para {userType}
          </Text>
        </View>

        <View style={[styles.infoBox, { backgroundColor: '#dbeafe' }]}>
          <Text style={[styles.infoTitle, { color: '#1d4ed8' }]}>
            Glicemia Diária Média
          </Text>
          <Text style={[styles.infoValue, { color: '#1e3a8a' }]}>{avg} mg/dL</Text>
          <Text style={[styles.infoSub, { color: '#1d4ed8' }]}>
            Calculada automaticamente
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f0f6ff' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    elevation: 2,
  },
  chart: { marginVertical: 8, borderRadius: 12 },
  axisLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#2563eb',
    textAlign: 'center',
  },

  tooltip: {
    position: 'absolute',
    backgroundColor: '#111',
    padding: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  tooltipText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  tooltipSub: { color: '#ddd', fontSize: 11, marginTop: 2 },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  infoBox: {
    flexBasis: '48%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoTitle: { fontSize: 13, fontWeight: '600' },
  infoValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  infoSub: { fontSize: 11, marginTop: 2 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 14, color: '#555' },
  emptyText: { fontSize: 14, color: '#555' },
});

export default CGMChartScreen;