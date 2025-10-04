import { Reading } from './dbService';

// Interface para recomendação de horário
export interface TimeRecommendation {
  timeSlot: string; // "manhã", "tarde", "noite", "madrugada"
  timeRange: string; // "06:00-09:00", "12:00-15:00", etc.
  frequency: number; // frequência de medições neste horário
  averageGlucose: number; // média de glicose neste horário
  recommendation: string; // recomendação específica
  priority: 'high' | 'medium' | 'low'; // prioridade da recomendação
  reasoning: string; // explicação da recomendação
}

// Interface para análise de padrões
export interface PatternAnalysis {
  totalMeasurements: number;
  timeSlotDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  averageGlucose: number;
  variability: number; // coeficiente de variação
  recommendations: TimeRecommendation[];
  insights: string[];
}

class MeasurementRecommendationService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  }

  /**
   * Analisa as leituras do usuário e gera recomendações de horários para medição
   */
  async analyzeMeasurementPatterns(readings: Reading[]): Promise<PatternAnalysis> {
    try {
      console.log('🤖 Analisando padrões de medição para recomendações...');
      
      if (readings.length < 3) {
        return this.getDefaultRecommendations(readings);
      }

      // Prepara dados para análise
      const analysisData = this.prepareAnalysisData(readings);
      
      // Gera prompt para IA
      const prompt = this.generateAnalysisPrompt(analysisData);
      
      // Chama IA
      const aiResponse = await this.callGeminiAPI(prompt);
      
      if (!aiResponse.success || !aiResponse.data) {
        console.log('⚠️ IA falhou, usando análise padrão');
        return this.getDefaultRecommendations(readings);
      }
      
      // Processa resposta da IA
      const recommendations = this.parseAIRecommendations(aiResponse.data, analysisData);
      
      return {
        totalMeasurements: readings.length,
        timeSlotDistribution: analysisData.timeSlotDistribution,
        averageGlucose: analysisData.averageGlucose,
        variability: analysisData.variability,
        recommendations,
        insights: this.generateInsights(analysisData, recommendations)
      };
      
    } catch (error) {
      console.error('❌ Erro na análise de padrões:', error);
      return this.getDefaultRecommendations(readings);
    }
  }

  private prepareAnalysisData(readings: Reading[]) {
    const timeSlots = {
      morning: 0,    // 06:00-12:00
      afternoon: 0,  // 12:00-18:00
      evening: 0,    // 18:00-24:00
      night: 0       // 00:00-06:00
    };

    const hourlyData: { [hour: number]: number[] } = {};
    const glucoseValues: number[] = [];

    readings.forEach(reading => {
      const timestamp = reading.measurement_time || reading.timestamp;
      const date = new Date(timestamp);
      const hour = date.getHours();
      const glucose = reading.glucose_level;

      glucoseValues.push(glucose);

      // Categoriza por período do dia
      if (hour >= 6 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 18) timeSlots.afternoon++;
      else if (hour >= 18 && hour < 24) timeSlots.evening++;
      else timeSlots.night++;

      // Agrupa por hora
      if (!hourlyData[hour]) hourlyData[hour] = [];
      hourlyData[hour].push(glucose);
    });

    // Calcula estatísticas
    const averageGlucose = glucoseValues.reduce((sum, val) => sum + val, 0) / glucoseValues.length;
    const variance = glucoseValues.reduce((sum, val) => sum + Math.pow(val - averageGlucose, 2), 0) / glucoseValues.length;
    const variability = Math.sqrt(variance) / averageGlucose;

    return {
      timeSlotDistribution: timeSlots,
      hourlyData,
      averageGlucose,
      variability,
      totalReadings: readings.length
    };
  }

  private generateAnalysisPrompt(data: any): string {
    const hourlySummary = Object.entries(data.hourlyData)
      .map(([hour, values]: [string, any]) => {
        const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
        return `Hora ${hour}:00 - ${values.length} medições, média: ${avg.toFixed(1)} mg/dL`;
      })
      .join('\n');

    return `
Você é um especialista em diabetes e gestão de glicemia. Analise os padrões de medição de um usuário e recomende os melhores horários para realizar medições.

DADOS DO USUÁRIO:
- Total de medições: ${data.totalReadings}
- Média geral de glicose: ${data.averageGlucose.toFixed(1)} mg/dL
- Variabilidade: ${(data.variability * 100).toFixed(1)}%

DISTRIBUIÇÃO POR PERÍODO:
- Manhã (06:00-12:00): ${data.timeSlotDistribution.morning} medições
- Tarde (12:00-18:00): ${data.timeSlotDistribution.afternoon} medições
- Noite (18:00-24:00): ${data.timeSlotDistribution.evening} medições
- Madrugada (00:00-06:00): ${data.timeSlotDistribution.night} medições

DADOS POR HORA:
${hourlySummary}

ANÁLISE SOLICITADA:
1. Identifique os horários com menos medições mas que são importantes para controle
2. Analise a variabilidade da glicose em diferentes períodos
3. Recomende horários estratégicos para medição
4. Considere padrões típicos de diabetes (jejum, pós-prandial, etc.)

Retorne APENAS um JSON com este formato:
{
  "recommendations": [
    {
      "timeSlot": "manhã",
      "timeRange": "06:00-09:00",
      "frequency": 5,
      "averageGlucose": 120,
      "recommendation": "Medir glicemia em jejum",
      "priority": "high",
      "reasoning": "Importante para controle matinal"
    }
  ],
  "insights": [
    "Insight 1",
    "Insight 2"
  ]
}

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
            temperature: 0.3,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 2000,
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

  private parseAIRecommendations(aiData: any, analysisData: any): TimeRecommendation[] {
    if (!aiData.recommendations || !Array.isArray(aiData.recommendations)) {
      return this.getDefaultRecommendations([]).recommendations;
    }

    return aiData.recommendations.map((rec: any) => ({
      timeSlot: rec.timeSlot || 'geral',
      timeRange: rec.timeRange || '--:--',
      frequency: rec.frequency || 0,
      averageGlucose: rec.averageGlucose || 0,
      recommendation: rec.recommendation || 'Medir glicemia',
      priority: rec.priority || 'medium',
      reasoning: rec.reasoning || 'Importante para controle'
    }));
  }

  private generateInsights(analysisData: any, recommendations: TimeRecommendation[]): string[] {
    const insights: string[] = [];
    
    // Insight sobre distribuição
    const maxSlot = Object.entries(analysisData.timeSlotDistribution)
      .reduce((a, b) => analysisData.timeSlotDistribution[a[0]] > analysisData.timeSlotDistribution[b[0]] ? a : b);
    
    insights.push(`Você mede mais frequentemente no período da ${maxSlot[0]} (${maxSlot[1]} medições)`);
    
    // Insight sobre variabilidade
    if (analysisData.variability > 0.2) {
      insights.push('Sua glicose apresenta alta variabilidade - considere medir em horários mais consistentes');
    } else {
      insights.push('Sua glicose está estável - mantenha os horários atuais de medição');
    }
    
    // Insight sobre recomendação prioritária
    const highPriorityRec = recommendations.find(r => r.priority === 'high');
    if (highPriorityRec) {
      insights.push(`Recomendação prioritária: ${highPriorityRec.recommendation} no período da ${highPriorityRec.timeSlot}`);
    }
    
    return insights;
  }

  private getDefaultRecommendations(readings: Reading[]): PatternAnalysis {
    const defaultRecommendations: TimeRecommendation[] = [
      {
        timeSlot: 'manhã',
        timeRange: '06:00-09:00',
        frequency: 0,
        averageGlucose: 0,
        recommendation: 'Medir glicemia em jejum',
        priority: 'high',
        reasoning: 'Importante para controle matinal e ajuste de medicação'
      },
      {
        timeSlot: 'tarde',
        timeRange: '12:00-15:00',
        frequency: 0,
        averageGlucose: 0,
        recommendation: 'Medir glicemia pós-almoço',
        priority: 'medium',
        reasoning: 'Avaliar resposta glicêmica às refeições'
      },
      {
        timeSlot: 'noite',
        timeRange: '18:00-21:00',
        frequency: 0,
        averageGlucose: 0,
        recommendation: 'Medir glicemia pós-jantar',
        priority: 'medium',
        reasoning: 'Controlar glicemia antes do sono'
      }
    ];

    return {
      totalMeasurements: readings.length,
      timeSlotDistribution: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
      },
      averageGlucose: readings.length > 0 ? 
        readings.reduce((sum, r) => sum + r.glucose_level, 0) / readings.length : 0,
      variability: 0,
      recommendations: defaultRecommendations,
      insights: [
        'Com mais medições, poderemos personalizar melhor as recomendações',
        'Considere medir em jejum, 2h após as refeições e antes de dormir'
      ]
    };
  }
}

export const measurementRecommendationService = new MeasurementRecommendationService();
