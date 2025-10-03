# 🔥 Configuração do Firebase Firestore - GlucoCare

## 📋 **PASSO A PASSO COMPLETO**

### **1. 🗄️ Configuração do Firestore Database**

#### **Passo 1: Acessar o Firebase Console**
1. Acesse: https://console.firebase.google.com
2. Selecione o projeto **"glucocare"**
3. No menu lateral, clique em **"Firestore Database"**

#### **Passo 2: Criar o Banco de Dados**
1. Clique em **"Criar banco de dados"**
2. **Modo**: Selecione **"Modo de produção"** (recomendado)
3. **Localização**: Escolha **"nam5 (us-central)"** (mais próximo do Brasil)
4. Clique em **"Próximo"**

#### **Passo 3: Configurar Regras de Segurança**
1. Na aba **"Regras"**, substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para usuários - apenas o próprio usuário pode acessar seus dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para leituras de glicemia - apenas o próprio usuário pode acessar
    match /readings/{readingId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

2. Clique em **"Publicar"**

### **2. 🔧 Configuração do Projeto**

#### **Verificar Configuração Atual**
O arquivo `src/config/firebase.ts` já está configurado corretamente:

```typescript
const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyCvVmOXpVZsV6Bs3k73SUr-0G0j2tu7aLQ", 
    authDomain: "glucocare-e68c8.firebaseapp.com", 
    projectId: "glucocare-e68c8",
    storageBucket: "glucocare-e68c8.appspot.com", 
    messagingSenderId: "501715449083", 
    appId: "1:501715449083:android:8b781286cf0f02d752ac5e" 
};
```

### **3. 🧪 Teste da Conexão**

#### **Verificar se o Firestore está funcionando:**
1. **Abra o console** do Expo/React Native
2. **Procure por logs** como:
   - `🔥 Firebase User autenticado: [UID]`
   - `📄 Documento do usuário existe: true/false`
   - `❌ Erro ao acessar Firestore: [erro]`

#### **Se ainda houver erro "Erro ao carregar documentos":**

1. **Verifique as Regras do Firestore** (passo 3 acima)
2. **Verifique a Localização** - deve ser "nam5 (us-central)"
3. **Verifique o Project ID** - deve ser "glucocare-e68c8"
4. **Teste com um documento manual**:
   - No Firebase Console, clique em **"+ Adicionar documento"**
   - Coleção: `users`
   - ID do documento: `test-user-123`
   - Campos: `name: "Teste"`, `email: "teste@teste.com"`

### **4. 🗑️ Limpeza da Coleção Users**

#### **Para apagar a coleção users:**
1. No Firebase Console, vá para **"Firestore Database"**
2. Clique na coleção **"users"**
3. Selecione todos os documentos
4. Clique em **"Excluir"**
5. Confirme a exclusão

### **5. 🔍 Debug e Logs**

#### **Logs Esperados (Sucesso):**
```
🔥 Firebase User autenticado: [UID]
📄 Documento do usuário existe: true
👤 Dados do usuário carregados: {biometricEnabled: true, ...}
🔐 Status da biometria: true
```

#### **Logs de Erro:**
```
❌ Erro ao acessar Firestore: [detalhes do erro]
❌ Erro geral no AuthContext: [detalhes do erro]
```

### **6. 🚨 Solução de Problemas**

#### **Problema: "Erro ao carregar documentos"**
- ✅ **Solução**: Verificar regras do Firestore (passo 3)
- ✅ **Solução**: Verificar localização do banco (nam5)
- ✅ **Solução**: Verificar Project ID

#### **Problema: "Firebase User autenticado" mas sem dados**
- ✅ **Solução**: Verificar se o documento existe na coleção `users`
- ✅ **Solução**: Verificar se as regras permitem leitura

#### **Problema: Biometria não funciona**
- ✅ **Solução**: Verificar se `biometricEnabled: true` está salvo no Firestore
- ✅ **Solução**: Verificar logs de debug no console

### **7. 📱 Teste Final**

#### **Para testar se está funcionando:**
1. **Faça login** no app
2. **Configure a biometria** nas configurações
3. **Faça logout** e **tente login biométrico**
4. **Verifique os logs** no console

#### **Resultado Esperado:**
- ✅ **Firestore conectado** sem erros
- ✅ **Dados do usuário** carregados corretamente
- ✅ **Biometria funcionando** para login automático
- ✅ **Logs detalhados** no console

---

## 🎯 **RESUMO DOS PASSOS**

1. **Criar banco Firestore** no Firebase Console
2. **Configurar regras** de segurança
3. **Testar conexão** com logs
4. **Apagar coleção users** se necessário
5. **Testar biometria** no app

Após seguir estes passos, o Firebase Firestore deve funcionar corretamente e a biometria deve estar disponível para login automático! 🎉



