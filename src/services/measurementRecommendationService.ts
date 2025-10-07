import { listReadings } from './dbService';
import { notificationService } from './notificationService';
import { getUserGlycemicGoals } from '../utils/glycemicGoals';

export interface MeasurementPattern {
  averageGlucose: number;
  bestMeasurementTime: string;
  recommendedFrequency: number;
  insights: string[];
  nextRecommendedTime: Date;
}

export class MeasurementRecommendationService {
  
  /**
   * Analisa todas as medições do usuário e gera recomendações de horário
   */
  async analyzeMeasurementPatterns(userGlycemicGoals?: string, userCondition?: string): Promise<MeasurementPattern | null> {
    try {
      const readings = await listReadings();
      
      if (readings.length < 3) {
        console.log('Poucas medições para análise de padrões');
        return null;
      }

      // Ordena medições por data
      const sortedReadings = readings.sort((a, b) => 
        new Date(a.measurement_time || a.timestamp).getTime() - 
        new Date(b.measurement_time || b.timestamp).getTime()
      );

      // Análise de padrões
      const analysis = this.performPatternAnalysis(sortedReadings);
      
      // Gera recomendações
      const recommendations = this.generateRecommendations(analysis, userGlycemicGoals, userCondition);
      
      return recommendations;
      
    } catch (error) {
      console.error('Erro ao analisar padrões de medição:', error);
      return null;
    }
  }

  /**
   * Realiza análise de padrões nas medições
   */
  private performPatternAnalysis(readings: any[]) {
    const hourCounts: { [hour: number]: number } = {};
    const hourGlucose: { [hour: number]: number[] } = {};
    const glucoseLevels: number[] = [];

    // Conta medições por hora e coleta valores
    readings.forEach(reading => {
      const date = new Date(reading.measurement_time || reading.timestamp);
      const hour = date.getHours();
      const glucose = Number(reading.glucose_level) || 0;
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      if (!hourGlucose[hour]) hourGlucose[hour] = [];
      hourGlucose[hour].push(glucose);
      glucoseLevels.push(glucose);
    });

    // Calcula médias por hora
    const hourAverages: { [hour: number]: number } = {};
    Object.keys(hourGlucose).forEach(hourStr => {
      const hour = parseInt(hourStr);
      const values = hourGlucose[hour];
      hourAverages[hour] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return {
      totalReadings: readings.length,
      hourCounts,
      hourAverages,
      overallAverage: glucoseLevels.reduce((sum, val) => sum + val, 0) / glucoseLevels.length,
      glucoseLevels
    };
  }

  /**
   * Gera recomendações baseadas na análise
   */
  private generateRecommendations(analysis: any, userGlycemicGoals?: string, userCondition?: string): MeasurementPattern {
    const { hourCounts, hourAverages, overallAverage, totalReadings } = analysis;
    
    // Encontra o melhor horário para medição
    const bestHour = this.findBestMeasurementTime(hourCounts, hourAverages);
    
    // Calcula frequência recomendada
    const recommendedFrequency = this.calculateRecommendedFrequency(totalReadings, overallAverage, userGlycemicGoals, userCondition);
    
    // Gera insights
    const insights = this.generateInsights(analysis, bestHour);
    
    // Calcula próximo horário recomendado
    const nextRecommendedTime = this.calculateNextRecommendedTime(bestHour);
    
    return {
      averageGlucose: Math.round(overallAverage),
      bestMeasurementTime: `${bestHour.toString().padStart(2, '0')}:00`,
      recommendedFrequency,
      insights,
      nextRecommendedTime
    };
  }

  /**
   * Encontra o melhor horário para medição
   */
  private findBestMeasurementTime(hourCounts: { [hour: number]: number }, hourAverages: { [hour: number]: number }): number {
    // Prioriza horários com menos medições mas com valores mais estáveis
    let bestHour = 8; // Default para 8h da manhã
    let bestScore = -1;

    // Horários preferenciais para medição (8h, 12h, 16h, 20h)
    const preferredHours = [8, 12, 16, 20];
    
    preferredHours.forEach(hour => {
      const count = hourCounts[hour] || 0;
      const average = hourAverages[hour] || 0;
      
      // Score baseado em: menos medições = mais importante, valores normais = melhor
      // Usa valores padrão para cálculo de estabilidade
      const stabilityScore = average >= 70 && average <= 140 ? 1 : 0.5;
      const frequencyScore = Math.max(0, 1 - (count / 10)); // Menos medições = maior score
      
      const score = stabilityScore * frequencyScore;
      
      if (score > bestScore) {
        bestScore = score;
        bestHour = hour;
      }
    });

    return bestHour;
  }

  /**
   * Calcula frequência recomendada de medições
   */
  private calculateRecommendedFrequency(totalReadings: number, averageGlucose: number, userGlycemicGoals?: string, userCondition?: string): number {
    // Usa os objetivos glicêmicos personalizados do usuário se disponíveis
    const userGoals = getUserGlycemicGoals(userGlycemicGoals, userCondition);
    const maxThreshold = userGoals.postMeal.max;
    const minThreshold = userGoals.preMeal.min;
    
    // Baseado na média de glicose, recomenda frequência
    if (averageGlucose > maxThreshold) return 4; // 4x por dia se muito alto
    if (averageGlucose > userGoals.preMeal.max) return 3; // 3x por dia se alto
    if (averageGlucose < minThreshold) return 4; // 4x por dia se baixo
    return 2; // 2x por dia se normal
  }

  /**
   * Gera insights baseados na análise
   */
  private generateInsights(analysis: any, bestHour: number): string[] {
    const insights: string[] = [];
    const { hourAverages, overallAverage } = analysis;

    // Insight sobre horário recomendado
    insights.push(`Horário recomendado: ${bestHour.toString().padStart(2, '0')}:00`);

    // Insight sobre média geral
    if (overallAverage > 140) {
      insights.push('Média de glicose elevada - considere ajustes na alimentação');
    } else if (overallAverage < 70) {
      insights.push('Média de glicose baixa - monitore mais de perto');
    } else {
      insights.push('Média de glicose dentro da faixa normal');
    }

    // Insight sobre padrões horários
    const morningAverage = (hourAverages[8] || 0) + (hourAverages[9] || 0) + (hourAverages[10] || 0);
    const afternoonAverage = (hourAverages[14] || 0) + (hourAverages[15] || 0) + (hourAverages[16] || 0);
    
    if (morningAverage > afternoonAverage + 20) {
      insights.push('Valores matinais mais altos - considere medir após o café da manhã');
    }

    return insights;
  }

  /**
   * Calcula próximo horário recomendado
   */
  private calculateNextRecommendedTime(bestHour: number): Date {
    const now = new Date();
    const nextTime = new Date();
    
    // Define para o próximo horário recomendado
    nextTime.setHours(bestHour, 0, 0, 0);
    
    // Se já passou hoje, agenda para amanhã
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }
    
    return nextTime;
  }

  /**
   * Agenda notificação de recomendação
   */
  async scheduleRecommendationNotification(recommendation: MeasurementPattern): Promise<void> {
    try {
      await notificationService.scheduleLocalNotification({
        title: '⏰ Horário Recomendado para Medição',
        body: `Baseado em seus padrões, recomendamos medir às ${recommendation.bestMeasurementTime}`,
        data: { 
          type: 'measurement_recommendation',
          recommendedTime: recommendation.bestMeasurementTime,
          insights: recommendation.insights
        },
        trigger: {
          date: recommendation.nextRecommendedTime
        }
      });
      
      console.log('Notificação de recomendação agendada para:', recommendation.nextRecommendedTime);
    } catch (error) {
      console.error('Erro ao agendar notificação de recomendação:', error);
    }
  }

  /**
   * Gera e agenda recomendações automaticamente
   */
  async generateAndScheduleRecommendations(userGlycemicGoals?: string, userCondition?: string): Promise<MeasurementPattern | null> {
    const recommendations = await this.analyzeMeasurementPatterns(userGlycemicGoals, userCondition);
    
    if (recommendations) {
      await this.scheduleRecommendationNotification(recommendations);
      return recommendations;
    }
    
    return null;
  }
}

export const measurementRecommendationService = new MeasurementRecommendationService();