import { Reading } from './dbService';

// Interface para resultado da análise de arquivo
export interface FileAnalysisResult {
  success: boolean;
  readings: Reading[];
  confidence: number; // 0-100
  metadata?: {
    fileType: string;
    totalRows: number;
    validRows: number;
    errors: string[];
    suggestions?: string[];
  };
}

// Interface para dados extraídos por IA
export interface AIExtractedData {
  glucoseLevel: number;
  timestamp: number;
  mealContext?: string;
  notes?: string;
  confidence: number;
}

class FileAnalysisService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  }

  /**
   * Analisa o conteúdo de um arquivo usando IA para extrair dados de glicose
   */
  async analyzeFileContent(
    fileContent: string,
    fileName: string,
    userId: string
  ): Promise<FileAnalysisResult> {
    try {
      console.log('🤖 Iniciando análise de IA para arquivo:', fileName);
      
      // Determina o tipo de arquivo
      const fileType = this.getFileType(fileName);
      
      // Prepara o prompt baseado no tipo de arquivo
      const prompt = this.generateAnalysisPrompt(fileContent, fileType);
      
      // Chama a IA
      const aiResponse = await this.callGeminiAPI(prompt);
      
      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'Falha na análise por IA');
      }
      
      // Processa a resposta da IA
      const extractedData = this.parseAIResponse(aiResponse.data);
      
      // Converte para formato Reading
      const readings = this.convertToReadings(extractedData, userId);
      
      // Calcula confiança baseada na quantidade de dados válidos
      const confidence = this.calculateConfidence(extractedData, readings);
      
      return {
        success: true,
        readings,
        confidence,
        metadata: {
          fileType,
          totalRows: extractedData.length,
          validRows: readings.length,
          errors: [],
          suggestions: this.generateSuggestions(confidence, readings.length)
        }
      };
      
    } catch (error) {
      console.error('❌ Erro na análise de IA:', error);
      return {
        success: false,
        readings: [],
        confidence: 0,
        metadata: {
          fileType: this.getFileType(fileName),
          totalRows: 0,
          validRows: 0,
          errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
          suggestions: ['Tente usar um formato de arquivo mais simples ou verifique se contém dados de glicose']
        }
      };
    }
  }

  /**
   * Analisa dados de Bluetooth usando IA para interpretar e corrigir valores
   */
  async analyzeBluetoothData(
    rawData: string,
    deviceType: string
  ): Promise<AIExtractedData[]> {
    try {
      console.log('🤖 Analisando dados de Bluetooth do dispositivo:', deviceType);
      
      const prompt = this.generateBluetoothPrompt(rawData, deviceType);
      const aiResponse = await this.callGeminiAPI(prompt);
      
      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'Falha na análise de dados Bluetooth');
      }
      
      return this.parseBluetoothAIResponse(aiResponse.data);
      
    } catch (error) {
      console.error('❌ Erro na análise de dados Bluetooth:', error);
      return [];
    }
  }

  private getFileType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    const typeMap: { [key: string]: string } = {
      'csv': 'CSV',
      'xlsx': 'Excel',
      'xls': 'Excel',
      'xml': 'XML',
      'pdf': 'PDF',
      'txt': 'Texto'
    };
    return typeMap[extension] || 'Desconhecido';
  }

  private generateAnalysisPrompt(fileContent: string, fileType: string): string {
    return `
Você é um especialista em análise de dados médicos. Analise o seguinte conteúdo de arquivo ${fileType} e extraia TODOS os dados de medições de glicose.

INSTRUÇÕES:
1. Procure por valores numéricos que representem níveis de glicose (normalmente entre 50-600 mg/dL)
2. Identifique datas e horários associados a cada medição
3. Extraia contexto adicional como "jejum", "pós-prandial", "pré-prandial", etc.
4. Retorne APENAS um JSON válido com o seguinte formato:

{
  "readings": [
    {
      "glucoseLevel": 120,
      "timestamp": "2024-01-15T08:30:00.000Z",
      "mealContext": "jejum",
      "notes": "medição matinal",
      "confidence": 95
    }
  ]
}

IMPORTANTE:
- Use formato ISO para timestamps
- Valores de glicose devem ser números inteiros
- Confidence deve ser 0-100 (100 = muito confiável)
- Se não encontrar dados válidos, retorne {"readings": []}

CONTEÚDO DO ARQUIVO:
${fileContent.substring(0, 8000)} // Limita para evitar token overflow

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.
`;
  }

  private generateBluetoothPrompt(rawData: string, deviceType: string): string {
    return `
Você é um especialista em protocolos de dispositivos médicos Bluetooth. Analise os seguintes dados brutos de um dispositivo ${deviceType} e extraia as medições de glicose.

DISPOSITIVOS SUPORTADOS:
- Accu-Chek Guide: Formato hexadecimal com timestamps e valores de glicose
- OneTouch Verio: Dados estruturados com medições em mg/dL
- FreeStyle Libre: Dados de sensor contínuo com timestamps

INSTRUÇÕES:
1. Identifique valores de glicose nos dados
2. Extraia timestamps corretos
3. Determine o contexto da medição
4. Retorne JSON com formato:

{
  "readings": [
    {
      "glucoseLevel": 125,
      "timestamp": "2024-01-15T14:22:00.000Z",
      "mealContext": "pós-prandial",
      "notes": "leitura do sensor",
      "confidence": 90
    }
  ]
}

DADOS BRUTOS:
${rawData}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.
`;
  }

  private async callGeminiAPI(prompt: string): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Gemini não configurada');
      }

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1, // Baixa temperatura para respostas mais consistentes
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 4000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Resposta inválida da API');
      }

      const content = data.candidates[0].content.parts[0].text;
      
      try {
        const parsedData = JSON.parse(content);
        return { success: true, data: parsedData };
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta JSON:', content);
        throw new Error('Resposta da IA não é um JSON válido');
      }

    } catch (error) {
      console.error('Erro na chamada da API Gemini:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  private parseAIResponse(aiData: any): AIExtractedData[] {
    if (!aiData.readings || !Array.isArray(aiData.readings)) {
      return [];
    }

    return aiData.readings.map((reading: any, index: number) => ({
      glucoseLevel: parseInt(reading.glucoseLevel) || 0,
      timestamp: new Date(reading.timestamp).getTime() || Date.now(),
      mealContext: reading.mealContext || 'geral',
      notes: reading.notes || `Leitura ${index + 1}`,
      confidence: parseInt(reading.confidence) || 50
    })).filter(data => data.glucoseLevel > 0);
  }

  private parseBluetoothAIResponse(aiData: any): AIExtractedData[] {
    return this.parseAIResponse(aiData);
  }

  private convertToReadings(extractedData: AIExtractedData[], userId: string): Reading[] {
    return extractedData.map((data, index) => ({
      id: `ai-import-${userId}-${Date.now()}-${index}`,
      user_id: userId,
      measurement_time: new Date(data.timestamp).toISOString(),
      glucose_level: data.glucoseLevel,
      meal_context: data.mealContext,
      time_since_meal: null,
      notes: data.notes,
      updated_at: new Date().toISOString(),
      deleted: false,
      pending_sync: true,
      timestamp: data.timestamp // Para compatibilidade
    }));
  }

  private calculateConfidence(extractedData: AIExtractedData[], readings: Reading[]): number {
    if (extractedData.length === 0) return 0;
    
    const avgConfidence = extractedData.reduce((sum, data) => sum + data.confidence, 0) / extractedData.length;
    const successRate = readings.length / extractedData.length;
    
    return Math.round(avgConfidence * successRate);
  }

  private generateSuggestions(confidence: number, validReadings: number): string[] {
    const suggestions: string[] = [];
    
    if (confidence < 70) {
      suggestions.push('Confiança baixa na extração. Verifique se o arquivo contém dados de glicose claramente identificáveis.');
    }
    
    if (validReadings === 0) {
      suggestions.push('Nenhuma leitura válida encontrada. Verifique o formato do arquivo.');
    } else if (validReadings < 5) {
      suggestions.push('Poucas leituras encontradas. O arquivo pode ter formato incomum.');
    }
    
    if (confidence > 90 && validReadings > 10) {
      suggestions.push('Extração de alta qualidade! Todos os dados foram processados com sucesso.');
    }
    
    return suggestions;
  }
}

export const fileAnalysisService = new FileAnalysisService();
