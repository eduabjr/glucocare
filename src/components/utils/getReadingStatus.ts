// src/utils/getReadingStatus.ts
import { getUserGlycemicGoals, classifyGlucoseReading } from '../../utils/glycemicGoals';

export function getReadingStatus(value: number | string, userGlycemicGoals?: string, userCondition?: string): string {
    let numericValue: number;

    if (typeof value !== 'number') {
        numericValue = Number(value);
        if (Number.isNaN(numericValue)) return 'Indefinido';
    } else {
        numericValue = value;
    }

    // Usa os objetivos glicêmicos personalizados do usuário se disponíveis
    const userGoals = getUserGlycemicGoals(userGlycemicGoals, userCondition);
    const status = classifyGlucoseReading(numericValue, userGoals, 'preMeal');
    
    return status;
}