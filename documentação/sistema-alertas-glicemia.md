# Sistema de Alertas de Glicemia - GlucoCARE

## 📋 Visão Geral

O sistema implementa notificações inteligentes na `AddReadingScreen` que informam ao usuário sobre ações a serem tomadas quando a medição estiver alta, baseado na condição do usuário (pré-diabético, tipo 1 ou tipo 2).

## 🔄 Fluxo de Funcionamento

```
1. Usuário insere valor de glicemia
   ↓
2. Sistema detecta contexto da refeição
   ↓
3. Busca objetivos glicêmicos personalizados do usuário
   ↓
4. Classifica medição (Baixo/Normal/Alto)
   ↓
5. Gera recomendação baseada na condição
   ↓
6. Exibe alerta visual + notificação
```

## 🎯 Regras por Condição

### Pré-diabético
- **Normal**: 70-140 mg/dL (jejum), 100-200 mg/dL (pós-refeição)
- **Alto (140-200)**: 
  - Beba água
  - Evite carboidratos simples
  - Faça caminhada leve
  - Monitore em 2-3 horas
- **Crítico (>200)**:
  - Beba bastante água
  - Evite alimentos açucarados
  - Faça caminhada (10-15 min)
  - Monitore em 1-2 horas
  - Procure orientação médica

### Diabetes Tipo 1
- **Normal**: 80-180 mg/dL (jejum), 100-250 mg/dL (pós-refeição)
- **Alto (180-250)**:
  - Considere insulina de correção
  - Beba água
  - Evite carboidratos
  - Monitore em 2-3 horas
  - Teste cetonas se disponível
- **Crítico (>250)**:
  - Aplique insulina de correção
  - Beba bastante água
  - Teste cetonas
  - Monitore a cada 1 hora
  - Procure atendimento médico

### Diabetes Tipo 2
- **Normal**: 80-180 mg/dL (jejum), 100-250 mg/dL (pós-refeição)
- **Alto (180-250)**:
  - Verifique se tomou medicação
  - Beba água
  - Evite carboidratos simples
  - Faça caminhada
  - Monitore em 2-3 horas
- **Crítico (>250)**:
  - Tome medicação conforme prescrição
  - Beba bastante água
  - Evite qualquer alimento
  - Monitore a cada 1 hora
  - Procure atendimento médico imediatamente

## 🎨 Componentes Implementados

### 1. GlucoseStatusIndicator
- Mostra status em tempo real enquanto digita
- Cores dinâmicas baseadas na classificação
- Ícones visuais (✅ ⬆️ ⬇️)

### 2. Sistema de Recomendações
- Recomendações personalizadas por condição
- Ações específicas baseadas na gravidade
- Integração com objetivos glicêmicos

### 3. Notificações Inteligentes
- Alertas visuais com ações recomendadas
- Notificações push para casos críticos
- Dados contextuais (valor, condição, horário)

## 🔧 Arquivos Criados/Modificados

### Novos Arquivos:
- `src/services/glucoseRecommendationService.ts` - Lógica de recomendações

### Arquivos Modificados:
- `src/screens/AddReadingScreen.tsx` - Integração do sistema de alertas
- `src/utils/glycemicGoals.ts` - Funções de classificação (já existia)

## 📱 Experiência do Usuário

1. **Digitação em Tempo Real**: Status visual aparece enquanto digita
2. **Alertas Contextuais**: Recomendações específicas para cada situação
3. **Notificações Úteis**: Lembretes de ações importantes
4. **Integração Completa**: Usa dados personalizados do usuário

## 🚀 Benefícios

- **Prevenção**: Ações preventivas antes de problemas sérios
- **Educação**: Usuário aprende sobre gerenciamento da glicemia
- **Personalização**: Recomendações baseadas no perfil individual
- **Segurança**: Alertas para situações críticas
- **Conveniência**: Tudo integrado no fluxo natural do app

## 📊 Exemplo de Uso

```
Usuário com Diabetes Tipo 1:
- Insere: 280 mg/dL
- Contexto: Pós-refeição
- Sistema detecta: Crítico
- Ação: Alerta com recomendações específicas
- Notificação: "🚨 Glicemia Crítica - Aplique insulina de correção"
```

O sistema está completamente funcional e integrado ao fluxo existente da aplicação!
