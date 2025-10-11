import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Serviço temporário de notificações sem expo-notifications
// Para resolver o erro de módulo não encontrado

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export interface ScheduleNotificationData extends NotificationData {
  trigger?: {
    date?: Date;
    seconds?: number;
  };
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

  // Agendar notificação local (temporário - simula agendamento)
  async scheduleLocalNotification(notification: ScheduleNotificationData): Promise<void> {
    try {
      console.log('Agendando notificação:', notification.title);
      console.log('Para:', notification.trigger?.date || 'Imediatamente');
      
      // Simula agendamento - em produção usaria expo-notifications
      if (notification.trigger?.date) {
        const now = new Date();
        const triggerDate = notification.trigger.date;
        
        if (triggerDate > now) {
          console.log(`Notificação agendada para ${triggerDate.toLocaleString()}`);
          // Em produção, aqui usaria expo-notifications para agendar
          // Por enquanto, apenas loga a informação
        } else {
          // Se a data já passou, envia imediatamente
          await this.sendLocalNotification(notification.title, notification.body, notification.data);
        }
      } else {
        // Envia imediatamente se não há trigger
        await this.sendLocalNotification(notification.title, notification.body, notification.data);
      }
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      throw error;
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
<<<<<<< HEAD
    try {
      // Remove caminhos comuns do sistema para mostrar caminho mais amigável
      const commonPaths = [
        '/storage/emulated/0/Android/data/com.expo.modules.expoview/files/',
        '/var/mobile/Containers/Data/Application/',
        '/Users/',
        'file://'
      ];
      
      let friendlyPath = filePath;
      for (const commonPath of commonPaths) {
        if (friendlyPath.includes(commonPath)) {
          friendlyPath = friendlyPath.replace(commonPath, '');
          break;
        }
      }
      
      // Se o caminho ainda é muito longo, mostra apenas o nome do arquivo
      if (friendlyPath.length > 50) {
        const fileName = friendlyPath.split('/').pop() || friendlyPath;
        return `.../${fileName}`;
      }
      
      return friendlyPath || filePath;
    } catch (error) {
      console.warn('Erro ao formatar caminho do arquivo:', error);
=======
    // Remove o prefixo do diretório de documentos para mostrar caminho mais amigável
    try {
      // Em versões mais recentes do expo-file-system, use FileSystem.documentDirectory se existir
      const docDir = (FileSystem as any).documentDirectory || '';
      const friendlyPath = filePath.replace(docDir, '');
      return friendlyPath || filePath;
    } catch (error) {
>>>>>>> 2eab2aa8527fe58ddf195b904f8e4f2f28cb5f09
      return filePath;
    }
  }
}

export const notificationService = new NotificationService();
