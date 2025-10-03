import React, { useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { useFocusEffect } from '@react-navigation/native';

import { useReadings } from '../context/ReadingsContext';
import { ThemeContext } from '../context/ThemeContext';
import { Reading } from '../services/dbService'; // Importa o tipo

const ChartsScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const { readings, loading, loadReadings } = useReadings();

  useFocusEffect(
    React.useCallback(() => {
      loadReadings();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
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

  // Prepara os dados para o react-native-gifted-charts
  const chartData = readings
    .slice()
    .sort((a: Reading, b: Reading) => new Date(a.measurement_time).getTime() - new Date(b.measurement_time).getTime())
    .map((r: Reading) => ({
      value: r.glucose_level,
      label: new Date(r.measurement_time).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Gráfico de Glicose</Text>

      <View style={styles.card}>
        <LineChart
          data={chartData}
          height={250}
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
          spacing={60} // Espaçamento entre os pontos
          initialSpacing={20}
          endSpacing={20}
          
          isAnimated
          curved
        />
      </View>
      
      {/* Aqui você pode adicionar os outros cards (média, maior, menor, etc.) */}
      {/* ... */}

    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 14, color: theme.secundaryText },
  emptyText: { fontSize: 14, color: theme.secundaryText },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 12 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 16, // Ajustado para melhor visualização
    paddingHorizontal: 8,
    elevation: 2,
  },
});

export default ChartsScreen;