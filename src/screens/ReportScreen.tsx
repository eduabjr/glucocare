import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
// import * as MediaLibrary from 'expo-media-library'; // Removido - não funciona no Expo Go

import { listReadings, Reading } from '../services/dbService'; // Funções do seu banco
import { getReadingStatus } from '../components/utils/getReadingStatus'; // Sua função de status
import { useAuth } from '../context/AuthContext'; // Para verificar o e-mail
import { ThemeContext } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function ReportScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const navigation = useNavigation();

  const { user, refreshUserEmailStatus } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [reportData, setReportData] = useState<Reading[]>([]);
  
  // Debug: monitorar mudanças no reportData
  useEffect(() => {
    console.log("reportData atualizado:", reportData.length, "items");
  }, [reportData]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<{
    range: boolean;
    monthly: boolean;
    full: boolean;
  }>({
    range: false,
    monthly: false,
    full: false
  });

  // Estados para o seletor de data
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  // Busca todos os dados uma vez ao carregar a tela
  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      const allReadings = await listReadings();
      console.log("Medições carregadas no ReportScreen:", allReadings.length, "items");
      setReadings(allReadings);
      setLoading(false);
    }
    fetchAllData();
    
    
    // Cleanup - removido removeListener
  }, []);

  // Função para verificar status do email
  const handleCheckEmailStatus = async () => {
    try {
      const isVerified = await refreshUserEmailStatus();
      // Removido: Alert.alert para verificação de email
    } catch (error) {
      console.error('Erro ao verificar status do email:', error);
    }
  };

  // Se o e-mail não for verificado, mostra uma tela de bloqueio
  if (!user?.emailVerified) {
    return (
      <SafeAreaView style={styles.lockedContainer}>
        <Text style={styles.title}>Acesso Restrito 🔒</Text>
        <Text style={styles.subtitle}>Confirme seu endereço de e-mail para gerar relatórios.</Text>
        <TouchableOpacity style={styles.checkEmailButton} onPress={handleCheckEmailStatus}>
          <Text style={styles.checkEmailButtonText}>Verificar E-mail</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleGenerateReport = async (type: 'monthly' | 'range' | 'full') => {
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
      console.log("Nenhuma medição encontrada para o período selecionado");
      return;
    }
    
    setReportData(filteredData);
  };

  // Função para obter status com cores (similar ao DashboardScreen)
  const getReadingStatusWithColors = (value: number) => {
    if (value < 70) return { label: 'Baixo', text: '#b45309', bg: '#fef3c7' };
    if (value > 140) return { label: 'Alto', text: '#b91c1c', bg: '#fee2e2' };
    return { label: 'Normal', text: '#047857', bg: '#d1fae5' };
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
                <th>Observações</th>
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

  const getFileName = (type: 'monthly' | 'range' | 'full') => {
    let fileName = 'relatorio_glicemia';
    const now = new Date();
    
    if (type === 'monthly') {
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      fileName = `relatorio_mensal_${monthNames[now.getMonth()]}_${now.getFullYear()}`;
    } else if (type === 'full') {
      fileName = `historico_completo_${now.getFullYear()}`;
    } else if (type === 'range') {
      const startStr = startDate.toLocaleDateString('pt-BR').replace(/\//g, '-');
      const endStr = endDate.toLocaleDateString('pt-BR').replace(/\//g, '-');
      fileName = `relatorio_periodo_${startStr}_a_${endStr}`;
    }
    
    return fileName;
  };

  const generatePdfFile = async (data: Reading[], type: 'monthly' | 'range' | 'full') => {
    try {
      console.log('🔍 Debug: generatePdfFile iniciado - type =', type, 'data.length =', data.length);
      setLoading(true);
      
      // Se não há dados fornecidos, gera dados baseado no tipo
      let reportData = data;
      if (data.length === 0) {
        console.log('🔍 Debug: Dados vazios, gerando baseado no tipo');
        const now = new Date();
        
        if (type === 'monthly') {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          reportData = readings.filter(r => r.timestamp >= firstDay.getTime() && r.timestamp <= lastDay.getTime());
          console.log('🔍 Debug: Filtrado mensal - encontrados', reportData.length, 'registros');
        } else if (type === 'full') {
          reportData = readings;
          console.log('🔍 Debug: Dados completos - encontrados', reportData.length, 'registros');
        } else if (type === 'range') {
          // Para range, usa os dados já filtrados em reportData se existirem
          reportData = readings;
          console.log('🔍 Debug: Dados de range - encontrados', reportData.length, 'registros');
        }
      }
      
      if (reportData.length === 0) {
        console.log('🔍 Debug: Nenhum dado encontrado');
        throw new Error("Nenhum dado encontrado para o período selecionado");
      }
      
      const fileName = getFileName(type);
      console.log('🔍 Debug: fileName =', fileName);
      const htmlContent = generateHtmlForPdf(reportData);
      console.log('🔍 Debug: HTML gerado, tamanho =', htmlContent.length);
      
      const { uri } = await Print.printToFileAsync({ 
        html: htmlContent,
        base64: false
      });
      console.log('🔍 Debug: PDF criado com sucesso - uri =', uri);
      
      return { uri, fileName, data: reportData };
    } catch (error) {
      console.error("🔍 Debug: Erro ao gerar PDF:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleShareReport = async () => {
    if (reportData.length === 0) {
      console.log("Nenhum relatório para compartilhar");
      return;
    }

    try {
      // Determina o tipo baseado nos dados
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      let type: 'monthly' | 'range' | 'full' = 'full';
      if (reportData.every(r => r.timestamp >= firstDay.getTime() && r.timestamp <= lastDay.getTime())) {
        type = 'monthly';
      } else if (reportData.every(r => r.timestamp >= startDate.getTime() && r.timestamp <= endDate.getTime())) {
        type = 'range';
      }

      const { uri, fileName } = await generatePdfFile(reportData, type);
      
      await Sharing.shareAsync(uri, { 
        mimeType: 'application/pdf', 
        dialogTitle: `Compartilhar ${fileName}`,
        UTI: 'com.adobe.pdf'
      });
      
    } catch (error) {
      console.error("Erro ao compartilhar relatório:", error);
    }
  };

  const handleDownloadReport = async () => {
    console.log('🔍 Debug: Iniciando download do relatório por período');
    console.log('🔍 Debug: reportData.length =', reportData.length);
    
    if (reportData.length === 0) {
      console.log("Nenhum relatório para baixar");
      return;
    }

    if (downloading.range) {
      console.log('🔍 Debug: Download já em andamento, ignorando');
      return; // Evita múltiplos downloads simultâneos
    }

    try {
      setDownloading(prev => ({ ...prev, range: true }));
      
      // Determina o tipo baseado nos dados
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      let type: 'monthly' | 'range' | 'full' = 'full';
      if (reportData.every(r => r.timestamp >= firstDay.getTime() && r.timestamp <= lastDay.getTime())) {
        type = 'monthly';
      } else if (reportData.every(r => r.timestamp >= startDate.getTime() && r.timestamp <= endDate.getTime())) {
        type = 'range';
      }

      console.log('🔍 Debug: Tipo determinado =', type);
      
      const { uri, fileName } = await generatePdfFile(reportData, type);
      console.log('🔍 Debug: PDF gerado - uri =', uri, 'fileName =', fileName);
      
      // Salva o arquivo no diretório de documentos usando FileSystem
      console.log('🔍 Debug: Salvando arquivo no dispositivo...');
      
      // Caminho de destino no diretório de documentos
      const docDir = (FileSystem as any).documentDirectory || '';
      const downloadPath = `${docDir}${fileName}.pdf`;
      
      // Copia o arquivo PDF para o diretório de documentos
      await FileSystem.copyAsync({
        from: uri,
        to: downloadPath
      });
      
      console.log('🔍 Debug: Arquivo salvo com sucesso em:', downloadPath);
      
      // Verifica se o arquivo existe
      const fileExists = await FileSystem.getInfoAsync(downloadPath);
      if (fileExists.exists) {
        console.log('🔍 Debug: Arquivo confirmado no dispositivo');
        
        // Compartilha o arquivo usando Sharing
        console.log('🔍 Debug: Compartilhando arquivo...');
        await Sharing.shareAsync(downloadPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Salvar Relatório de Glicemia',
          UTI: 'com.adobe.pdf'
        });
        console.log('🔍 Debug: Arquivo compartilhado com sucesso');
      } else {
        console.error('🔍 Debug: Arquivo não encontrado após cópia');
        throw new Error('Falha ao salvar arquivo no dispositivo');
      }
      
      
      // Enviar notificação específica para relatório por período
      console.log('🔍 Debug: Download concluído com sucesso');
      
      setDownloading(prev => ({ ...prev, range: false }));
      
    } catch (error) {
      setDownloading(prev => ({ ...prev, range: false }));
      console.error("Erro no download:", error);
    }
  };

  const handleViewReport = () => {
    if (reportData.length === 0) {
      console.log("Nenhum relatório para visualizar");
      return;
    }
    console.log("Visualização de relatório - removida");
  };

  // Função para mostrar local do arquivo - removida

  // Funções específicas para Relatório Mensal
  const handleMonthlyShare = async () => {
    if (!user?.emailVerified) {
      console.log("Email não verificado para compartilhar relatório mensal");
      return;
    }

    try {
      const { uri, fileName, data } = await generatePdfFile([], 'monthly');
      await Sharing.shareAsync(uri, { 
        mimeType: 'application/pdf', 
        dialogTitle: `Compartilhar ${fileName}`,
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error("Erro ao compartilhar relatório mensal:", error);
    }
  };

  const handleMonthlyDownload = async () => {
    console.log('🔍 Debug: Iniciando download do relatório mensal');
    
    if (!user?.emailVerified) {
      console.log("Email não verificado para download do relatório mensal");
      return;
    }

    if (downloading.monthly) {
      console.log('🔍 Debug: Download mensal já em andamento, ignorando');
      return; // Evita múltiplos downloads simultâneos
    }

    try {
      setDownloading(prev => ({ ...prev, monthly: true }));
      
      const { uri, fileName, data } = await generatePdfFile([], 'monthly');
      console.log('🔍 Debug: PDF mensal gerado - uri =', uri, 'fileName =', fileName);
      
      // Salva o arquivo no diretório de documentos usando FileSystem
      console.log('🔍 Debug: Salvando arquivo mensal no dispositivo...');
      
      // Caminho de destino no diretório de documentos
      const docDir = (FileSystem as any).documentDirectory || '';
      const downloadPath = `${docDir}${fileName}.pdf`;
      
      // Copia o arquivo PDF para o diretório de documentos
      await FileSystem.copyAsync({
        from: uri,
        to: downloadPath
      });
      
      console.log('🔍 Debug: Arquivo mensal salvo com sucesso em:', downloadPath);
      
      // Verifica se o arquivo existe
      const fileExists = await FileSystem.getInfoAsync(downloadPath);
      if (fileExists.exists) {
        console.log('🔍 Debug: Arquivo mensal confirmado no dispositivo');
        
        // Compartilha o arquivo usando Sharing
        console.log('🔍 Debug: Compartilhando arquivo mensal...');
        await Sharing.shareAsync(downloadPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Salvar Relatório Mensal de Glicemia',
          UTI: 'com.adobe.pdf'
        });
        console.log('🔍 Debug: Arquivo mensal compartilhado com sucesso');
      } else {
        console.error('🔍 Debug: Arquivo mensal não encontrado após cópia');
        throw new Error('Falha ao salvar arquivo mensal no dispositivo');
      }
      
      
      // Enviar notificação específica para relatório mensal
      
      setDownloading(prev => ({ ...prev, monthly: false }));
      console.log('Download mensal concluído com sucesso');
    } catch (error) {
      setDownloading(prev => ({ ...prev, monthly: false }));
      console.error("Erro no download mensal:", error);
    }
  };

  const handleMonthlyView = () => {
    if (!user?.emailVerified) {
      console.log("Email não verificado para visualizar relatório mensal");
      return;
    }

    (navigation as any).navigate('ViewReport', {
      reportType: 'monthly',
      title: 'Relatório Mensal'
    });
  };

  // Funções específicas para Histórico Completo
  const handleFullShare = async () => {
    if (!user?.emailVerified) {
      console.log("Email não verificado para compartilhar histórico completo");
      return;
    }

    try {
      const { uri, fileName, data } = await generatePdfFile([], 'full');
      await Sharing.shareAsync(uri, { 
        mimeType: 'application/pdf', 
        dialogTitle: `Compartilhar ${fileName}`,
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error("Erro ao compartilhar histórico completo:", error);
    }
  };

  const handleFullDownload = async () => {
    console.log('🔍 Debug: Iniciando download do histórico completo');
    
    if (!user?.emailVerified) {
      console.log("Email não verificado para download do histórico completo");
      return;
    }

    if (downloading.full) {
      console.log('🔍 Debug: Download completo já em andamento, ignorando');
      return; // Evita múltiplos downloads simultâneos
    }

    try {
      setDownloading(prev => ({ ...prev, full: true }));
      
      const { uri, fileName, data } = await generatePdfFile([], 'full');
      console.log('🔍 Debug: PDF completo gerado - uri =', uri, 'fileName =', fileName);
      
      // Salva o arquivo no diretório de documentos usando FileSystem
      console.log('🔍 Debug: Salvando arquivo completo no dispositivo...');
      
      // Caminho de destino no diretório de documentos
      const docDir = (FileSystem as any).documentDirectory || '';
      const downloadPath = `${docDir}${fileName}.pdf`;
      
      // Copia o arquivo PDF para o diretório de documentos
      await FileSystem.copyAsync({
        from: uri,
        to: downloadPath
      });
      
      console.log('🔍 Debug: Arquivo completo salvo com sucesso em:', downloadPath);
      
      // Verifica se o arquivo existe
      const fileExists = await FileSystem.getInfoAsync(downloadPath);
      if (fileExists.exists) {
        console.log('🔍 Debug: Arquivo completo confirmado no dispositivo');
        
        // Compartilha o arquivo usando Sharing
        console.log('🔍 Debug: Compartilhando arquivo completo...');
        await Sharing.shareAsync(downloadPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Salvar Histórico Completo de Glicemia',
          UTI: 'com.adobe.pdf'
        });
        console.log('🔍 Debug: Arquivo completo compartilhado com sucesso');
      } else {
        console.error('🔍 Debug: Arquivo completo não encontrado após cópia');
        throw new Error('Falha ao salvar arquivo completo no dispositivo');
      }
      
      
      // Enviar notificação específica para histórico completo
      
      setDownloading(prev => ({ ...prev, full: false }));
      console.log('Download do histórico completo concluído com sucesso');
    } catch (error) {
      setDownloading(prev => ({ ...prev, full: false }));
      console.error("Erro no download do histórico completo:", error);
    }
  };

  const handleFullView = () => {
    if (!user?.emailVerified) {
      console.log("Email não verificado para visualizar histórico completo");
      return;
    }

    (navigation as any).navigate('ViewReport', {
      reportType: 'full',
      title: 'Histórico Completo'
    });
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons 
              name="file-chart" 
              size={36} 
              color={theme.primary} 
            />
          </View>
        <Text style={styles.title}>Relatório de Glicemia</Text>
        <Text style={styles.subtitle}>Gere e exporte seu histórico de medições</Text>

        </View>

        {/* Card 1: Relatório por Período */}
        <View style={styles.reportCard}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                <MaterialIcons name="date-range" size={28} color="#FF9800" />
              </View>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Relatório por Período</Text>
              <Text style={styles.cardDescription}>
                Escolha um intervalo de datas específico.
              </Text>
            </View>
          </View>
          
          {/* Seção de Seleção de Datas */}
          <View style={styles.dateSection}>
          <View style={styles.datePickerRow}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>De:</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker('start')}>
                  <Text style={styles.dateInputText}>{startDate.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Até:</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker('end')}>
                  <Text style={styles.dateInputText}>{endDate.toLocaleDateString('pt-BR')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.actionButtonWrapper} onPress={() => handleGenerateReport('range')}>
                <LinearGradient
                  colors={['#fff7ed', '#ffedd5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.periodGenerateButton}
                >
                  <Text style={styles.periodGenerateButtonText}>Gerar Relatório</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButtonWrapper} onPress={() => setReportData([])}>
                <LinearGradient
                  colors={['#f3f4f6', '#e5e7eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Limpar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {showPicker && (
            <DateTimePicker
              value={showPicker === 'start' ? startDate : endDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </View>
        
        {/* --- Card de Resultados (movido para aqui) --- */}
        {loading && <ActivityIndicator size="large" color={theme.primary} />}
        {reportData.length > 0 && (
          <View style={styles.reportCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Resultado</Text>
                <View style={styles.resultInfo}>
                  <MaterialIcons name="info-outline" size={16} color={theme.secundaryText} />
                  <Text style={styles.resultInfoText}>
                    Dados filtrados para o 
                    período selecionado.
                  </Text>
                </View>
              </View>
              
              {/* Botões de ação */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButtonWrapper} onPress={handleShareReport}>
                  <LinearGradient
                    colors={['#f0f9ff', '#e0f2fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <MaterialIcons name="share" size={16} color="#0369a1" />
                    <Text style={styles.actionButtonText}>Compartilhar</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButtonWrapper} 
                  onPress={handleDownloadReport}
                  disabled={downloading.range}
                  activeOpacity={downloading.range ? 1 : 0.7}
                >
                  <LinearGradient
                    colors={downloading.range ? ['#f3f4f6', '#e5e7eb'] : ['#ecfdf5', '#d1fae5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    {downloading.range ? (
                      <ActivityIndicator size="small" color="#059669" />
                    ) : (
                      <MaterialIcons name="download" size={16} color="#059669" />
                    )}
                    <Text style={[styles.actionButtonText, downloading.range && { opacity: 0.7 }]}>
                      {downloading.range ? 'Baixando...' : 'Download'}
                    </Text>
                  </LinearGradient>
              </TouchableOpacity>
              </View>
            </View>
            
            {/* Seção de resultados com scroll */}
            <View style={styles.resultsSection}>
              <ScrollView 
                style={styles.readingsScrollContainer} 
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {reportData.map((item, index) => {
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
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

            {/* Card 2: Relatório Mensal */}
            <View style={styles.reportCard}>
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialIcons name="calendar-month" size={28} color="#2196F3" />
                  </View>
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Relatório Mensal</Text>
                  <Text style={styles.cardDescription}>
                    Visualize os dados consolidados do último mês.
                  </Text>
                </View>
                
                {/* Botões de ação para Relatório Mensal */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButtonWrapper} onPress={() => handleMonthlyShare()}>
                    <LinearGradient
                      colors={['#f0f9ff', '#e0f2fe']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="share" size={16} color="#0369a1" />
                      <Text style={styles.actionButtonText}>Compartilhar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButtonWrapper} 
                    onPress={() => handleMonthlyDownload()}
                    disabled={downloading.monthly}
                    activeOpacity={downloading.monthly ? 1 : 0.7}
                  >
                    <LinearGradient
                      colors={downloading.monthly ? ['#f3f4f6', '#e5e7eb'] : ['#ecfdf5', '#d1fae5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      {downloading.monthly ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : (
                        <MaterialIcons name="download" size={16} color="#059669" />
                      )}
                      <Text style={[styles.actionButtonText, downloading.monthly && { opacity: 0.7 }]}>
                        {downloading.monthly ? 'Baixando...' : 'Download'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButtonWrapper} onPress={() => handleMonthlyView()}>
                    <LinearGradient
                      colors={['#faf5ff', '#ede9fe']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="visibility" size={16} color="#7c3aed" />
                      <Text style={styles.actionButtonText}>Visualizar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Card 3: Histórico Completo */}
            <View style={styles.reportCard}>
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <View style={[styles.iconCircle, { backgroundColor: '#E8F5E8' }]}>
                    <Ionicons name="document-text" size={28} color="#4CAF50" />
                  </View>
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Histórico Completo</Text>
                  <Text style={styles.cardDescription}>
                    Exporte todos os seus registros de uma só vez.
                  </Text>
                </View>
                
                {/* Botões de ação para Histórico Completo */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButtonWrapper} onPress={handleFullShare}>
                    <LinearGradient
                      colors={['#f0f9ff', '#e0f2fe']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="share" size={16} color="#0369a1" />
                      <Text style={styles.actionButtonText}>Compartilhar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButtonWrapper} 
                    onPress={handleFullDownload}
                    disabled={downloading.full}
                    activeOpacity={downloading.full ? 1 : 0.7}
                  >
                    <LinearGradient
                      colors={downloading.full ? ['#f3f4f6', '#e5e7eb'] : ['#ecfdf5', '#d1fae5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      {downloading.full ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : (
                        <MaterialIcons name="download" size={16} color="#059669" />
                      )}
                      <Text style={[styles.actionButtonText, downloading.full && { opacity: 0.7 }]}>
                        {downloading.full ? 'Baixando...' : 'Download'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButtonWrapper} onPress={handleFullView}>
                    <LinearGradient
                      colors={['#faf5ff', '#ede9fe']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="visibility" size={16} color="#7c3aed" />
                      <Text style={styles.actionButtonText}>Visualizar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos (seguindo o padrão do seu app)
const getStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: theme.background 
  },
  lockedContainer: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: theme.background, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  headerIconContainer: {
    backgroundColor: theme.primary + '20',
    borderRadius: 36,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    textAlign: 'center', 
    color: theme.text 
  },
  subtitle: { 
    fontSize: 16, 
    color: theme.secundaryText, 
    marginBottom: 24, 
    textAlign: 'center' 
  },
  checkEmailButton: { 
    backgroundColor: theme.accent, 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 8 
  },
  checkEmailButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16 
  },

  // Novos estilos para os cards de relatório
  reportCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  resultInfoText: {
    fontSize: 12,
    color: theme.secundaryText,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  cardDescription: {
    fontSize: 14,
    color: theme.secundaryText,
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Estilos para a seção de datas
  dateSection: {
    marginTop: 8,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateInputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: theme.secundaryText,
    marginBottom: 4,
    fontWeight: '500',
  },
  dateInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.secundaryText + '40',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateInputText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  periodGenerateButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodGenerateButtonText: {
    color: '#ea580c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#6b7280',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Estilos para resultados
  resultsCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  actionButtons: {
    gap: 8,
  },
  horizontalButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
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
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.secundaryText + '20',
  },

  // Estilos do modal
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.secundaryText + '20',
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
  modalSubtitle: {
    fontSize: 16,
    color: theme.secundaryText,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalReadingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modalReadingLeft: {
    flex: 1,
  },
  modalReadingRight: {
    alignItems: 'flex-end',
  },
  modalReadingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  modalReadingContext: {
    fontSize: 14,
    color: theme.secundaryText,
    textTransform: 'capitalize',
  },
  modalReadingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  modalReadingStatus: {
    fontSize: 12,
    color: theme.secundaryText,
  },
  // Estilos para o modal de localização
  locationCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  locationLabel: {
    fontSize: 14,
    color: theme.secundaryText,
    marginBottom: 8,
  },
  filePath: {
    fontSize: 12,
    color: theme.text,
    backgroundColor: theme.background,
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  locationActions: {
    gap: 12,
  },
  copyButton: {
    backgroundColor: '#2196F3',
  },
  openButton: {
    backgroundColor: '#4CAF50',
  },

  // Estilos para a seção de resultados
  resultsSection: {
    marginTop: 16,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.text,
  },
  readingsScrollContainer: {
    height: 220, // Altura fixa para exibir exatamente 3 medições (60px + 8px + 60px + 8px + 60px + 4px padding)
    paddingBottom: 8,
  },
  readingCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 0,
    elevation: 1,
    minHeight: 60, // Altura mínima para cada medição
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readingValue: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: theme.text 
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  readingStatus: { 
    fontSize: 14, 
    fontWeight: '700' 
  },
  readingDate: { 
    fontSize: 12, 
    color: theme.secundaryText, 
    marginTop: 2 
  },
  readingContext: {
    fontSize: 12,
    color: theme.secundaryText,
    marginTop: 2,
    fontStyle: 'italic',
  },
});