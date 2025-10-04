import { UserProfile } from '../context/AuthContext';

// Interface para sugestões de IA
export interface AISuggestions {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
    reasoning?: string;
}

// Interface expandida para sugestões completas de nutrição
export interface ExtendedAISuggestions {
    mealPlan: {
        breakfast: string;
        lunch: string;
        dinner: string;
        snacks: string;
    };
    recipeTips: string[];
    recommendedFoods: string[];
    foodsToAvoid: string[];
    reasoning?: string;
}

// Interface para configuração da IA
interface AIConfig {
    provider: 'openai' | 'gemini' | 'claude' | 'huggingface' | 'local';
    apiKey?: string;
    model: string;
    baseUrl: string;
}

// Interface para resposta da API
interface APIResponse {
    success: boolean;
    data?: AISuggestions;
    error?: string;
    provider?: string;
}

// Interface para resposta expandida da API
interface ExtendedAPIResponse {
    success: boolean;
    data?: ExtendedAISuggestions;
    error?: string;
    provider?: string;
}

class AIService {
    private config: AIConfig;
    private providers: AIConfig[];

    constructor() {
        // Configuração principal
        this.config = {
            provider: 'gemini', // Prioriza Google Gemini (mais generoso)
            model: 'gemini-1.5-flash',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''
        };

        // Lista de provedores disponíveis
        this.providers = [
            {
                provider: 'gemini',
                model: 'gemini-1.5-flash',
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''
            },
            {
                provider: 'openai',
                model: 'gpt-3.5-turbo',
                baseUrl: 'https://api.openai.com/v1',
                apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || ''
            },
            {
                provider: 'huggingface',
                model: 'microsoft/DialoGPT-medium',
                baseUrl: 'https://api-inference.huggingface.co',
                apiKey: process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || ''
            }
        ];
    }

    /**
     * Gera sugestões alimentares personalizadas baseadas no perfil do usuário
     */
    async generateNutritionSuggestions(profile: UserProfile): Promise<AISuggestions> {
        // Tenta cada provedor disponível
        for (const provider of this.providers) {
            if (!provider.apiKey) continue;

            try {
                console.log(`🔄 Tentando ${provider.provider}...`);
                const result = await this.callAIProvider(provider, profile);
                
                if (result.success && result.data) {
                    console.log(`✅ Sucesso com ${provider.provider}`);
                    return result.data;
                }
            } catch (error) {
                console.warn(`❌ Falha com ${provider.provider}:`, error);
                continue;
            }
        }

        // Se todos os provedores falharam, usa fallback
        console.log('🔄 Usando sugestões de fallback...');
        return this.getFallbackSuggestions(profile);
    }

    /**
     * Gera sugestões expandidas de nutrição (cardápio, receitas, alimentos)
     */
    async generateExtendedNutritionSuggestions(profile: UserProfile): Promise<ExtendedAISuggestions> {
        // Tenta cada provedor disponível
        for (const provider of this.providers) {
            if (!provider.apiKey) continue;

            try {
                console.log(`🔄 Tentando ${provider.provider} para sugestões expandidas...`);
                const result = await this.callExtendedAIProvider(provider, profile);
                
                if (result.success && result.data) {
                    console.log(`✅ Sucesso com ${provider.provider} para sugestões expandidas`);
                    return result.data;
                }
            } catch (error) {
                console.warn(`❌ Falha com ${provider.provider} para sugestões expandidas:`, error);
                continue;
            }
        }

        // Se todos os provedores falharam, usa fallback
        console.log('🔄 Usando sugestões expandidas de fallback...');
        return this.getExtendedFallbackSuggestions(profile);
    }

    /**
     * Chama o provedor de IA específico
     */
    private async callAIProvider(provider: AIConfig, profile: UserProfile): Promise<APIResponse> {
        const prompt = this.buildPrompt(profile);

        switch (provider.provider) {
            case 'gemini':
                return await this.callGemini(provider, prompt);
            case 'openai':
                return await this.callOpenAI(provider, prompt);
            case 'huggingface':
                return await this.callHuggingFace(provider, prompt);
            default:
                throw new Error(`Provedor não suportado: ${provider.provider}`);
        }
    }

    /**
     * Chama o provedor de IA específico para sugestões expandidas
     */
    private async callExtendedAIProvider(provider: AIConfig, profile: UserProfile): Promise<ExtendedAPIResponse> {
        const prompt = this.buildExtendedPrompt(profile);

        switch (provider.provider) {
            case 'gemini':
                return await this.callExtendedGemini(provider, prompt);
            case 'openai':
                return await this.callExtendedOpenAI(provider, prompt);
            case 'huggingface':
                return await this.callExtendedHuggingFace(provider, prompt);
            default:
                throw new Error(`Provedor não suportado: ${provider.provider}`);
        }
    }

    /**
     * Chama Google Gemini API
     */
    private async callGemini(provider: AIConfig, prompt: string): Promise<APIResponse> {
        const response = await fetch(
            `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Você é um nutricionista especializado em diabetes. ${prompt}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    }
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
            throw new Error('Resposta inválida do Gemini');
        }

        const suggestions = this.parseAIResponse(aiResponse);
        return { success: true, data: suggestions, provider: 'gemini' };
    }

    /**
     * Chama Google Gemini API para sugestões expandidas
     */
    private async callExtendedGemini(provider: AIConfig, prompt: string): Promise<ExtendedAPIResponse> {
        const response = await fetch(
            `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Você é um nutricionista especializado em diabetes. ${prompt}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2000,
                    }
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
            throw new Error('Resposta inválida do Gemini');
        }

        const suggestions = this.parseExtendedAIResponse(aiResponse);
        return { success: true, data: suggestions, provider: 'gemini' };
    }

    /**
     * Chama OpenAI API
     */
    private async callOpenAI(provider: AIConfig, prompt: string): Promise<APIResponse> {
        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um nutricionista especializado em diabetes. Forneça sugestões alimentares práticas e saudáveis em formato JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 800,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('Resposta inválida do OpenAI');
        }

        const suggestions = this.parseAIResponse(aiResponse);
        return { success: true, data: suggestions, provider: 'openai' };
    }

    /**
     * Chama OpenAI API para sugestões expandidas
     */
    private async callExtendedOpenAI(provider: AIConfig, prompt: string): Promise<ExtendedAPIResponse> {
        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um nutricionista especializado em diabetes. Forneça sugestões alimentares completas incluindo cardápio, receitas, alimentos recomendados e a evitar em formato JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('Resposta inválida do OpenAI');
        }

        const suggestions = this.parseExtendedAIResponse(aiResponse);
        return { success: true, data: suggestions, provider: 'openai' };
    }

    /**
     * Chama Hugging Face API
     */
    private async callHuggingFace(provider: AIConfig, prompt: string): Promise<APIResponse> {
        const response = await fetch(`${provider.baseUrl}/models/${provider.model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: `Você é um nutricionista especializado em diabetes. ${prompt}`,
                parameters: {
                    max_length: 500,
                    temperature: 0.7,
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data[0]?.generated_text;

        if (!aiResponse) {
            throw new Error('Resposta inválida do Hugging Face');
        }

        // Hugging Face pode não retornar JSON estruturado, usa fallback
        return { success: false, error: 'Hugging Face não retorna formato adequado' };
    }

    /**
     * Chama Hugging Face API para sugestões expandidas
     */
    private async callExtendedHuggingFace(provider: AIConfig, prompt: string): Promise<ExtendedAPIResponse> {
        const response = await fetch(`${provider.baseUrl}/models/${provider.model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: `Você é um nutricionista especializado em diabetes. ${prompt}`,
                parameters: {
                    max_length: 1000,
                    temperature: 0.7,
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data[0]?.generated_text;

        if (!aiResponse) {
            throw new Error('Resposta inválida do Hugging Face');
        }

        // Hugging Face pode não retornar JSON estruturado, usa fallback
        return { success: false, error: 'Hugging Face não retorna formato adequado' };
    }

    /**
     * Constrói o prompt personalizado baseado no perfil do usuário
     */
    private buildPrompt(profile: UserProfile): string {
        const age = profile.birthDate ? this.calculateAge(profile.birthDate) : 'não informada';
        const condition = profile.condition || 'não informada';
        const restrictions = profile.restriction || 'nenhuma';
        const bmi = this.calculateBMI(profile.weight, profile.height);

        return `
        Gere um plano alimentar diário personalizado para um usuário com as seguintes características:

        - Idade: ${age} anos
        - Condição: ${condition}
        - Restrições alimentares: ${restrictions}
        - Peso: ${profile.weight || 'não informado'} kg
        - Altura: ${profile.height || 'não informada'} cm
        - IMC: ${bmi || 'não calculado'}

        Por favor, retorne APENAS um JSON válido no seguinte formato:
        {
            "breakfast": "sugestão para café da manhã",
            "lunch": "sugestão para almoço", 
            "dinner": "sugestão para jantar",
            "snacks": "sugestão para lanches",
            "reasoning": "breve explicação das escolhas"
        }

        As sugestões devem ser:
        - Específicas para controle de glicemia
        - Práticas e fáceis de preparar
        - Nutritivas e balanceadas
        - Considerar as restrições alimentares
        - Incluir porções adequadas
        `;
    }

    /**
     * Constrói o prompt expandido personalizado baseado no perfil do usuário
     */
    private buildExtendedPrompt(profile: UserProfile): string {
        const age = profile.birthDate ? this.calculateAge(profile.birthDate) : 'não informada';
        const condition = profile.condition || 'não informada';
        const restrictions = profile.restriction || 'nenhuma';
        const bmi = this.calculateBMI(profile.weight, profile.height);

        return `
        Gere um plano alimentar completo e personalizado para um usuário com as seguintes características:

        - Idade: ${age} anos
        - Condição: ${condition}
        - Restrições alimentares: ${restrictions}
        - Peso: ${profile.weight || 'não informado'} kg
        - Altura: ${profile.height || 'não informada'} cm
        - IMC: ${bmi || 'não calculado'}

        Por favor, retorne APENAS um JSON válido no seguinte formato:
        {
            "mealPlan": {
                "breakfast": "sugestão detalhada para café da manhã",
                "lunch": "sugestão detalhada para almoço", 
                "dinner": "sugestão detalhada para jantar",
                "snacks": "sugestão detalhada para lanches"
            },
            "recipeTips": [
                "Nome do prato: Ingredientes principais - Modo de preparo rápido",
                "Nome do prato: Ingredientes principais - Modo de preparo rápido",
                "Nome do prato: Ingredientes principais - Modo de preparo rápido"
            ],
            "recommendedFoods": [
                "Alimento recomendado 1",
                "Alimento recomendado 2",
                "Alimento recomendado 3"
            ],
            "foodsToAvoid": [
                "Alimento a evitar 1",
                "Alimento a evitar 2",
                "Alimento a evitar 3"
            ],
            "reasoning": "breve explicação das escolhas"
        }

        As sugestões devem ser:
        - Específicas para controle de glicemia baseadas na condição médica
        - Práticas e fáceis de preparar (máximo 15 minutos)
        - Nutritivas e balanceadas
        - Considerar as restrições alimentares
        - Incluir porções adequadas para idade, peso e altura
        - Dicas de receitas devem incluir: Nome do prato, ingredientes principais e modo de preparo rápido
        - Listar alimentos específicos recomendados e a evitar
        - Adaptar para pré-diabetes, diabetes tipo 1 ou tipo 2
        `;
    }

    /**
     * Calcula a idade baseada na data de nascimento
     */
    private calculateAge(birthDate: string): number {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Calcula o IMC
     */
    private calculateBMI(weight: number | null, height: number | null): string | null {
        if (!weight || !height) return null;
        const bmi = weight / Math.pow(height / 100, 2);
        return bmi.toFixed(1);
    }

    /**
     * Faz parse da resposta da IA para extrair JSON
     */
    private parseAIResponse(aiResponse: string): AISuggestions {
        try {
            // Tenta extrair JSON da resposta
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return this.validateSuggestions(suggestions);
            } else {
                // Se não encontrar JSON, tenta extrair informações de forma manual
                return this.extractSuggestionsFromText(aiResponse);
            }
        } catch (error) {
            console.warn('Erro ao fazer parse da resposta:', error);
            throw new Error('Formato de resposta inválido');
        }
    }

    /**
     * Extrai sugestões de texto não estruturado
     */
    private extractSuggestionsFromText(text: string): AISuggestions {
        const lines = text.split('\n').filter(line => line.trim());
        
        const suggestions: AISuggestions = {
            breakfast: 'Sugestão não encontrada',
            lunch: 'Sugestão não encontrada',
            dinner: 'Sugestão não encontrada',
            snacks: 'Sugestão não encontrada'
        };

        let currentMeal = '';
        
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            
            if (lowerLine.includes('café') || lowerLine.includes('breakfast')) {
                currentMeal = 'breakfast';
                suggestions.breakfast = line.replace(/.*?[:\-]\s*/, '').trim();
            } else if (lowerLine.includes('almoço') || lowerLine.includes('lunch')) {
                currentMeal = 'lunch';
                suggestions.lunch = line.replace(/.*?[:\-]\s*/, '').trim();
            } else if (lowerLine.includes('jantar') || lowerLine.includes('dinner')) {
                currentMeal = 'dinner';
                suggestions.dinner = line.replace(/.*?[:\-]\s*/, '').trim();
            } else if (lowerLine.includes('lanche') || lowerLine.includes('snack')) {
                currentMeal = 'snacks';
                suggestions.snacks = line.replace(/.*?[:\-]\s*/, '').trim();
            } else if (currentMeal && line.trim() && !line.includes(':')) {
                // Linha de continuação
                suggestions[currentMeal as keyof AISuggestions] += ' ' + line.trim();
            }
        }

        return suggestions;
    }

    /**
     * Faz parse da resposta expandida da IA para extrair JSON
     */
    private parseExtendedAIResponse(aiResponse: string): ExtendedAISuggestions {
        try {
            // Tenta extrair JSON da resposta
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return this.validateExtendedSuggestions(suggestions);
            } else {
                // Se não encontrar JSON, tenta extrair informações de forma manual
                return this.extractExtendedSuggestionsFromText(aiResponse);
            }
        } catch (error) {
            console.warn('Erro ao fazer parse da resposta expandida:', error);
            throw new Error('Formato de resposta inválido');
        }
    }

    /**
     * Extrai sugestões expandidas de texto não estruturado
     */
    private extractExtendedSuggestionsFromText(text: string): ExtendedAISuggestions {
        const lines = text.split('\n').filter(line => line.trim());
        
        const suggestions: ExtendedAISuggestions = {
            mealPlan: {
                breakfast: 'Sugestão não encontrada',
                lunch: 'Sugestão não encontrada',
                dinner: 'Sugestão não encontrada',
                snacks: 'Sugestão não encontrada'
            },
            recipeTips: [],
            recommendedFoods: [],
            foodsToAvoid: [],
            reasoning: 'Resposta extraída de texto não estruturado'
        };

        let currentSection = '';
        let currentMeal = '';
        
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            
            // Identifica seções
            if (lowerLine.includes('cardápio') || lowerLine.includes('plano alimentar')) {
                currentSection = 'mealPlan';
            } else if (lowerLine.includes('receitas') || lowerLine.includes('dicas de receita')) {
                currentSection = 'recipeTips';
            } else if (lowerLine.includes('recomendados') || lowerLine.includes('alimentos recomendados')) {
                currentSection = 'recommendedFoods';
            } else if (lowerLine.includes('evitar') || lowerLine.includes('alimentos a evitar')) {
                currentSection = 'foodsToAvoid';
            }
            
            // Identifica refeições
            if (lowerLine.includes('café') || lowerLine.includes('breakfast')) {
                currentMeal = 'breakfast';
                suggestions.mealPlan.breakfast = line.replace(/.*?[:\-]\s*/, '').trim();
            } else if (lowerLine.includes('almoço') || lowerLine.includes('lunch')) {
                currentMeal = 'lunch';
                suggestions.mealPlan.lunch = line.replace(/.*?[:\-]\s*/, '').trim();
            } else if (lowerLine.includes('jantar') || lowerLine.includes('dinner')) {
                currentMeal = 'dinner';
                suggestions.mealPlan.dinner = line.replace(/.*?[:\-]\s*/, '').trim();
            } else if (lowerLine.includes('lanche') || lowerLine.includes('snack')) {
                currentMeal = 'snacks';
                suggestions.mealPlan.snacks = line.replace(/.*?[:\-]\s*/, '').trim();
            } else if (line.trim() && !line.includes(':')) {
                // Linha de conteúdo
                const content = line.replace(/^[\-\*•]\s*/, '').trim();
                if (content) {
                    if (currentSection === 'recipeTips') {
                        suggestions.recipeTips.push(content);
                    } else if (currentSection === 'recommendedFoods') {
                        suggestions.recommendedFoods.push(content);
                    } else if (currentSection === 'foodsToAvoid') {
                        suggestions.foodsToAvoid.push(content);
                    } else if (currentMeal && currentSection === 'mealPlan') {
                        // Continuação de refeição
                        suggestions.mealPlan[currentMeal as keyof typeof suggestions.mealPlan] += ' ' + content;
                    }
                }
            }
        }

        return suggestions;
    }

    /**
     * Valida as sugestões expandidas retornadas pela IA
     */
    private validateExtendedSuggestions(suggestions: any): ExtendedAISuggestions {
        const required = ['mealPlan'];
        const mealPlanRequired = ['breakfast', 'lunch', 'dinner', 'snacks'];
        
        for (const field of required) {
            if (!suggestions[field]) {
                throw new Error(`Campo '${field}' ausente`);
            }
        }

        for (const field of mealPlanRequired) {
            if (!suggestions.mealPlan[field] || typeof suggestions.mealPlan[field] !== 'string') {
                throw new Error(`Campo 'mealPlan.${field}' inválido ou ausente`);
            }
        }

        return {
            mealPlan: {
                breakfast: suggestions.mealPlan.breakfast.trim(),
                lunch: suggestions.mealPlan.lunch.trim(),
                dinner: suggestions.mealPlan.dinner.trim(),
                snacks: suggestions.mealPlan.snacks.trim(),
            },
            recipeTips: Array.isArray(suggestions.recipeTips) ? suggestions.recipeTips.map((tip: any) => String(tip).trim()) : [],
            recommendedFoods: Array.isArray(suggestions.recommendedFoods) ? suggestions.recommendedFoods.map((food: any) => String(food).trim()) : [],
            foodsToAvoid: Array.isArray(suggestions.foodsToAvoid) ? suggestions.foodsToAvoid.map((food: any) => String(food).trim()) : [],
            reasoning: suggestions.reasoning?.trim()
        };
    }

    /**
     * Valida as sugestões retornadas pela IA
     */
    private validateSuggestions(suggestions: any): AISuggestions {
        const required = ['breakfast', 'lunch', 'dinner', 'snacks'];
        
        for (const field of required) {
            if (!suggestions[field] || typeof suggestions[field] !== 'string') {
                throw new Error(`Campo '${field}' inválido ou ausente`);
            }
        }

        return {
            breakfast: suggestions.breakfast.trim(),
            lunch: suggestions.lunch.trim(),
            dinner: suggestions.dinner.trim(),
            snacks: suggestions.snacks.trim(),
            reasoning: suggestions.reasoning?.trim()
        };
    }

    /**
     * Sugestões de fallback baseadas na condição do usuário
     */
    private getFallbackSuggestions(profile: UserProfile): AISuggestions {
        const condition = profile.condition?.toLowerCase() || '';
        
        if (condition.includes('tipo 1')) {
            return {
                breakfast: "1 fatia de pão integral com queijo branco, 1 fruta e café sem açúcar",
                lunch: "120g de peito de frango grelhado, arroz integral, feijão e salada de folhas verdes",
                dinner: "Sopa de legumes com 1 ovo cozido e 1 fatia de pão integral",
                snacks: "1 iogurte natural desnatado ou 1 punhado de castanhas",
                reasoning: "Sugestões adaptadas para diabetes tipo 1 com controle de carboidratos"
            };
        } else if (condition.includes('tipo 2')) {
            return {
                breakfast: "1 fatia de pão integral com abacate, 1 ovo cozido e chá verde",
                lunch: "150g de salmão grelhado, quinoa, brócolis e salada colorida",
                dinner: "Sopa de lentilha com vegetais e 1 fatia de pão integral",
                snacks: "Mix de oleaginosas (30g) ou 1 maçã",
                reasoning: "Sugestões focadas em controle glicêmico para diabetes tipo 2"
            };
        } else if (condition.includes('pré')) {
            return {
                breakfast: "Aveia com frutas vermelhas, chia e leite desnatado",
                lunch: "Peito de frango, batata-doce, vegetais grelhados e azeite de oliva",
                dinner: "Salmão assado, quinoa e salada de rúcula com tomate",
                snacks: "1 iogurte grego natural ou 1 punhado de amêndoas",
                reasoning: "Sugestões preventivas para pré-diabetes com foco em alimentos de baixo índice glicêmico"
            };
        } else {
            return {
                breakfast: "1 fatia de pão integral com queijo minas, mamão e café sem açúcar",
                lunch: "150g de frango grelhado, arroz integral, feijão e salada",
                dinner: "Peixe assado com legumes e 1 fatia de pão integral",
                snacks: "1 fruta ou 1 punhado de castanhas",
                reasoning: "Sugestões gerais para uma alimentação saudável"
            };
        }
    }

    /**
     * Sugestões expandidas de fallback baseadas na condição do usuário
     */
    private getExtendedFallbackSuggestions(profile: UserProfile): ExtendedAISuggestions {
        const condition = profile.condition?.toLowerCase() || '';
        
        if (condition.includes('tipo 1')) {
            return {
                mealPlan: {
                    breakfast: "1 fatia de pão integral com queijo branco, 1 fruta e café sem açúcar",
                    lunch: "120g de peito de frango grelhado, arroz integral, feijão e salada de folhas verdes",
                    dinner: "Sopa de legumes com 1 ovo cozido e 1 fatia de pão integral",
                    snacks: "1 iogurte natural desnatado ou 1 punhado de castanhas",
                },
                recipeTips: [
                    "Sanduíche Integral de Frango: Pão integral, peito de frango grelhado, alface, tomate - Grelhe o frango por 5min, monte o sanduíche",
                    "Omelete de Espinafre: 2 ovos, espinafre, queijo branco - Bata os ovos, refogue o espinafre, misture e cozinhe por 3min",
                    "Salada de Quinoa: Quinoa cozida, tomate, pepino, azeite - Misture todos os ingredientes e tempere com azeite"
                ],
                recommendedFoods: [
                    "Pães integrais", "Arroz integral", "Quinoa", "Aveia",
                    "Legumes verdes", "Frutas com casca", "Peixes", "Carnes magras",
                    "Queijos brancos", "Iogurte natural", "Castanhas", "Azeite de oliva"
                ],
                foodsToAvoid: [
                    "Açúcar refinado", "Refrigerantes", "Doces", "Balas",
                    "Pães brancos", "Arroz branco", "Batata frita", "Embutidos",
                    "Frituras", "Álcool em excesso", "Sucos industrializados"
                ],
                reasoning: "Sugestões adaptadas para diabetes tipo 1 com controle rigoroso de carboidratos"
            };
        } else if (condition.includes('tipo 2')) {
            return {
                mealPlan: {
                    breakfast: "1 fatia de pão integral com abacate, 1 ovo cozido e chá verde",
                    lunch: "150g de salmão grelhado, quinoa, brócolis e salada colorida",
                    dinner: "Sopa de lentilha com vegetais e 1 fatia de pão integral",
                    snacks: "Mix de oleaginosas (30g) ou 1 maçã",
                },
                recipeTips: [
                    "Salmão com Quinoa: Filé de salmão, quinoa, brócolis - Grelhe o salmão por 4min cada lado, cozinhe a quinoa por 15min, refogue o brócolis por 3min",
                    "Abacate com Ovo: 1/2 abacate, 1 ovo cozido, temperos - Retire o caroço, coloque o ovo cozido, tempere com azeite e sal",
                    "Smoothie Verde: Espinafre, banana, leite desnatado - Bata tudo no liquidificador por 2min"
                ],
                recommendedFoods: [
                    "Quinoa", "Batata-doce", "Salmão", "Sardinha", "Brócolis",
                    "Espinafre", "Abacate", "Oleaginosas", "Azeite de oliva",
                    "Chá verde", "Canela", "Gengibre", "Frutas vermelhas"
                ],
                foodsToAvoid: [
                    "Açúcar branco", "Mel", "Xarope de milho", "Frutas secas",
                    "Bebidas açucaradas", "Pães brancos", "Massa tradicional",
                    "Doces industrializados", "Alimentos processados"
                ],
                reasoning: "Sugestões focadas em controle glicêmico para diabetes tipo 2"
            };
        } else if (condition.includes('pré')) {
            return {
                mealPlan: {
                    breakfast: "Aveia com frutas vermelhas, chia e leite desnatado",
                    lunch: "Peito de frango, batata-doce, vegetais grelhados e azeite de oliva",
                    dinner: "Salmão assado, quinoa e salada de rúcula com tomate",
                    snacks: "1 iogurte grego natural ou 1 punhado de amêndoas",
                },
                recipeTips: [
                    "Aveia com Frutas Vermelhas: Aveia, leite desnatado, frutas vermelhas, chia - Misture a aveia com leite por 3min, adicione as frutas e chia",
                    "Frango com Batata-Doce: Peito de frango, batata-doce, azeite - Corte a batata-doce, asse por 20min, grelhe o frango por 6min",
                    "Pudim de Chia: Leite desnatado, chia, canela - Misture tudo, deixe na geladeira por 2h, mexa a cada 30min"
                ],
                recommendedFoods: [
                    "Aveia", "Chia", "Frutas vermelhas", "Batata-doce", "Salmão",
                    "Frango", "Quinoa", "Rúcula", "Tomate", "Azeite de oliva",
                    "Iogurte grego", "Amêndoas", "Nozes", "Abacate"
                ],
                foodsToAvoid: [
                    "Açúcar", "Refrigerantes", "Sucos concentrados", "Doces",
                    "Pães brancos", "Arroz branco", "Batata frita", "Frituras",
                    "Alimentos ultraprocessados", "Bebidas alcoólicas"
                ],
                reasoning: "Sugestões preventivas para pré-diabetes com foco em alimentos de baixo índice glicêmico"
            };
        } else {
            return {
                mealPlan: {
                    breakfast: "1 fatia de pão integral com queijo minas, mamão e café sem açúcar",
                    lunch: "150g de frango grelhado, arroz integral, feijão e salada",
                    dinner: "Peixe assado com legumes e 1 fatia de pão integral",
                    snacks: "1 fruta ou 1 punhado de castanhas",
                },
                recipeTips: [
                    "Sanduíche Natural: Pão integral, queijo minas, tomate, alface - Monte o sanduíche com os ingredientes frescos",
                    "Sopa Rápida: Legumes, frango, temperos - Cozinhe os legumes por 10min, adicione o frango desfiado",
                    "Salada Completa: Alface, tomate, pepino, azeite - Corte os vegetais, tempere com azeite e limão"
                ],
                recommendedFoods: [
                    "Pães integrais", "Arroz integral", "Feijão", "Lentilha", "Frango",
                    "Peixe", "Legumes", "Frutas", "Queijo minas", "Iogurte natural",
                    "Castanhas", "Azeite de oliva", "Vegetais folhosos"
                ],
                foodsToAvoid: [
                    "Alimentos ultraprocessados", "Frituras", "Embutidos",
                    "Refrigerantes", "Doces em excesso", "Álcool em excesso",
                    "Sal em excesso", "Aditivos alimentares"
                ],
                reasoning: "Sugestões gerais para uma alimentação saudável e equilibrada"
            };
        }
    }

    /**
     * Verifica se algum provedor de IA está disponível
     */
    isAIAvailable(): boolean {
        return this.providers.some(provider => !!provider.apiKey);
    }

    /**
     * Retorna informações sobre os provedores disponíveis
     */
    getAvailableProviders(): string[] {
        return this.providers
            .filter(provider => !!provider.apiKey)
            .map(provider => provider.provider);
    }

    /**
     * Retorna o provedor atualmente em uso
     */
    getCurrentProvider(): string {
        for (const provider of this.providers) {
            if (provider.apiKey) {
                return provider.provider;
            }
        }
        return 'fallback';
    }

    /**
     * Define uma nova configuração da IA
     */
    updateConfig(newConfig: Partial<AIConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

export const aiService = new AIService();
