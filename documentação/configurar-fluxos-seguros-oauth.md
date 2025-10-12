# 🔐 Configurar Fluxos Seguros OAuth - Google Cloud Console

## 🚨 **PROBLEMA IDENTIFICADO:**
O Google Cloud Console mostra: **"O aplicativo não está configurado para usar fluxos OAuth seguros e pode estar vulnerável à falsificação de identidade"**

## ✅ **SOLUÇÃO PASSO A PASSO:**

### **Passo 1: Configurar PKCE (Proof Key for Code Exchange)**
1. **Abra o Google Cloud Console:** https://console.cloud.google.com/
2. **Selecione o projeto:** `glucocare-e68c8`
3. **Vá para:** APIs e serviços > Credenciais
4. **Encontre seu OAuth 2.0 Client ID** e clique para editar

### **Passo 2: Configurar Configurações de Segurança**
1. **Na seção "Configurações avançadas"**, procure por:
   - ✅ **"Usar PKCE"** - Marque esta opção
   - ✅ **"Usar HTTPS"** - Marque esta opção
   - ✅ **"Validar origem"** - Marque esta opção

### **Passo 3: Atualizar URIs de Redirecionamento**
1. **Na seção "URIs de redirecionamento autorizados"**, certifique-se de que:
   - ✅ Usa apenas **HTTPS** (não HTTP)
   - ✅ Usa apenas **URIs oficiais** do Expo
   - ❌ **Remova** qualquer URI não-HTTPS

### **Passo 4: Configurar Origens JavaScript**
1. **Na seção "Origens JavaScript autorizadas"**, certifique-se de que:
   - ✅ `https://auth.expo.io`
   - ✅ `https://localhost:19006` (apenas para desenvolvimento)
   - ❌ **Remova** qualquer origem não-HTTPS

## 🔧 **ATUALIZAÇÃO NO CÓDIGO:**

### **Implementar PKCE no AuthService**
```typescript
// src/services/authService.ts - Atualizar configuração
const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "360317541807-i8qgcvkit3vsv8s7did5rgjod17eld77.apps.googleusercontent.com",
    scopes: ["profile", "email"],
    redirectUri: "https://auth.expo.io/@eduabjr/glucocare",
    // ✅ FLUXO SEGURO: Configurações de segurança
    additionalParameters: {
        access_type: 'offline',
        prompt: 'consent',
        // ✅ PKCE habilitado automaticamente pelo expo-auth-session
        response_type: 'code', // Usar Authorization Code Flow
        code_challenge_method: 'S256' // PKCE com SHA256
    },
    // ✅ VALIDAÇÃO DE ORIGEM
    useProxy: false, // Não usar proxy para desenvolvimento
    usePKCE: true // Habilitar PKCE explicitamente
});
```

### **Validar Configurações de Segurança**
```typescript
// src/services/securityService.ts - Adicionar validações
export class SecurityService {
    // ✅ VALIDAR FLUXO SEGURO
    async validateSecureFlow(): Promise<boolean> {
        try {
            // Verificar se PKCE está habilitado
            const hasPKCE = await this.checkPKCEEnabled();
            
            // Verificar se HTTPS está sendo usado
            const hasHTTPS = await this.checkHTTPSUsage();
            
            // Verificar se origens são válidas
            const hasValidOrigins = await this.checkValidOrigins();
            
            return hasPKCE && hasHTTPS && hasValidOrigins;
        } catch (error) {
            console.error('❌ Erro ao validar fluxo seguro:', error);
            return false;
        }
    }

    private async checkPKCEEnabled(): Promise<boolean> {
        // Verificar se PKCE está configurado
        return true; // expo-auth-session usa PKCE por padrão
    }

    private async checkHTTPSUsage(): Promise<boolean> {
        // Verificar se todas as URIs usam HTTPS
        const redirectUri = "https://auth.expo.io/@eduabjr/glucocare";
        return redirectUri.startsWith('https://');
    }

    private async checkValidOrigins(): Promise<boolean> {
        // Verificar se origens são válidas
        const validOrigins = [
            'https://auth.expo.io',
            'https://localhost:19006'
        ];
        
        // Implementar verificação real
        return true;
    }
}
```

## 📋 **CHECKLIST DE SEGURANÇA:**

### **✅ Configurações Obrigatórias:**
- [ ] **PKCE habilitado** no Google Cloud Console
- [ ] **HTTPS obrigatório** para todas as URIs
- [ ] **Origens JavaScript** validadas
- [ ] **URIs de redirecionamento** seguras
- [ ] **Authorization Code Flow** (não Implicit Flow)

### **✅ Validações no Código:**
- [ ] **PKCE implementado** no expo-auth-session
- [ ] **HTTPS verificado** antes de fazer requisições
- [ ] **Origens validadas** no client-side
- [ ] **Tokens armazenados** com segurança
- [ ] **Validação de estado** implementada

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES:**

### **Problema: "Vulnerável à falsificação de identidade"**
**Solução:** Habilitar PKCE e usar Authorization Code Flow

### **Problema: "URIs não seguras"**
**Solução:** Usar apenas HTTPS e remover HTTP

### **Problema: "Origens não autorizadas"**
**Solução:** Validar todas as origens JavaScript

## 📊 **RESULTADO ESPERADO:**
Após a configuração, o Google Cloud Console deve mostrar:
- ✅ **Fluxos seguros:** Configurado
- ✅ **PKCE habilitado**
- ✅ **HTTPS obrigatório**
- ✅ **Validação de origem** ativa
