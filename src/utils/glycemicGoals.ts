// Utilitários para objetivos glicêmicos

export interface GlycemicGoals {
    preMeal: {
        min: number;
        ideal: number;
        max: number;
    };
    postMeal: {
        min: number;
        ideal: number;
        max: number;
    };
    night: {
        min: number;
        ideal: number;
        max: number;
    };
}

// Valores padrão baseados na condição do usuário
export const getDefaultGoals = (condition?: string): GlycemicGoals => {
    switch (condition?.toLowerCase()) {
        case 'pré-diabético':
        case 'pre-diabetic':
            return {
                preMeal: { min: 70, ideal: 100, max: 140 },
                postMeal: { min: 100, ideal: 140, max: 200 },
                night: { min: 70, ideal: 100, max: 140 }
            };
        case 'tipo-1':
        case 'tipo 1':
        case 'type 1':
            return {
                preMeal: { min: 80, ideal: 120, max: 180 },
                postMeal: { min: 100, ideal: 160, max: 250 },
                night: { min: 80, ideal: 120, max: 180 }
            };
        case 'tipo-2':
        case 'tipo 2':
        case 'type 2':
            return {
                preMeal: { min: 80, ideal: 120, max: 180 },
                postMeal: { min: 100, ideal: 160, max: 250 },
                night: { min: 80, ideal: 120, max: 180 }
            };
        default:
            return {
                preMeal: { min: 70, ideal: 100, max: 140 },
                postMeal: { min: 70, ideal: 100, max: 140 },
                night: { min: 70, ideal: 100, max: 140 }
            };
    }
};

// Função para obter objetivos glicêmicos do usuário (personalizados ou padrão)
export const getUserGlycemicGoals = (userGlycemicGoals?: string, userCondition?: string): GlycemicGoals => {
    if (userGlycemicGoals) {
        try {
            return JSON.parse(userGlycemicGoals);
        } catch (error) {
            console.error('Erro ao fazer parse dos objetivos glicêmicos:', error);
            return getDefaultGoals(userCondition);
        }
    }
    return getDefaultGoals(userCondition);
};

// Função para obter faixa ideal baseada nos objetivos do usuário
export const getIdealGlucoseRange = (goals: GlycemicGoals, period: 'preMeal' | 'postMeal' | 'night' = 'preMeal') => {
    const periodGoals = goals[period];
    return {
        min: periodGoals.min,
        max: periodGoals.max
    };
};

// Função para classificar uma medição baseada nos objetivos do usuário
export const classifyGlucoseReading = (value: number, goals: GlycemicGoals, period: 'preMeal' | 'postMeal' | 'night' = 'preMeal'): 'Baixo' | 'Normal' | 'Alto' => {
    const periodGoals = goals[period];
    
    if (value < periodGoals.min) return 'Baixo';
    if (value > periodGoals.max) return 'Alto';
    return 'Normal';
};

// Função para obter cor e estilo baseado na classificação
export const getGlucoseStatusStyle = (status: 'Baixo' | 'Normal' | 'Alto') => {
    switch (status) {
        case 'Baixo':
            return { 
                label: 'Baixo', 
                text: '#b45309', 
                bg: '#fef3c7' 
            };
        case 'Alto':
            return { 
                label: 'Alto', 
                text: '#b91c1c', 
                bg: '#fee2e2' 
            };
        case 'Normal':
        default:
            return { 
                label: 'Normal', 
                text: '#047857', 
                bg: '#d1fae5' 
            };
    }
};

