import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { listReadings, Reading } from '../services/dbService'; // Funções do seu banco
import { getReadingStatus } from '../components/utils/getReadingStatus'; // Sua função de status
import { useAuth } from '../context/AuthContext'; // Para verificar o e-mail
import { ThemeContext } from '../context/ThemeContext';
import { notificationService } from '../services/notificationService';

export default function ReportScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const { user, refreshUserEmailStatus } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [reportData, setReportData] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false); // New state for file location modal
  const [fileLocationData, setFileLocationData] = useState<{fileName: string, filePath: string} | null>(null);
  const [downloading, setDownloading] = useState<{
    range: boolean;
    monthly: boolean;
    full: boolean;
  }>({
    range: false,
    monthly: false,
    full: false
  });
  const [downloadProgress, setDownloadProgress] = useState('');

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
    
    // Configurar listener para notificações
    const removeListener = notificationService.setupNotificationListener();
    
    // Configurar callback para quando notificação for tocada
    notificationService.setNotificationTapCallback(showFileLocation);
    
    // Cleanup
    return () => {
      removeListener();
    };
  }, []);

  // Função para verificar status do email
  const handleCheckEmailStatus = async () => {
    try {
      const isVerified = await refreshUserEmailStatus();
      if (isVerified === true) {
        Alert.alert(
          '✅ E-mail Verificado!', 
          'Seu e-mail foi verificado com sucesso. Agora você pode gerar relatórios.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ E-mail Não Verificado', 
          'Verifique sua caixa de entrada e clique no link de verificação enviado.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível verificar o status do e-mail. Tente novamente.');
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
      Alert.alert("Nenhum Dado", "Não há medições para o período selecionado.");
      return;
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
      Alert.alert("Erro", "Gere um relatório primeiro antes de compartilhar.");
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
      Alert.alert(
        "❌ Erro", 
        "Não foi possível compartilhar o relatório. Tente novamente."
      );
    }
  };

  const handleDownloadReport = async () => {
    console.log('🔍 Debug: Iniciando download do relatório por período');
    console.log('🔍 Debug: reportData.length =', reportData.length);
    
    if (reportData.length === 0) {
      Alert.alert("Erro", "Gere um relatório primeiro antes de baixar.");
      return;
    }

    if (downloading.range) return; // Evita múltiplos downloads simultâneos

    try {
      setDownloading(prev => ({ ...prev, range: true }));
      setDownloadProgress('📥 Iniciando download...');
      
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
      setDownloadProgress('📄 Gerando PDF...');
      
      const { uri, fileName } = await generatePdfFile(reportData, type);
      console.log('🔍 Debug: PDF gerado - uri =', uri, 'fileName =', fileName);
      
      // Salva o arquivo na pasta Downloads do usuário
      const downloadsDir = FileSystem.documentDirectory + 'Downloads/';
      console.log('🔍 Debug: downloadsDir =', downloadsDir);
      
      setDownloadProgress('📁 Preparando pasta...');
      
      // Cria a pasta Downloads se não existir
      const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
      console.log('🔍 Debug: dirInfo.exists =', dirInfo.exists);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
        console.log('🔍 Debug: Pasta Downloads criada');
      }
      
      const destinationUri = downloadsDir + fileName + '.pdf';
      console.log('🔍 Debug: destinationUri =', destinationUri);
      
      setDownloadProgress('💾 Salvando arquivo...');
      
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      console.log('🔍 Debug: Arquivo copiado com sucesso');
      
      setDownloadProgress('🔔 Enviando notificação...');
      
      // Enviar notificação específica para relatório por período
      await notificationService.notifyDownloadComplete(fileName + '.pdf', destinationUri, 'range');
      console.log('🔍 Debug: Notificação enviada');
      
      setDownloadProgress('');
      setDownloading(prev => ({ ...prev, range: false }));
      
      Alert.alert(
        "✅ Download Concluído!", 
        `${fileName}.pdf foi salvo com sucesso na pasta Downloads!`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      setDownloadProgress('');
      setDownloading(prev => ({ ...prev, range: false }));
      Alert.alert(
        "❌ Erro no Download", 
        "Não foi possível baixar o relatório. Tente novamente."
      );
    }
  };

  const handleViewReport = () => {
    if (reportData.length === 0) {
      Alert.alert("Erro", "Gere um relatório primeiro antes de visualizar.");
      return;
    }
    setShowViewModal(true);
  };

  // Função para mostrar local do arquivo
  const showFileLocation = (fileName: string, filePath: string) => {
    setFileLocationData({ fileName, filePath });
    setShowLocationModal(true);
  };

  // Funções específicas para Relatório Mensal
  const handleMonthlyShare = async () => {
    if (!user?.emailVerified) {
      Alert.alert("Acesso Negado", "Você precisa verificar seu e-mail para gerar relatórios.");
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
      Alert.alert("❌ Erro", "Não foi possível compartilhar o relatório mensal. Tente novamente.");
    }
  };

  const handleMonthlyDownload = async () => {
    console.log('🔍 Debug: Iniciando download do relatório mensal');
    
    if (!user?.emailVerified) {
      Alert.alert("Acesso Negado", "Você precisa verificar seu e-mail para gerar relatórios.");
      return;
    }

    if (downloading.monthly) return; // Evita múltiplos downloads simultâneos

    try {
      setDownloading(prev => ({ ...prev, monthly: true }));
      setDownloadProgress('📥 Iniciando download...');
      
      setDownloadProgress('📄 Gerando PDF...');
      const { uri, fileName, data } = await generatePdfFile([], 'monthly');
      console.log('🔍 Debug: PDF mensal gerado - uri =', uri, 'fileName =', fileName);
      
      // Salva o arquivo na pasta Downloads do usuário
      const downloadsDir = FileSystem.documentDirectory + 'Downloads/';
      
      setDownloadProgress('📁 Preparando pasta...');
      
      // Cria a pasta Downloads se não existir
      const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
      }
      
      const destinationUri = downloadsDir + fileName + '.pdf';
      
      setDownloadProgress('💾 Salvando arquivo...');
      
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      setDownloadProgress('🔔 Enviando notificação...');
      
      // Enviar notificação específica para relatório mensal
      await notificationService.notifyDownloadComplete(fileName + '.pdf', destinationUri, 'monthly');
      
      setDownloadProgress('');
      setDownloading(prev => ({ ...prev, monthly: false }));
      
      Alert.alert(
        "✅ Download Concluído!", 
        `${fileName}.pdf foi salvo com sucesso na pasta Downloads!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setDownloadProgress('');
      setDownloading(prev => ({ ...prev, monthly: false }));
      Alert.alert("❌ Erro no Download", "Não foi possível baixar o relatório mensal. Tente novamente.");
    }
  };

  const handleMonthlyView = () => {
    if (!user?.emailVerified) {
      Alert.alert("Acesso Negado", "Você precisa verificar seu e-mail para gerar relatórios.");
      return;
    }

    // Gerar dados do mês atual para visualização
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const monthlyData = readings.filter(r => r.timestamp >= firstDay.getTime() && r.timestamp <= lastDay.getTime());
    
    if (monthlyData.length === 0) {
      Alert.alert("Nenhum Dado", "Não há medições para o mês atual.");
      return;
    }
    
    setReportData(monthlyData);
    setShowViewModal(true);
  };

  // Funções específicas para Histórico Completo
  const handleFullShare = async () => {
    if (!user?.emailVerified) {
      Alert.alert("Acesso Negado", "Você precisa verificar seu e-mail para gerar relatórios.");
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
      Alert.alert("❌ Erro", "Não foi possível compartilhar o histórico completo. Tente novamente.");
    }
  };

  const handleFullDownload = async () => {
    console.log('🔍 Debug: Iniciando download do histórico completo');
    
    if (!user?.emailVerified) {
      Alert.alert("Acesso Negado", "Você precisa verificar seu e-mail para gerar relatórios.");
      return;
    }

    if (downloading.full) return; // Evita múltiplos downloads simultâneos

    try {
      setDownloading(prev => ({ ...prev, full: true }));
      setDownloadProgress('📥 Iniciando download...');
      
      setDownloadProgress('📄 Gerando PDF...');
      const { uri, fileName, data } = await generatePdfFile([], 'full');
      console.log('🔍 Debug: PDF completo gerado - uri =', uri, 'fileName =', fileName);
      
      // Salva o arquivo na pasta Downloads do usuário
      const downloadsDir = FileSystem.documentDirectory + 'Downloads/';
      
      setDownloadProgress('📁 Preparando pasta...');
      
      // Cria a pasta Downloads se não existir
      const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
      }
      
      const destinationUri = downloadsDir + fileName + '.pdf';
      
      setDownloadProgress('💾 Salvando arquivo...');
      
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      setDownloadProgress('🔔 Enviando notificação...');
      
      // Enviar notificação específica para histórico completo
      await notificationService.notifyDownloadComplete(fileName + '.pdf', destinationUri, 'full');
      
      setDownloadProgress('');
      setDownloading(prev => ({ ...prev, full: false }));
      
      Alert.alert(
        "✅ Download Concluído!", 
        `${fileName}.pdf foi salvo com sucesso na pasta Downloads!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setDownloadProgress('');
      setDownloading(prev => ({ ...prev, full: false }));
      Alert.alert("❌ Erro no Download", "Não foi possível baixar o histórico completo. Tente novamente.");
    }
  };

  const handleFullView = () => {
    if (!user?.emailVerified) {
      Alert.alert("Acesso Negado", "Você precisa verificar seu e-mail para gerar relatórios.");
      return;
    }

    try {
      if (readings.length === 0) {
        Alert.alert("Nenhum Dado", "Não há medições registradas.");
        return;
      }
      
      setReportData(readings);
      setShowViewModal(true);
    } catch (error) {
      Alert.alert("❌ Erro", "Não foi possível visualizar o histórico completo. Tente novamente.");
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

            {/* Indicador de Progresso do Download */}
            {(downloading.range || downloading.monthly || downloading.full) && downloadProgress && (
              <View style={styles.downloadProgressContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.downloadProgressText}>{downloadProgress}</Text>
              </View>
            )}
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
            <TouchableOpacity style={styles.actionButtonWrapper} onPress={() => handleGenerateReport('range')}>
              <LinearGradient
                colors={['#fff7ed', '#ffedd5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.periodGenerateButton}
              >
                <Text style={styles.periodGenerateButtonText}>Gerar Relatório por Período</Text>
              </LinearGradient>
            </TouchableOpacity>
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
          <View style={styles.resultsCard}>
            <View style={styles.reportHeader}>
                <Text style={styles.label}>Resultado</Text>
                
                {/* Botões de ação */}
                <View style={styles.horizontalButtons}>
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

        {/* Modal de Visualização */}
        <Modal
          visible={showViewModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Relatório de Glicemia</Text>
              <TouchableOpacity onPress={() => setShowViewModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Gerado em: {new Date().toLocaleDateString('pt-BR')} - {reportData.length} medições
              </Text>
              
              {reportData.map(item => (
                <View key={item.id} style={styles.modalReadingItem}>
                  <View style={styles.modalReadingLeft}>
                    <Text style={styles.modalReadingDate}>{new Date(item.timestamp).toLocaleString('pt-BR')}</Text>
                    <Text style={styles.modalReadingContext}>{item.meal_context}</Text>
                  </View>
                  <View style={styles.modalReadingRight}>
                    <Text style={styles.modalReadingValue}>{item.glucose_level} mg/dL</Text>
                    <Text style={styles.modalReadingStatus}>{getReadingStatus(item.glucose_level)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Modal de Local do Arquivo */}
        <Modal
          visible={showLocationModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowLocationModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="folder-open" size={24} color={theme.primary} />
              <Text style={styles.modalTitle}>Local do Arquivo</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {fileLocationData && (
                <>
                  <View style={styles.locationCard}>
                    <MaterialIcons name="description" size={48} color={theme.primary} />
                    <Text style={styles.fileName}>{fileLocationData.fileName}</Text>
                    <Text style={styles.locationLabel}>Arquivo salvo em:</Text>
                    <Text style={styles.filePath}>{notificationService.formatFilePath(fileLocationData.filePath)}</Text>
                  </View>
                  
                  <View style={styles.locationActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.copyButton]} 
                      onPress={() => {
                        // Aqui você pode implementar copiar para área de transferência
                        Alert.alert("Copiado!", "Caminho do arquivo copiado para a área de transferência.");
                      }}
                    >
                      <MaterialIcons name="content-copy" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Copiar Caminho</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.openButton]} 
                      onPress={() => {
                        // Aqui você pode implementar abrir gerenciador de arquivos
                        Alert.alert("Abrir Arquivo", "Funcionalidade de abrir arquivo será implementada em breve.");
                      }}
                    >
                      <MaterialIcons name="open-in-new" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Abrir Arquivo</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </SafeAreaView>
        </Modal>
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
  downloadProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  downloadProgressText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
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
    marginBottom: 4,
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
  periodGenerateButton: {
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
  readingDate: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  readingContext: {
    fontSize: 12,
    color: theme.secundaryText,
    textTransform: 'capitalize',
  },
  readingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  readingStatus: {
    fontSize: 12,
    color: theme.secundaryText,
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
});