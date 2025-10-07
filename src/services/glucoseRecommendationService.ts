import { GlycemicGoals, classifyGlucoseReading } from '../utils/glycemicGoals';

// Interface para recomendações
export interface GlucoseRecommendation {
    severity: 'low' | 'normal' | 'high' | 'critical';
    title: string;
    message: string;
    actions: string[];
    showNotification: boolean;
    color: string;
    icon: string;
}

// Mapeamento de contexto da refeição para período glicêmico
const mapMealContextToPeriod = (mealContext: string): 'preMeal' | 'postMeal' | 'night' => {
    switch (mealContext) {
        case 'jejum':
        case 'pre-refeicao':
            return 'preMeal';
        case 'pos-refeicao':
            return 'postMeal';
        case 'antes-dormir':
        case 'madrugada':
            return 'night';
        default:
            return 'preMeal';
    }
};

// Função principal para gerar recomendações baseadas na condição e medição
export const generateGlucoseRecommendation = (
    glucoseValue: number,
    userCondition: string,
    mealContext: string,
    userGoals?: GlycemicGoals
): GlucoseRecommendation => {
    const period = mapMealContextToPeriod(mealContext);
    const classification = userGoals ? classifyGlucoseReading(glucoseValue, userGoals, period) : 'Normal';
    
    // Se não há objetivos definidos, usa classificação básica
    if (!userGoals) {
        return generateBasicRecommendation(glucoseValue, userCondition);
    }

    // Gera recomendações baseadas na condição do usuário
    switch (userCondition?.toLowerCase()) {
        case 'pre-diabetes':
        case 'pre-diabetic':
            return generatePreDiabetesRecommendation(glucoseValue, classification, period);
        case 'tipo-1':
        case 'tipo 1':
        case 'type 1':
            return generateType1Recommendation(glucoseValue, classification, period);
        case 'tipo-2':
        case 'tipo 2':
        case 'type 2':
            return generateType2Recommendation(glucoseValue, classification, period);
        default:
            return generateBasicRecommendation(glucoseValue, userCondition);
    }
};

// Recomendações para pré-diabéticos
const generatePreDiabetesRecommendation = (
    glucoseValue: number,
    classification: 'Baixo' | 'Normal' | 'Alto',
    period: 'preMeal' | 'postMeal' | 'night'
): GlucoseRecommendation => {
    if (classification === 'Alto') {
        if (glucoseValue > 200) {
            return {
                severity: 'critical',
                title: '⚠️ Glicemia Muito Alta - Pré-diabetes',
                message: `Sua glicemia está em ${glucoseValue} mg/dL, que é considerada muito alta para pré-diabéticos.`,
                actions: [
                    'Beba bastante água',
                    'Evite alimentos açucarados',
                    'Faça uma caminhada leve (10-15 minutos)',
                    'Monitore novamente em 1-2 horas',
                    'Se persistir, procure orientação médica'
                ],
                showNotification: true,
                color: '#dc2626',
                icon: '⚠️'
            };
        } else {
            return {
                severity: 'high',
                title: '📈 Glicemia Elevada - Pré-diabetes',
                message: `Sua glicemia está em ${glucoseValue} mg/dL, acima do ideal para pré-diabéticos.`,
                actions: [
                    'Beba água',
                    'Evite carboidratos simples',
                    'Considere fazer uma caminhada',
                    'Monitore novamente em 2-3 horas'
                ],
                showNotification: true,
                color: '#ea580c',
                icon: '📈'
            };
        }
    }
    
    return {
        severity: 'normal',
        title: '✅ Glicemia Normal',
        message: `Sua glicemia está em ${glucoseValue} mg/dL, dentro dos valores ideais.`,
        actions: ['Continue mantendo seus hábitos saudáveis'],
        showNotification: false,
        color: '#16a34a',
        icon: '✅'
    };
};

// Recomendações para diabetes tipo 1
const generateType1Recommendation = (
    glucoseValue: number,
    classification: 'Baixo' | 'Normal' | 'Alto',
    period: 'preMeal' | 'postMeal' | 'night'
): GlucoseRecommendation => {
    if (classification === 'Alto') {
        if (glucoseValue > 300) {
            return {
                severity: 'critical',
                title: '🚨 Glicemia Crítica - Tipo 1',
                message: `Sua glicemia está em ${glucoseValue} mg/dL. Nível crítico!`,
                actions: [
                    'Aplique insulina de correção (conforme prescrição médica)',
                    'Beba bastante água',
                    'Teste cetonas se disponível',
                    'Monitore a cada 1 hora',
                    'Procure atendimento médico se não melhorar'
                ],
                showNotification: true,
                color: '#dc2626',
                icon: '🚨'
            };
        } else if (glucoseValue > 250) {
            return {
                severity: 'high',
                title: '⚠️ Glicemia Alta - Tipo 1',
                message: `Sua glicemia está em ${glucoseValue} mg/dL. Considere aplicar insulina de correção.`,
                actions: [
                    'Considere aplicar insulina de correção',
                    'Beba água',
                    'Evite carboidratos',
                    'Monitore em 2-3 horas',
                    'Teste cetonas se disponível'
                ],
                showNotification: true,
                color: '#ea580c',
                icon: '⚠️'
            };
        } else {
            return {
                severity: 'high',
                title: '📈 Glicemia Elevada - Tipo 1',
                message: `Sua glicemia está em ${glucoseValue} mg/dL, acima do ideal.`,
                actions: [
                    'Considere insulina de correção se necessário',
                    'Beba água',
                    'Faça uma caminhada leve',
                    'Monitore novamente em 2-3 horas'
                ],
                showNotification: true,
                color: '#f59e0b',
                icon: '📈'
            };
        }
    }
    
    return {
        severity: 'normal',
        title: '✅ Glicemia Controlada',
        message: `Sua glicemia está em ${glucoseValue} mg/dL, bem controlada!`,
        actions: ['Continue com sua rotina de insulina'],
        showNotification: false,
        color: '#16a34a',
        icon: '✅'
    };
};

// Recomendações para diabetes tipo 2
const generateType2Recommendation = (
    glucoseValue: number,
    classification: 'Baixo' | 'Normal' | 'Alto',
    period: 'preMeal' | 'postMeal' | 'night'
): GlucoseRecommendation => {
    if (classification === 'Alto') {
        if (glucoseValue > 300) {
            return {
                severity: 'critical',
                title: '🚨 Glicemia Crítica - Tipo 2',
                message: `Sua glicemia está em ${glucoseValue} mg/dL. Nível crítico!`,
                actions: [
                    'Tome sua medicação conforme prescrição',
                    'Beba bastante água',
                    'Evite qualquer alimento',
                    'Monitore a cada 1 hora',
                    'Procure atendimento médico imediatamente'
                ],
                showNotification: true,
                color: '#dc2626',
                icon: '🚨'
            };
        } else if (glucoseValue > 250) {
            return {
                severity: 'high',
                title: '⚠️ Glicemia Muito Alta - Tipo 2',
                message: `Sua glicemia está em ${glucoseValue} mg/dL. Nível muito alto!`,
                actions: [
                    'Tome sua medicação se não tomou',
                    'Beba água',
                    'Evite carboidratos',
                    'Faça uma caminhada leve',
                    'Monitore em 2-3 horas',
                    'Considere procurar orientação médica'
                ],
                showNotification: true,
                color: '#ea580c',
                icon: '⚠️'
            };
        } else {
            return {
                severity: 'high',
                title: '📈 Glicemia Elevada - Tipo 2',
                message: `Sua glicemia está em ${glucoseValue} mg/dL, acima do ideal.`,
                actions: [
                    'Verifique se tomou sua medicação',
                    'Beba água',
                    'Evite carboidratos simples',
                    'Faça uma caminhada',
                    'Monitore novamente em 2-3 horas'
                ],
                showNotification: true,
                color: '#f59e0b',
                icon: '📈'
            };
        }
    }
    
    return {
        severity: 'normal',
        title: '✅ Glicemia Controlada',
        message: `Sua glicemia está em ${glucoseValue} mg/dL, bem controlada!`,
        actions: ['Continue com sua medicação e hábitos saudáveis'],
        showNotification: false,
        color: '#16a34a',
        icon: '✅'
    };
};

// Recomendação básica quando não há objetivos definidos
const generateBasicRecommendation = (
    glucoseValue: number,
    userCondition: string
): GlucoseRecommendation => {
    if (glucoseValue > 200) {
        return {
            severity: 'high',
            title: '📈 Glicemia Elevada',
            message: `Sua glicemia está em ${glucoseValue} mg/dL, que é considerada alta.`,
            actions: [
                'Beba água',
                'Evite carboidratos',
                'Faça uma caminhada leve',
                'Monitore novamente em 2-3 horas'
            ],
            showNotification: true,
            color: '#f59e0b',
            icon: '📈'
        };
    }
    
    return {
        severity: 'normal',
        title: '✅ Glicemia Normal',
        message: `Sua glicemia está em ${glucoseValue} mg/dL.`,
        actions: ['Continue mantendo hábitos saudáveis'],
        showNotification: false,
        color: '#16a34a',
        icon: '✅'
    };
};
