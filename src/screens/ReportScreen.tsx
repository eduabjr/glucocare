import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { listReadings, Reading } from '../services/dbService'; // Funções do seu banco
import { getReadingStatus } from '../components/utils/getReadingStatus'; // Sua função de status
import { useAuth } from '../context/AuthContext'; // Para verificar o e-mail
import { ThemeContext } from '../context/ThemeContext';

export default function ReportScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const { user } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [reportData, setReportData] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para o seletor de data
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  // Busca todos os dados uma vez ao carregar a tela
  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      const allReadings = await listReadings();
      setReadings(allReadings);
      setLoading(false);
    }
    fetchAllData();
  }, []);

  // Se o e-mail não for verificado, mostra uma tela de bloqueio
  if (!user?.emailVerified) {
    return (
      <SafeAreaView style={styles.lockedContainer}>
        <Text style={styles.title}>Acesso Restrito 🔒</Text>
        <Text style={styles.subtitle}>Confirme seu endereço de e-mail para gerar relatórios.</Text>
      </SafeAreaView>
    );
  }

  const handleGenerateReport = (type: 'monthly' | 'range' | 'full') => {
    let filteredData: Reading[] = [];
    const now = new Date();

    if (type === 'monthly') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      filteredData = readings.filter(r => r.timestamp >= firstDay.getTime() && r.timestamp <= lastDay.getTime());
    } else if (type === 'range') {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Início do dia
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Fim do dia
      filteredData = readings.filter(r => r.timestamp >= start.getTime() && r.timestamp <= end.getTime());
    } else { // 'full'
      filteredData = readings;
    }

    if (filteredData.length === 0) {
      Alert.alert("Nenhum Dado", "Não há medições para o período selecionado.");
    }
    
    setReportData(filteredData);
  };

  const generateHtmlForPdf = (data: Reading[]): string => {
    const rows = data.map(r => `
      <tr>
        <td>${new Date(r.timestamp).toLocaleString('pt-BR')}</td>
        <td>${r.glucose_level} mg/dL</td>
        <td>${getReadingStatus(r.glucose_level)}</td>
        <td>${r.meal_context || 'N/A'}</td>
        <td>${r.notes || ''}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: Helvetica, sans-serif; color: ${theme.text}; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid ${theme.secundaryText}; padding: 8px; text-align: left; }
            th { background-color: ${theme.background}; }
          </style>
        </head>
        <body>
          <h1>Relatório de Glicemia</h1>
          <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
          <table>
            <thead>
              <tr>
                <th>Data e Hora</th>
                <th>Glicemia</th>
                <th>Status</th>
                <th>Contexto</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const handleExportPdf = async () => {
    if (reportData.length === 0) {
      Alert.alert("Erro", "Gere um relatório primeiro antes de exportar.");
      return;
    }
    try {
      const htmlContent = generateHtmlForPdf(reportData);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Relatório' });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || (showPicker === 'start' ? startDate : endDate);
    setShowPicker(null);
    if (showPicker === 'start') {
      setStartDate(currentDate);
    } else {
      setEndDate(currentDate);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Relatório de Glicemia</Text>
        <Text style={styles.subtitle}>Gere e exporte seu histórico de medições</Text>

        {/* --- Card de Opções --- */}
        <View style={styles.card}>
          <Text style={styles.label}>Gerar Relatório</Text>
          <TouchableOpacity style={styles.button} onPress={() => handleGenerateReport('monthly')}>
            <Text style={styles.buttonText}>Relatório Mensal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleGenerateReport('full')}>
            <Text style={styles.buttonText}>Histórico Completo</Text>
          </TouchableOpacity>
          
          <Text style={styles.label}>Gerar por Período</Text>
          <View style={styles.datePickerRow}>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker('start')}>
              <Text style={{color: theme.text}}>De: {startDate.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker('end')}>
              <Text style={{color: theme.text}}>Até: {endDate.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={() => handleGenerateReport('range')}>
            <Text style={styles.buttonText}>Gerar por Período</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={showPicker === 'start' ? startDate : endDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </View>
        
        {/* --- Card de Resultados --- */}
        {loading && <ActivityIndicator size="large" color={theme.primary} />}
        {reportData.length > 0 && (
          <View style={styles.card}>
            <View style={styles.reportHeader}>
                <Text style={styles.label}>Resultados ({reportData.length})</Text>
                <TouchableOpacity style={styles.pdfButton} onPress={handleExportPdf}>
                    <Text style={styles.pdfButtonText}>Exportar PDF</Text>
                </TouchableOpacity>
            </View>
            
            {reportData.map(item => (
              <View key={item.id} style={styles.readingItem}>
                <View>
                  <Text style={styles.readingDate}>{new Date(item.timestamp).toLocaleString('pt-BR')}</Text>
                  <Text style={styles.readingContext}>{item.meal_context}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.readingValue}>{item.glucose_level} mg/dL</Text>
                  <Text style={styles.readingStatus}>{getReadingStatus(item.glucose_level)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos (seguindo o padrão do seu app)
const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.background },
  lockedContainer: { flex: 1, padding: 20, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'center', color: theme.text },
  subtitle: { fontSize: 14, color: theme.secundaryText, marginBottom: 16, textAlign: 'center' },
  card: { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: theme.text },
  button: { backgroundColor: theme.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  datePickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dateInput: { borderWidth: 1, borderColor: theme.secundaryText, padding: 12, borderRadius: 8, flex: 1, marginHorizontal: 4, alignItems: 'center' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pdfButton: { backgroundColor: theme.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  pdfButtonText: { color: '#fff', fontWeight: 'bold' },
  readingItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.secundaryText },
  readingDate: { fontSize: 14, fontWeight: '500', color: theme.text },
  readingContext: { fontSize: 12, color: theme.secundaryText, textTransform: 'capitalize' },
  readingValue: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  readingStatus: { fontSize: 12, color: theme.secundaryText },
});