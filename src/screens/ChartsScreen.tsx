import React, { useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Text as SvgText } from 'react-native-svg';

// ✅ 1. Importa o hook para acessar os dados globais de medições
import { useReadings } from '../context/ReadingsContext'; 

const screenWidth = Dimensions.get('window').width;

// ✅ Renomeado para ChartsScreen para consistência
const ChartsScreen: React.FC = () => {
  // ✅ 2. Usa o estado global do ReadingsContext
  const { readings, loading, loadReadings } = useReadings();
  
  // ✅ 3. Carrega os dados sempre que a tela entra em foco
  useFocusEffect(
    React.useCallback(() => {
      loadReadings();
    }, [])
  );

  // O resto do código lida apenas com a exibição dos dados já disponíveis

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

  if (readings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhuma medição disponível para exibir.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Lógica de preparação dos dados para o gráfico
  const ordered = [...readings].reverse(); // Usa uma cópia para não alterar o estado original
  const values = ordered.map((r) => r.glucose_level);
  const labels = ordered.map((r) =>
    new Date(r.measurement_time).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
  
  const chartWidth = Math.max(screenWidth, labels.length * 60);
  const chartHeight = 260;
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Gráfico de Glicose</Text>

      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <LineChart
            data={{
              labels: [], // Labels são renderizados pelo decorator para evitar sobreposição
              datasets: [{ data: values }],
            }}
            width={chartWidth}
            height={chartHeight}
            chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                propsForDots: { r: '5' },
            }}
            bezier
            style={styles.chart}
            decorator={() => {
              if (labels.length === 0) return null;

              return (
                <Svg>
                  {labels.map((label, i) => {
                    let x;
                    if (labels.length > 1) {
                      x = 40 + (i / (labels.length - 1)) * (chartWidth - 80);
                    } else {
                      x = chartWidth / 2; // Centraliza se houver apenas um ponto
                    }
                    
                    return (
                      <SvgText
                        key={`label-${i}`}
                        x={x}
                        y={chartHeight - 5}
                        fontSize="10"
                        fill="#666"
                        textAnchor="middle"
                      >
                        {label}
                      </SvgText>
                    );
                  })}
                </Svg>
              );
            }}
          />
        </ScrollView>
      </View>
      
      {/* Aqui você pode adicionar os outros cards (média, maior, menor, etc.) */}
      {/* ... */}

    </SafeAreaView>
  );
};

// Seus estilos (styles) permanecem os mesmos
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f0f6ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 14, color: '#555' },
  emptyText: { fontSize: 14, color: '#555' },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  chart: { marginVertical: 8, borderRadius: 12 },
});


export default ChartsScreen;