import { GlucoseReading } from './bluetoothService';
import { Reading } from './dbService';
import { fileAnalysisService } from './fileAnalysisService';

// Interface para dados brutos de Bluetooth
export interface BluetoothRawData {
  deviceType: string;
  rawData: string;
  timestamp: number;
  metadata?: {
    deviceName?: string;
    batteryLevel?: number;
    signalStrength?: number;
  };
}

// Interface para resultado da análise Bluetooth
export interface BluetoothAnalysisResult {
  success: boolean;
  readings: GlucoseReading[];
  confidence: number;
  metadata?: {
    deviceType: string;
    totalDataPoints: number;
    validReadings: number;
    errors: string[];
    suggestions?: string[];
  };
}

class BluetoothAnalysisService {
  
  /**
   * Analisa dados brutos de Bluetooth usando IA para extrair leituras de glicose
   */
  async analyzeBluetoothData(
    rawData: BluetoothRawData,
    userId: string
  ): Promise<BluetoothAnalysisResult> {
    try {
      console.log('🤖 Analisando dados Bluetooth do dispositivo:', rawData.deviceType);
      
      // Usa o serviço de análise de arquivos para processar os dados
      const aiExtractedData = await fileAnalysisService.analyzeBluetoothData(
        rawData.rawData,
        rawData.deviceType
      );
      
      if (aiExtractedData.length === 0) {
        return {
          success: false,
          readings: [],
          confidence: 0,
          metadata: {
            deviceType: rawData.deviceType,
            totalDataPoints: 0,
            validReadings: 0,
            errors: ['Nenhuma leitura válida encontrada nos dados Bluetooth'],
            suggestions: ['Verifique se o dispositivo está funcionando corretamente']
          }
        };
      }
      
      // Converte para formato GlucoseReading
      const readings = aiExtractedData.map((data, index) => ({
        id: `bluetooth-${userId}-${Date.now()}-${index}`,
        timestamp: new Date(data.timestamp || rawData.timestamp),
        value: data.glucoseLevel,
        mealContext: (data.mealContext as 'jejum' | 'pre-refeicao' | 'pos-refeicao' | 'antes-dormir' | 'madrugada') || undefined,
        notes: data.notes || `Leitura do ${rawData.deviceType}`,
        deviceName: rawData.deviceType
      }));
        value: data.glucoseLevel,
        timestamp: new Date(data.timestamp || rawData.timestamp),
        mealContext: data.mealContext || 'Bluetooth',
        notes: data.notes || `Leitura do ${rawData.deviceType}`,
        confidence: data.confidence,
        deviceType: rawData.deviceType,
        batteryLevel: rawData.metadata?.batteryLevel,
        signalStrength: rawData.metadata?.signalStrength
      }) as any);
      
      // Calcula confiança média dos dados originais
      const avgConfidence = aiExtractedData.reduce((sum, data) => sum + (data.confidence || 0), 0) / aiExtractedData.length;
      
      return {
        success: true,
        readings,
        confidence: Math.round(avgConfidence),
        metadata: {
          deviceType: rawData.deviceType,
          totalDataPoints: aiExtractedData.length,
          validReadings: readings.length,
          errors: [],
          suggestions: this.generateBluetoothSuggestions(avgConfidence, readings.length, rawData.deviceType)
        }
      };
      
    } catch (error) {
      console.error('❌ Erro na análise de dados Bluetooth:', error);
      return {
        success: false,
        readings: [],
        confidence: 0,
        metadata: {
          deviceType: rawData.deviceType,
          totalDataPoints: 0,
          validReadings: 0,
          errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
          suggestions: ['Verifique a conexão Bluetooth e tente novamente']
        }
      };
    }
  }

  /**
   * Processa leituras de Bluetooth e as converte para formato Reading do banco
   */
  convertToDatabaseReadings(bluetoothReadings: GlucoseReading[], userId: string): Reading[] {
    return bluetoothReadings.map(reading => ({
      id: reading.id,
      user_id: userId,
      timestamp: reading.timestamp.getTime(),
      measurement_time: reading.timestamp.toISOString(),
      glucose_level: reading.value,
      meal_context: reading.mealContext,
      notes: reading.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pending_sync: true,
      ai_confidence: 0.85 // Valor padrão de confiança para leituras Bluetooth
      timestamp: typeof reading.timestamp === 'number' ? reading.timestamp : Date.now(),
      glucose_level: reading.value,
      meal_context: reading.mealContext || 'Bluetooth',
      notes: reading.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pending_sync: true,
      ai_confidence: (reading as any).confidence || 0
    }));
  }

  /**
   * Valida dados de Bluetooth antes do processamento
   */
  validateBluetoothData(rawData: BluetoothRawData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!rawData.rawData || rawData.rawData.trim().length === 0) {
      errors.push('Dados brutos vazios ou inválidos');
    }
    
    if (!rawData.deviceType || rawData.deviceType.trim().length === 0) {
      errors.push('Tipo de dispositivo não identificado');
    }
    
    if (rawData.timestamp <= 0) {
      errors.push('Timestamp inválido');
    }
    
    // Validações específicas por tipo de dispositivo
    switch (rawData.deviceType.toLowerCase()) {
      case 'accu-chek guide':
        if (!rawData.rawData.includes('0x') && !rawData.rawData.includes('hex')) {
          errors.push('Dados do Accu-Chek Guide devem conter formato hexadecimal');
        }
        break;
        
      case 'onetouch verio':
        if (!rawData.rawData.match(/\d+/)) {
          errors.push('Dados do OneTouch Verio devem conter valores numéricos');
        }
        break;
        
      case 'freestyle libre':
        if (!rawData.rawData.includes('timestamp') && !rawData.rawData.includes('time')) {
          errors.push('Dados do FreeStyle Libre devem conter timestamps');
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private generateBluetoothSuggestions(
    confidence: number, 
    validReadings: number, 
    deviceType: string
  ): string[] {
    const suggestions: string[] = [];
    
    if (confidence < 70) {
      suggestions.push('Confiança baixa na extração. Verifique se o dispositivo está funcionando corretamente.');
    }
    
    if (validReadings === 0) {
      suggestions.push('Nenhuma leitura válida encontrada. Verifique a conexão Bluetooth.');
    } else if (validReadings < 3) {
      suggestions.push('Poucas leituras encontradas. O dispositivo pode ter dados limitados.');
    }
    
    // Sugestões específicas por dispositivo
    switch (deviceType.toLowerCase()) {
      case 'accu-chek guide':
        suggestions.push('Para Accu-Chek Guide: Certifique-se de que o dispositivo está sincronizado');
        break;
      case 'onetouch verio':
        suggestions.push('Para OneTouch Verio: Verifique se há medições recentes no dispositivo');
        break;
      case 'freestyle libre':
        suggestions.push('Para FreeStyle Libre: Aguarde alguns minutos para dados mais recentes');
        break;
    }
    
    if (confidence > 90 && validReadings > 5) {
      suggestions.push('Sincronização de alta qualidade! Todos os dados foram processados com sucesso.');
    }
    
    return suggestions;
  }
}

export const bluetoothAnalysisService = new BluetoothAnalysisService();
