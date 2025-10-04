import { bluetoothGlucoseService, GlucoseReading } from './bluetoothService';
import { addReading } from './dbService';

export interface SyncProgress {
  status: 'idle' | 'scanning' | 'connecting' | 'reading' | 'syncing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  readingsCount: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  readingsAdded: number;
  error?: string;
  deviceName?: string;
}

export class GlucoseSyncService {
  private onProgressCallback?: (progress: SyncProgress) => void;
  private isRunning = false;

  constructor() {
    // Inicializa o serviço Bluetooth
    this.initializeBluetooth();
  }

  private async initializeBluetooth(): Promise<void> {
    try {
      await bluetoothGlucoseService.initialize();
    } catch (error) {
      console.error('Erro ao inicializar Bluetooth:', error);
    }
  }

  // Define callback para progresso
  setProgressCallback(callback: (progress: SyncProgress) => void): void {
    this.onProgressCallback = callback;
  }

  // Atualiza o progresso
  private updateProgress(progress: Partial<SyncProgress>): void {
    if (this.onProgressCallback) {
      this.onProgressCallback({
        status: 'idle',
        progress: 0,
        message: '',
        readingsCount: 0,
        ...progress
      });
    }
  }

  // Inicia a sincronização automática
  async startAutoSync(): Promise<SyncResult> {
    if (this.isRunning) {
      return {
        success: false,
        readingsAdded: 0,
        error: 'Sincronização já em andamento'
      };
    }

    this.isRunning = true;

    try {
      // Etapa 1: Escaneamento
      this.updateProgress({
        status: 'scanning',
        progress: 10,
        message: 'Escaneando dispositivos Bluetooth...'
      });

      const devices = await this.scanForGlucoseDevices();
      
      if (devices.length === 0) {
        this.updateProgress({
          status: 'error',
          progress: 100,
          message: 'Nenhum glicosímetro encontrado',
          error: 'Nenhum dispositivo de glicemia detectado'
        });
        return {
          success: false,
          readingsAdded: 0,
          error: 'Nenhum glicosímetro encontrado'
        };
      }

      // Etapa 2: Conexão
      this.updateProgress({
        status: 'connecting',
        progress: 30,
        message: `Conectando ao ${devices[0].name || 'dispositivo'}...`
      });

      const connected = await bluetoothGlucoseService.connectToDevice(devices[0]);
      
      if (!connected) {
        this.updateProgress({
          status: 'error',
          progress: 100,
          message: 'Falha na conexão',
          error: 'Não foi possível conectar ao dispositivo'
        });
        return {
          success: false,
          readingsAdded: 0,
          error: 'Falha na conexão'
        };
      }

      // Etapa 3: Leitura de dados
      this.updateProgress({
        status: 'reading',
        progress: 50,
        message: 'Lendo dados do glicosímetro...'
      });

      const readings = await bluetoothGlucoseService.readGlucoseData();
      
      if (readings.length === 0) {
        this.updateProgress({
          status: 'error',
          progress: 100,
          message: 'Nenhum dado encontrado',
          error: 'O dispositivo não possui leituras para sincronizar'
        });
        return {
          success: false,
          readingsAdded: 0,
          error: 'Nenhum dado encontrado'
        };
      }

      // Etapa 4: Sincronização
      this.updateProgress({
        status: 'syncing',
        progress: 70,
        message: `Sincronizando ${readings.length} leituras...`,
        readingsCount: readings.length
      });

      const syncResult = await this.syncReadingsToDatabase(readings);

      // Etapa 5: Concluída
      this.updateProgress({
        status: 'completed',
        progress: 100,
        message: `Sincronização concluída! ${syncResult.readingsAdded} leituras adicionadas.`,
        readingsCount: syncResult.readingsAdded
      });

      return {
        success: true,
        readingsAdded: syncResult.readingsAdded,
        deviceName: devices[0].name || 'Dispositivo Bluetooth'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      this.updateProgress({
        status: 'error',
        progress: 100,
        message: 'Erro na sincronização',
        error: errorMessage
      });

      return {
        success: false,
        readingsAdded: 0,
        error: errorMessage
      };
    } finally {
      this.isRunning = false;
      // Desconecta do dispositivo
      await bluetoothGlucoseService.disconnect();
    }
  }

  // Escaneia dispositivos de glicemia
  private async scanForGlucoseDevices(): Promise<any[]> {
    return new Promise((resolve) => {
      const devices: any[] = [];
      const timeout = 10000; // 10 segundos
      
      // Inicia o scan
      bluetoothGlucoseService.initialize().then(() => {
        const startTime = Date.now();
        
        const scanInterval = setInterval(() => {
          // Simula detecção de dispositivos (em produção, isso seria feito pelo BLE Manager)
          if (Date.now() - startTime > timeout || devices.length > 0) {
            clearInterval(scanInterval);
            resolve(devices);
          }
        }, 1000);

        // Para o scan após timeout
        setTimeout(() => {
          clearInterval(scanInterval);
          bluetoothGlucoseService.stopScan();
          resolve(devices);
        }, timeout);
      });
    });
  }

  // Sincroniza leituras para o banco de dados
  private async syncReadingsToDatabase(readings: GlucoseReading[]): Promise<{ readingsAdded: number }> {
    let readingsAdded = 0;

    for (const reading of readings) {
      try {
        // Converte para o formato do banco de dados
        const dbReading = {
          id: reading.id,
          measurement_time: reading.timestamp.toISOString(),
          timestamp: reading.timestamp.getTime(),
          glucose_level: reading.value,
          meal_context: reading.mealContext || null,
          notes: reading.notes || null,
          device_name: reading.deviceName || 'Bluetooth Device'
        };

        await addReading(dbReading as any);
        readingsAdded++;

        // Atualiza progresso
        const progress = 70 + ((readingsAdded / readings.length) * 20);
        this.updateProgress({
          status: 'syncing',
          progress: Math.round(progress),
          message: `Sincronizando ${readingsAdded}/${readings.length} leituras...`,
          readingsCount: readingsAdded
        });

      } catch (error) {
        console.error(`Erro ao salvar leitura ${reading.id}:`, error);
      }
    }

    return { readingsAdded };
  }

  // Para a sincronização
  stopSync(): void {
    if (this.isRunning) {
      bluetoothGlucoseService.disconnect();
      bluetoothGlucoseService.stopScan();
      this.isRunning = false;
      
      this.updateProgress({
        status: 'error',
        progress: 0,
        message: 'Sincronização cancelada',
        error: 'Operação cancelada pelo usuário'
      });
    }
  }

  // Verifica se está em execução
  isSyncRunning(): boolean {
    return this.isRunning;
  }

  // Obtém status da conexão Bluetooth
  isBluetoothConnected(): boolean {
    return bluetoothGlucoseService.isConnected();
  }

  // Obtém informações do dispositivo conectado
  getConnectedDevice(): any | null {
    return bluetoothGlucoseService.getConnectedDevice();
  }

  // Lê dados uma única vez (sem sincronização completa)
  async readSingleData(): Promise<GlucoseReading[]> {
    if (!bluetoothGlucoseService.isConnected()) {
      throw new Error('Nenhum dispositivo conectado');
    }

    return await bluetoothGlucoseService.readGlucoseData();
  }

  // Inicia monitoramento em tempo real
  async startRealTimeMonitoring(callback: (reading: GlucoseReading) => void): Promise<void> {
    if (!bluetoothGlucoseService.isConnected()) {
      throw new Error('Nenhum dispositivo conectado');
    }

    await bluetoothGlucoseService.startMonitoring(callback);
  }
}

// Instância singleton do serviço
export const glucoseSyncService = new GlucoseSyncService();
