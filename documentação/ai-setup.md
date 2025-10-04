# Configuração da IA para NutritionScreen

## Visão Geral

A NutritionScreen agora utiliza um sistema de IA multi-provedor para gerar sugestões alimentares personalizadas. O sistema funciona com múltiplas opções:

1. **Google Gemini** (Prioritário - Mais generoso): 15 requisições/minuto gratuitas
2. **OpenAI GPT-3.5**: $0.002 por requisição
3. **Hugging Face**: Modelos gratuitos (limitados)
4. **Fallback Inteligente**: Sugestões pré-definidas baseadas na condição do usuário

## 🚀 Melhores Opções Gratuitas

### 1. Google Gemini (RECOMENDADO)

**Vantagens:**
- ✅ **15 requisições/minuto gratuitas**
- ✅ **Sem custo mensal**
- ✅ **Qualidade excelente**
- ✅ **Suporte nativo ao português**
- ✅ **Respostas rápidas**

**Configuração:**
```bash
# No arquivo .env
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

**Como obter:**
1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Faça login com sua conta Google
3. Clique em "Get API Key"
4. Copie a chave gerada

### 2. OpenAI (Alternativa)

**Vantagens:**
- ✅ **Qualidade muito boa**
- ✅ **API estável**
- ❌ **Custo por uso** (~$0.002/requisição)

**Configuração:**
```bash
# No arquivo .env
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Hugging Face (Opcional)

**Vantagens:**
- ✅ **Completamente gratuito**
- ✅ **Modelos open-source**
- ❌ **Qualidade limitada**
- ❌ **Não otimizado para nutrição**

**Configuração:**
```bash
# No arquivo .env
EXPO_PUBLIC_HUGGINGFACE_API_KEY=your-huggingface-token-here
```

## 🏆 Recomendação Final

### Para Uso Gratuito: **Google Gemini**
- 15 requisições/minuto gratuitas
- Qualidade excelente
- Fácil configuração
- Sem custos ocultos

### Para Uso Profissional: **OpenAI**
- Qualidade superior
- API mais estável
- Custo baixo (~$0.002/requisição)

## 🔧 Estrutura do Serviço

O `aiService.ts` inclui:

- **Integração com OpenAI**: Chamadas reais para ChatGPT
- **Fallback Inteligente**: Sugestões baseadas na condição do usuário
- **Validação**: Verificação dos dados retornados
- **Personalização**: Prompt adaptado ao perfil do usuário

## Funcionamento

### Com IA Real

```typescript
const suggestions = await aiService.generateNutritionSuggestions(user);
// Retorna sugestões personalizadas baseadas no perfil completo do usuário
```

### Sem IA (Fallback)

```typescript
// Retorna sugestões pré-definidas baseadas na condição:
// - Diabetes Tipo 1: Foco em controle de carboidratos
// - Diabetes Tipo 2: Controle glicêmico
// - Pré-diabetes: Alimentos de baixo índice glicêmico
```

## Características da IA

### Prompt Personalizado

A IA recebe informações sobre:
- Idade do usuário
- Condição (pré-diabético, tipo 1, tipo 2)
- Restrições alimentares
- Peso, altura e IMC
- Contexto de controle de glicemia

### Sugestões Geradas

```json
{
  "breakfast": "1 fatia de pão integral com queijo branco, 1 fruta e café sem açúcar",
  "lunch": "120g de peito de frango grelhado, arroz integral, feijão e salada",
  "dinner": "Sopa de legumes com 1 ovo cozido e 1 fatia de pão integral",
  "snacks": "1 iogurte natural desnatado ou 1 punhado de castanhas",
  "reasoning": "Sugestões adaptadas para diabetes tipo 1 com controle de carboidratos"
}
```

## Vantagens

### IA Real
- ✅ Sugestões totalmente personalizadas
- ✅ Considera todas as variáveis do usuário
- ✅ Adaptação em tempo real
- ✅ Explicações detalhadas

### Fallback
- ✅ Funciona sem configuração
- ✅ Sugestões testadas e seguras
- ✅ Baseadas em diretrizes médicas
- ✅ Sem custos adicionais

## Custos

### OpenAI
- Modelo usado: `gpt-3.5-turbo`
- Custo aproximado: $0.002 por requisição
- Tokens por requisição: ~800 tokens

### Fallback
- Sem custos adicionais
- Funciona offline

## Monitoramento

O sistema inclui logs para:
- Sucesso/falha das requisições
- Uso de IA vs fallback
- Erros de validação
- Performance

## Segurança

- API key armazenada como variável de ambiente
- Validação de respostas da IA
- Fallback automático em caso de erro
- Dados do usuário não são armazenados externamente

## Próximos Passos

1. **Testes**: Implementar testes unitários
2. **Cache**: Adicionar cache de sugestões
3. **Analytics**: Monitorar uso e eficácia
4. **Modelos**: Experimentar outros modelos de IA
5. **Feedback**: Sistema de avaliação das sugestões
