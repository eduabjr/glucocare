import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { GlucoseReading } from './bluetoothService';
import { parseFileContent } from './fileParsingService';

export interface FileLinkingResult {
  success: boolean;
  readings?: GlucoseReading[];
  error?: string;
  fileName?: string;
}

class LinkingService {
  private isInitialized = false;

  constructor() {
    this.initializeLinking();
  }

  private initializeLinking() {
    if (this.isInitialized) return;

    // Configura o scheme do app
    const linking = {
      prefixes: ['glucocare://', Linking.createURL('')],
      config: {
        screens: {
          DeviceConnection: 'device-connection/:filePath?',
        },
      },
    };

    // Listener para deep links quando o app está em background/foreground
    Linking.addEventListener('url', this.handleDeepLink);

    // Verifica se o app foi aberto com um deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink({ url });
      }
    });

    this.isInitialized = true;
  }

  private handleDeepLink = async (event: { url: string }) => {
    const { url } = event;
    console.log('🔗 Deep link recebido:', url);

    try {
      // Verifica se é uma URL de arquivo
      if (url.startsWith('file://') || url.includes('.csv') || url.includes('.xlsx') || url.includes('.xml') || url.includes('.pdf')) {
        const filePath = this.extractFilePath(url);
        if (filePath) {
          await this.processFileFromDeepLink(filePath);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar deep link:', error);
    }
  };

  private extractFilePath(url: string): string | null {
    // Extrai o caminho do arquivo da URL
    if (url.startsWith('file://')) {
      return decodeURIComponent(url.replace('file://', ''));
    }
    
    // Para URLs de compartilhamento, pode vir como parâmetro
    const urlObj = new URL(url);
    const filePath = urlObj.searchParams.get('filePath');
    return filePath ? decodeURIComponent(filePath) : null;
  }

  public async processFileFromDeepLink(filePath: string): Promise<FileLinkingResult> {
    try {
      console.log('📁 Processando arquivo do deep link:', filePath);

      // Verifica se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'Arquivo não encontrado'
        };
      }

      // Lê o conteúdo do arquivo
      const content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Extrai o nome do arquivo
      const fileName = filePath.split('/').pop() || 'arquivo_importado';

      // Processa o conteúdo baseado na extensão
      const readings = await parseFileContent(content, fileName);

      if (readings.length === 0) {
        return {
          success: false,
          error: 'Nenhuma leitura válida encontrada no arquivo',
          fileName
        };
      }

      console.log(`✅ ${readings.length} leituras processadas do arquivo: ${fileName}`);

      return {
        success: true,
        readings,
        fileName
      };

    } catch (error) {
      console.error('❌ Erro ao processar arquivo do deep link:', error);
      return {
        success: false,
        error: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  public async processSharedFile(): Promise<FileLinkingResult> {
    try {
      // Usa o DocumentPicker para pegar o arquivo compartilhado
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/xml', 'text/xml', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          success: false,
          error: 'Seleção de arquivo cancelada'
        };
      }

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const readings = await parseFileContent(content, file.name || 'arquivo_importado');

      if (readings.length === 0) {
        return {
          success: false,
          error: 'Nenhuma leitura válida encontrada no arquivo',
          fileName: file.name || 'arquivo_importado'
        };
      }

      return {
        success: true,
        readings,
        fileName: file.name || 'arquivo_importado'
      };

    } catch (error) {
      console.error('❌ Erro ao processar arquivo compartilhado:', error);
      return {
        success: false,
        error: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  public cleanup() {
    Linking.removeAllListeners('url');
    this.isInitialized = false;
  }
}

// Instância singleton
export const linkingService = new LinkingService();
