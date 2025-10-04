// Importação condicional do react-native-ble-plx
let BleManager: any = null;
let Device: any = null;
let Characteristic: any = null;
let Service: any = null;

// Tenta importar o módulo BLE apenas se estiver disponível
try {
  // Temporariamente desabilitado para Expo Dev Client
  // const BLEModule = require('react-native-ble-plx');
  // BleManager = BLEModule.BleManager;
  // Device = BLEModule.Device;
  // Characteristic = BLEModule.Characteristic;
  // Service = BLEModule.Service;
  console.log('⚠️ react-native-ble-plx temporariamente desabilitado para Expo Dev Client');
} catch (error) {
  console.log('⚠️ react-native-ble-plx não disponível:', error);
}

// Interfaces para dados de glicemia
export interface GlucoseReading {
  id: string;
  timestamp: Date;
  value: number; // mg/dL
  mealContext?: 'jejum' | 'pre-refeicao' | 'pos-refeicao' | 'antes-dormir' | 'madrugada';
  notes?: string;
  deviceName?: string;
}

// Configurações específicas para cada dispositivo
export interface DeviceConfig {
  name: string;
  serviceUUID: string;
  characteristicUUID: string;
  dataFormat: 'hex' | 'json' | 'csv';
  parser: (data: string) => GlucoseReading[];
}

// Mapeamento de dispositivos suportados
export const SUPPORTED_DEVICES: { [key: string]: DeviceConfig } = {
  'ACCU-CHEK': {
    name: 'Accu-Chek Guide/Performa',
    serviceUUID: '00001809-0000-1000-8000-00805f9b34fb', // Health Thermometer Service
    characteristicUUID: '00002a1c-0000-1000-8000-00805f9b34fb', // Temperature Measurement
    dataFormat: 'hex',
    parser: parseAccuChekData
  },
  'ONETOUCH': {
    name: 'OneTouch Verio/Ultra',
    serviceUUID: '0000180a-0000-1000-8000-00805f9b34fb', // Device Information Service
    characteristicUUID: '00002a25-0000-1000-8000-00805f9b34fb', // Serial Number String
    dataFormat: 'json',
    parser: parseOneTouchData
  },
  'FREESTYLE': {
    name: 'FreeStyle Libre',
    serviceUUID: '0000fe95-0000-1000-8000-00805f9b34fb', // Custom Service
    characteristicUUID: '0000fe96-0000-1000-8000-00805f9b34fb', // Custom Characteristic
    dataFormat: 'hex',
    parser: parseFreeStyleData
  }
};

// Parsers específicos para cada dispositivo
function parseAccuChekData(data: string): GlucoseReading[] {
  const readings: GlucoseReading[] = [];
  try {
    // Accu-Chek usa formato hex com timestamp e valor
    const bytes = data.match(/.{2}/g) || [];
    if (bytes.length >= 6) {
      // Primeiros 4 bytes = timestamp, próximos 2 = valor
      const timestamp = parseInt(bytes.slice(0, 4).join(''), 16);
      const value = parseInt(bytes.slice(4, 6).join(''), 16);
      
      readings.push({
        id: `accu-${timestamp}`,
        timestamp: new Date(timestamp * 1000),
        value: value,
        deviceName: 'Accu-Chek'
      });
    }
  } catch (error) {
    console.error('Erro ao fazer parse dos dados Accu-Chek:', error);
  }
  return readings;
}

function parseOneTouchData(data: string): GlucoseReading[] {
  const readings: GlucoseReading[] = [];
  try {
    const jsonData = JSON.parse(data);
    if (jsonData.readings && Array.isArray(jsonData.readings)) {
      jsonData.readings.forEach((reading: any, index: number) => {
        readings.push({
          id: `onetouch-${reading.timestamp || Date.now()}-${index}`,
          timestamp: new Date(reading.timestamp || Date.now()),
          value: reading.glucose || reading.value,
          mealContext: reading.mealContext,
          notes: reading.notes,
          deviceName: 'OneTouch'
        });
      });
    }
  } catch (error) {
    console.error('Erro ao fazer parse dos dados OneTouch:', error);
  }
  return readings;
}

function parseFreeStyleData(data: string): GlucoseReading[] {
  const readings: GlucoseReading[] = [];
  try {
    // FreeStyle Libre usa formato hex complexo
    const bytes = data.match(/.{2}/g) || [];
    if (bytes.length >= 12) {
      // Estrutura: header (4 bytes) + timestamp (4 bytes) + valor (2 bytes) + checksum (2 bytes)
      const timestamp = parseInt(bytes.slice(4, 8).join(''), 16);
      const value = parseInt(bytes.slice(8, 10).join(''), 16);
      
      readings.push({
        id: `freestyle-${timestamp}`,
        timestamp: new Date(timestamp * 1000),
        value: value,
        deviceName: 'FreeStyle Libre'
      });
    }
  } catch (error) {
    console.error('Erro ao fazer parse dos dados FreeStyle:', error);
  }
  return readings;
}

export class BluetoothGlucoseService {
  private bleManager: any = null;
  private connectedDevice: any = null;
  private isScanning = false;

  constructor() {
    // Só inicializa o BleManager se estiver disponível
    if (BleManager) {
      try {
        this.bleManager = new BleManager();
      } catch (error) {
        console.log('⚠️ Erro ao inicializar BleManager:', error);
        this.bleManager = null;
      }
    }
  }

  // Inicializa o BLE Manager
  async initialize(): Promise<boolean> {
    if (!this.bleManager) {
      console.log('⚠️ BleManager não disponível');
      return false;
    }

    try {
      await this.bleManager.startDeviceScan(null, null, (error: any, device: any) => {
        if (error) {
          console.error('Erro no scan BLE:', error);
          return;
        }
        // Processamento do dispositivo será feito pelo callback externo
      });
      return true;
    } catch (error) {
      console.error('Erro ao inicializar BLE Manager:', error);
      return false;
    }
  }

  // Para o scan
  stopScan(): void {
    if (this.isScanning && this.bleManager) {
      this.bleManager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  // Identifica o tipo de dispositivo baseado no nome
  identifyDevice(deviceName: string): DeviceConfig | null {
    const upperName = deviceName.toUpperCase();
    
    if (upperName.includes('ACCU') || upperName.includes('CHEK')) {
      return SUPPORTED_DEVICES['ACCU-CHEK'];
    } else if (upperName.includes('ONETOUCH') || upperName.includes('VERIO')) {
      return SUPPORTED_DEVICES['ONETOUCH'];
    } else if (upperName.includes('FREESTYLE') || upperName.includes('LIBRE')) {
      return SUPPORTED_DEVICES['FREESTYLE'];
    }
    
    return null;
  }

  // Conecta a um dispositivo
  async connectToDevice(device: any): Promise<boolean> {
    if (!this.bleManager) {
      console.log('⚠️ BleManager não disponível para conexão');
      return false;
    }

    try {
      console.log(`Conectando ao dispositivo: ${device.name || device.id}`);
      
      // Para o scan se estiver ativo
      this.stopScan();
      
      // Conecta ao dispositivo
      const connectedDevice = await this.bleManager.connectToDevice(device.id);
      
      // Descobre serviços e características
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      this.connectedDevice = connectedDevice;
      console.log('Dispositivo conectado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao conectar ao dispositivo:', error);
      return false;
    }
  }

  // Lê dados de glicemia do dispositivo
  async readGlucoseData(): Promise<GlucoseReading[]> {
    if (!this.connectedDevice) {
      throw new Error('Nenhum dispositivo conectado');
    }

    const deviceConfig = this.identifyDevice(this.connectedDevice.name || '');
    if (!deviceConfig) {
      throw new Error('Dispositivo não suportado');
    }

    try {
      // Encontra o serviço
      const services = await this.connectedDevice.services();
      const targetService = services.find(service => 
        service.uuid.toLowerCase() === deviceConfig.serviceUUID.toLowerCase()
      );

      if (!targetService) {
        throw new Error('Serviço não encontrado');
      }

      // Encontra a característica
      const characteristics = await targetService.characteristics();
      const targetCharacteristic = characteristics.find(char => 
        char.uuid.toLowerCase() === deviceConfig.characteristicUUID.toLowerCase()
      );

      if (!targetCharacteristic) {
        throw new Error('Característica não encontrada');
      }

      // Lê os dados
      const data = await targetCharacteristic.read();
      const dataString = data.value || '';
      
      // Faz o parse dos dados
      const readings = deviceConfig.parser(dataString);
      
      console.log(`Dados lidos: ${readings.length} leituras`);
      return readings;

    } catch (error) {
      console.error('Erro ao ler dados do dispositivo:', error);
      throw error;
    }
  }

  // Monitora dados em tempo real (se suportado)
  async startMonitoring(callback: (reading: GlucoseReading) => void): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('Nenhum dispositivo conectado');
    }

    const deviceConfig = this.identifyDevice(this.connectedDevice.name || '');
    if (!deviceConfig) {
      throw new Error('Dispositivo não suportado');
    }

    try {
      const services = await this.connectedDevice.services();
      const targetService = services.find(service => 
        service.uuid.toLowerCase() === deviceConfig.serviceUUID.toLowerCase()
      );

      if (!targetService) return;

      const characteristics = await targetService.characteristics();
      const targetCharacteristic = characteristics.find(char => 
        char.uuid.toLowerCase() === deviceConfig.characteristicUUID.toLowerCase()
      );

      if (!targetCharacteristic) return;

      // Monitora mudanças na característica
      targetCharacteristic.monitor((error, characteristic) => {
        if (error) {
          console.error('Erro no monitoramento:', error);
          return;
        }

        if (characteristic?.value) {
          try {
            const readings = deviceConfig.parser(characteristic.value);
            readings.forEach(reading => callback(reading));
          } catch (parseError) {
            console.error('Erro ao fazer parse dos dados monitorados:', parseError);
          }
        }
      });

    } catch (error) {
      console.error('Erro ao iniciar monitoramento:', error);
      throw error;
    }
  }

  // Desconecta do dispositivo
  async disconnect(): Promise<void> {
    if (this.connectedDevice && this.bleManager) {
      try {
        await this.bleManager.cancelDeviceConnection(this.connectedDevice.id);
        this.connectedDevice = null;
        console.log('Dispositivo desconectado');
      } catch (error) {
        console.error('Erro ao desconectar:', error);
      }
    }
  }

  // Verifica se está conectado
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  // Obtém informações do dispositivo conectado
  getConnectedDevice(): any | null {
    return this.connectedDevice;
  }

  // Limpa recursos
  destroy(): void {
    this.stopScan();
    if (this.connectedDevice) {
      this.disconnect();
    }
    if (this.bleManager) {
      this.bleManager.destroy();
    }
  }
}

// Mock service para quando BLE não está disponível
class MockBluetoothGlucoseService {
  private connectedDevice: any = null;
  private isScanning = false;

  async initialize(): Promise<boolean> {
    console.log('📱 Usando mock do BluetoothGlucoseService');
    return true;
  }

  stopScan(): void {
    this.isScanning = false;
  }

  identifyDevice(deviceName: string): DeviceConfig | null {
    return SUPPORTED_DEVICES['ACCU-CHEK']; // Retorna um mock por padrão
  }

  async connectToDevice(device: any): Promise<boolean> {
    console.log('📱 Mock: Conectando ao dispositivo:', device.name || device.id);
    this.connectedDevice = { ...device, mock: true };
    return true;
  }

  async readGlucoseData(): Promise<GlucoseReading[]> {
    // Retorna dados mock para teste
    const mockReadings: GlucoseReading[] = [
      {
        id: 'mock-1',
        timestamp: new Date(),
        value: 120,
        mealContext: 'jejum',
        deviceName: 'Mock Device'
      },
      {
        id: 'mock-2',
        timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
        value: 95,
        mealContext: 'pos-refeicao',
        deviceName: 'Mock Device'
      }
    ];
    
    console.log('📱 Mock: Retornando leituras simuladas:', mockReadings.length);
    return mockReadings;
  }

  async startMonitoring(callback: (reading: GlucoseReading) => void): Promise<void> {
    console.log('📱 Mock: Iniciando monitoramento');
    // Simula uma leitura após 2 segundos
    setTimeout(() => {
      callback({
        id: 'mock-live',
        timestamp: new Date(),
        value: 110,
        mealContext: 'pre-refeicao',
        deviceName: 'Mock Device'
      });
    }, 2000);
  }

  async disconnect(): Promise<void> {
    console.log('📱 Mock: Desconectando dispositivo');
    this.connectedDevice = null;
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  getConnectedDevice(): any | null {
    return this.connectedDevice;
  }

  destroy(): void {
    this.connectedDevice = null;
    this.isScanning = false;
  }
}

// Instância singleton do serviço (real ou mock)
export const bluetoothGlucoseService = BleManager ? 
  new BluetoothGlucoseService() : 
  new MockBluetoothGlucoseService() as any;
