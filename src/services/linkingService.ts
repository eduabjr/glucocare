import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Reading } from './dbService';
import { parseFileContent } from './fileParsingService';

export interface FileLinkingResult {
  success: boolean;
  readings?: Reading[];
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
      const parsedUrl = Linking.parse(url);
      console.log('🔗 URL parseada:', parsedUrl);

      if (parsedUrl.path === 'device-connection') {
        const filePath = this.extractFilePathFromUrl(url);
        if (filePath) {
          // Processa o arquivo automaticamente (userId será obtido do contexto quando necessário)
          await this.processFileFromDeepLink(filePath, 'temp-user');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar deep link:', error);
    }
  };

  private extractFilePathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const filePath = urlObj.searchParams.get('filePath');
      return filePath ? decodeURIComponent(filePath) : null;
    } catch (error) {
      console.error('❌ Erro ao extrair filePath da URL:', error);
      return null;
    }
  }

  public async processFileFromDeepLink(filePath: string, userId: string): Promise<FileLinkingResult> {
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
        encoding: 'utf8',
      });

      // Extrai o nome do arquivo
      const fileName = filePath.split('/').pop() || 'arquivo_importado';

      // Processa o conteúdo baseado na extensão
      const readings = await parseFileContent(content, fileName, userId);

      if (!readings || readings.length === 0) {
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

  public async processSharedFile(userId: string): Promise<FileLinkingResult> {
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

      const fileAsset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(fileAsset.uri, {
        encoding: 'utf8',
      });

      const fileName = fileAsset.name || 'arquivo_importado';

      // Processa o conteúdo baseado na extensão
      const readings = await parseFileContent(content, fileName, userId);

      if (!readings || readings.length === 0) {
        return {
          success: false,
          error: 'Nenhuma leitura válida encontrada no arquivo',
          fileName
        };
      }

      console.log(`✅ ${readings.length} leituras processadas do arquivo compartilhado: ${fileName}`);

      return {
        success: true,
        readings,
        fileName
      };

    } catch (error) {
      console.error('❌ Erro ao processar arquivo compartilhado:', error);
      return {
        success: false,
        error: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  public async processUrlFile(url: string, userId: string): Promise<FileLinkingResult> {
    try {
      console.log('🌐 Processando arquivo da URL:', url);

      // Baixa o arquivo da URL
      const tempFilePath = `/tmp/temp_imported_file_${Date.now()}`;
      const downloadResult = await FileSystem.downloadAsync(url, tempFilePath);
      
      if (!downloadResult.uri) {
        return {
          success: false,
          error: 'Falha ao baixar arquivo da URL'
        };
      }

      // Lê o conteúdo do arquivo baixado
      const content = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: 'utf8',
      });

      // Extrai o nome do arquivo da URL
      const fileName = url.split('/').pop()?.split('?')[0] || 'arquivo_url_importado';

      // Processa o conteúdo baseado na extensão
      const readings = await parseFileContent(content, fileName, userId);

      if (!readings || readings.length === 0) {
        return {
          success: false,
          error: 'Nenhuma leitura válida encontrada no arquivo',
          fileName
        };
      }

      console.log(`✅ ${readings.length} leituras processadas da URL: ${fileName}`);

      // Limpa o arquivo temporário
      try {
        await FileSystem.deleteAsync(downloadResult.uri);
      } catch (cleanupError) {
        console.warn('⚠️ Erro ao limpar arquivo temporário:', cleanupError);
      }

      return {
        success: true,
        readings,
        fileName
      };

    } catch (error) {
      console.error('❌ Erro ao processar arquivo da URL:', error);
      return {
        success: false,
        error: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  public destroy() {
    if (this.isInitialized) {
      // Nota: removeEventListener foi removido na versão mais recente do expo-linking
      // O listener será automaticamente limpo quando o componente for desmontado
      this.isInitialized = false;
    }
  }
}

export const linkingService = new LinkingService();