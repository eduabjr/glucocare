# 🔐 Configurar Proteção entre Contas (RISC) - Google Cloud Console

## 🚨 **PROBLEMA IDENTIFICADO:**
O Google Cloud Console mostra: **"O projeto não está configurado para a Proteção entre contas"**

## ✅ **SOLUÇÃO PASSO A PASSO:**

### **Passo 1: Acessar Configurações de Segurança**
1. **Abra o Google Cloud Console:** https://console.cloud.google.com/
2. **Selecione o projeto:** `glucocare-e68c8`
3. **Vá para:** APIs e serviços > Tela de consentimento OAuth
4. **Clique em:** "Configurações" (⚙️)

### **Passo 2: Ativar Proteção entre Contas**
1. **Na seção "Segurança"**, procure por "Proteção entre contas"
2. **Clique em:** "Configurar Proteção entre Contas"
3. **Marque a opção:** "Habilitar Proteção entre Contas"
4. **Configure o webhook endpoint** (opcional):
   ```
   https://seu-dominio.com/webhook/risc
   ```

### **Passo 3: Configurar Eventos de Segurança**
1. **Selecione os tipos de eventos** que deseja monitorar:
   - ✅ Comprometimento de conta
   - ✅ Violação de dados
   - ✅ Atividade suspeita
   - ✅ Revogação de token

### **Passo 4: Salvar Configurações**
1. **Clique em:** "Salvar"
2. **Aguarde:** Até 24 horas para ativação
3. **Verifique:** O status deve mudar de ❌ para ✅

## 🔧 **IMPLEMENTAÇÃO NO CÓDIGO:**

### **Webhook Endpoint (Backend)**
```javascript
// Exemplo de webhook para receber eventos RISC
app.post('/webhook/risc', (req, res) => {
  const event = req.body;
  
  // Processar evento de segurança
  switch (event.type) {
    case 'account_compromise':
      handleAccountCompromise(event.userId);
      break;
    case 'data_breach':
      handleDataBreach(event.userId);
      break;
    case 'suspicious_activity':
      handleSuspiciousActivity(event.userId);
      break;
  }
  
  res.status(200).send('OK');
});
```

### **Integração no Frontend**
```typescript
// src/services/securityService.ts - Já implementado
await securityService.handleSecurityEvent({
  type: 'account_compromise',
  userId: 'user123',
  timestamp: new Date().toISOString(),
  action: 'disable_login'
});
```

## 📊 **RESULTADO ESPERADO:**
Após a configuração, o Google Cloud Console deve mostrar:
- ✅ **Proteção entre contas:** Configurada
- ✅ **Eventos de segurança** sendo processados
- ✅ **Notificações automáticas** para administradores
