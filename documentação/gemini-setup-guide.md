# Guia Completo: Google Gemini API Gratuito

## 🚀 Por que Google Gemini?

O Google Gemini é **atualmente a melhor opção gratuita** para IA em aplicações:

### ✅ Vantagens
- **15 requisições/minuto gratuitas** (450/mês)
- **Sem custo mensal**
- **Qualidade excelente** (comparable ao GPT-4)
- **Suporte nativo ao português**
- **Respostas rápidas** (~1-2 segundos)
- **API estável** e bem documentada

### ❌ Limitações
- 15 requisições por minuto (suficiente para uso pessoal)
- Requer conta Google

## 📋 Passo a Passo

### 1. Criar Conta Google
Se você não tem uma conta Google, crie uma em [accounts.google.com](https://accounts.google.com)

### 2. Acessar Google AI Studio
1. Vá para [aistudio.google.com](https://aistudio.google.com/)
2. Faça login com sua conta Google
3. Clique em "Get API Key"

### 3. Gerar API Key
1. Clique em "Create API Key"
2. Escolha "Create API key in new project"
3. Copie a chave gerada (formato: `AIza...`)

### 4. Configurar no Projeto
1. Crie um arquivo `.env` na raiz do projeto
2. Adicione sua chave:

```bash
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Testar a Configuração
1. Execute o app: `npx expo start`
2. Vá para a tela "Alimentação"
3. Clique em "Atualizar"
4. Deve aparecer: "Sugestões atualizadas com sucesso usando Google Gemini!"

## 🔧 Configuração Avançada

### Variáveis de Ambiente
```bash
# .env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx # Opcional
EXPO_PUBLIC_HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxx # Opcional
```

### Ordem de Prioridade
O sistema tenta os provedores nesta ordem:
1. **Google Gemini** (se configurado)
2. **OpenAI** (se configurado)
3. **Hugging Face** (se configurado)
4. **Fallback** (sempre funciona)

## 📊 Comparação de Custos

| Provedor | Custo | Limite Gratuito | Qualidade |
|----------|-------|-----------------|-----------|
| **Google Gemini** | **Gratuito** | 15 req/min | ⭐⭐⭐⭐⭐ |
| OpenAI | $0.002/req | $5 crédito inicial | ⭐⭐⭐⭐⭐ |
| Hugging Face | Gratuito | Limitado | ⭐⭐⭐ |

## 🎯 Exemplo de Uso

### Input (Perfil do usuário):
```typescript
{
  name: "Maria",
  condition: "Diabetes Tipo 2",
  age: 45,
  weight: 70,
  height: 165,
  restriction: "Lactose"
}
```

### Output (Gemini):
```json
{
  "breakfast": "Aveia com frutas vermelhas, chia e leite de amêndoa",
  "lunch": "150g de salmão grelhado, quinoa, brócolis e salada colorida",
  "dinner": "Sopa de lentilha com vegetais e 1 fatia de pão integral",
  "snacks": "Mix de oleaginosas (30g) ou 1 maçã",
  "reasoning": "Sugestões focadas em controle glicêmico para diabetes tipo 2, sem lactose"
}
```

## 🚨 Solução de Problemas

### Erro: "Invalid API Key"
- Verifique se a chave está correta
- Certifique-se de que começou com `AIza`
- Reinicie o app após adicionar a chave

### Erro: "Quota Exceeded"
- Você atingiu o limite de 15 req/min
- Aguarde 1 minuto antes de tentar novamente
- Considere implementar cache

### Erro: "Network Error"
- Verifique sua conexão com a internet
- Teste a API no navegador: [aistudio.google.com](https://aistudio.google.com/)

## 💡 Dicas de Otimização

### 1. Cache de Sugestões
```typescript
// Implementar cache local para evitar requisições desnecessárias
const cacheKey = `suggestions_${user.id}_${Date.now()}`;
```

### 2. Rate Limiting
```typescript
// Implementar controle de taxa
const lastRequest = await AsyncStorage.getItem('lastAIRequest');
const timeDiff = Date.now() - parseInt(lastRequest || '0');
if (timeDiff < 60000) { // 1 minuto
  // Usar cache ou aguardar
}
```

### 3. Fallback Inteligente
```typescript
// Usar fallback quando IA não estiver disponível
if (!aiService.isAIAvailable()) {
  return getFallbackSuggestions(profile);
}
```

## 🔐 Segurança

### Proteção da API Key
- ✅ Nunca commite a chave no código
- ✅ Use variáveis de ambiente
- ✅ Adicione `.env` ao `.gitignore`
- ✅ Rotacione a chave periodicamente

### Privacidade dos Dados
- ✅ Dados não são armazenados pelo Google
- ✅ Cada requisição é independente
- ✅ Não há rastreamento de usuários

## 📈 Monitoramento

### Logs Úteis
```typescript
console.log('🔄 Tentando Google Gemini...');
console.log('✅ Sucesso com Google Gemini');
console.log('❌ Falha com Google Gemini: Rate limit exceeded');
```

### Métricas Importantes
- Taxa de sucesso das requisições
- Tempo de resposta médio
- Uso de fallback vs IA real

## 🎉 Conclusão

O Google Gemini é **atualmente a melhor opção gratuita** para IA em aplicações de saúde:

- **Gratuito** e generoso (15 req/min)
- **Qualidade excelente**
- **Fácil configuração**
- **Sem custos ocultos**

Para o seu app GlucoCare, isso significa sugestões nutricionais personalizadas de alta qualidade sem custos adicionais!
