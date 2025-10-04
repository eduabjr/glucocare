import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Serviço temporário de notificações sem expo-notifications
// Para resolver o erro de módulo não encontrado

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  
  // Solicitar permissões para notificações (temporário - sempre true)
  async requestPermissions(): Promise<boolean> {
    // Temporário - sempre retorna true
    return true;
  }

  // Enviar notificação local (temporário - usa Alert)
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      // Temporário - usa Alert do React Native
      Alert.alert(title, body, [
        { text: 'OK', onPress: () => {
          if (data?.action === 'show_file_location' && data?.filePath) {
            this.showFileLocationModal(data.fileName, data.filePath);
          }
        }}
      ]);
      
      console.log('Notificação enviada:', title);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  // Notificação específica para download concluído
  async notifyDownloadComplete(fileName: string, filePath: string, reportType?: string): Promise<void> {
    let title = '📄 Download Concluído!';
    let body = `${fileName} foi salvo com sucesso na pasta Downloads.`;
    
    // Personalizar notificação baseada no tipo de relatório
    if (reportType) {
      if (reportType === 'monthly') {
        title = '📅 Relatório Mensal Baixado!';
        body = `Seu relatório mensal de glicemia foi salvo na pasta Downloads.`;
      } else if (reportType === 'full') {
        title = '📊 Histórico Completo Baixado!';
        body = `Seu histórico completo de medições foi salvo na pasta Downloads.`;
      } else if (reportType === 'range') {
        title = '📈 Relatório por Período Baixado!';
        body = `Seu relatório personalizado foi salvo na pasta Downloads.`;
      }
    }
    
    const data = {
      type: 'download_complete',
      fileName,
      filePath,
      reportType,
      action: 'show_file_location'
    };

    await this.sendLocalNotification(title, body, data);
  }

  private notificationTapCallback: ((fileName: string, filePath: string) => void) | null = null;

  // Definir callback personalizado para quando notificação for tocada
  setNotificationTapCallback(callback: (fileName: string, filePath: string) => void): void {
    this.notificationTapCallback = callback;
  }

  // Mostrar modal de localização do arquivo (temporário)
  showFileLocationModal(fileName: string, filePath: string): void {
    const friendlyPath = this.formatFilePath(filePath);
    Alert.alert(
      '📁 Local do Arquivo',
      `Arquivo: ${fileName}\n\nSalvo em: ${friendlyPath}`,
      [
        { text: 'OK' }
      ]
    );
  }

  // Abrir local do arquivo (temporário - não usado)
  async handleNotificationTap(): Promise<void> {
    // Temporário - não usado
  }

  // Configurar listener para notificações (temporário - retorna função vazia)
  setupNotificationListener(): () => void {
    // Temporário - retorna função vazia
    return () => {};
  }

  // Verificar se o arquivo existe no caminho especificado
  async checkFileExists(filePath: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      console.error('Erro ao verificar existência do arquivo:', error);
      return false;
    }
  }

  // Obter informações do arquivo
  async getFileInfo(filePath: string): Promise<any> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo;
    } catch (error) {
      console.error('Erro ao obter informações do arquivo:', error);
      return null;
    }
  }

  // Formatar caminho do arquivo para exibição amigável
  formatFilePath(filePath: string): string {
    // Remove o prefixo do FileSystem.documentDirectory para mostrar caminho mais amigável
    const friendlyPath = filePath.replace(FileSystem.documentDirectory || '', '');
    return friendlyPath || filePath;
  }
}

export const notificationService = new NotificationService();
