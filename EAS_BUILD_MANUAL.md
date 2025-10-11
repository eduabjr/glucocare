# 🚀 EAS Build - Passo a Passo Manual

## 🎯 **Executando a Opção 1: EAS Build**

Como o terminal está com problemas, siga estes passos **manualmente**:

---

## **Passo 1: Instalar EAS CLI**

Abra o **PowerShell** ou **CMD** como administrador e execute:

```bash
npm install -g @expo/eas-cli
```

**Aguarde a instalação terminar.**

---

## **Passo 2: Login no Expo**

```bash
eas login
```

**Digite suas credenciais do Expo:**
- Email: seu-email@exemplo.com
- Senha: sua-senha

**Se não tiver conta, crie em:** https://expo.dev/signup

---

## **Passo 3: Inicializar EAS (se necessário)**

```bash
eas build:configure
```

---

## **Passo 4: Build do APK**

### **Para Development (Debug):**
```bash
eas build --platform android --profile development
```

### **Para Preview (Teste):**
```bash
eas build --platform android --profile preview
```

### **Para Production (Release):**
```bash
eas build --platform android --profile production
```

---

## **Passo 5: Acompanhar o Build**

1. **O build será iniciado na nuvem**
2. **Você receberá um link para acompanhar**
3. **O APK será baixado automaticamente quando pronto**

---

## 📱 **Resultado Esperado**

- ✅ **Build na nuvem** (sem problemas Java local)
- ✅ **APK otimizado** automaticamente
- ✅ **Download direto** quando concluído
- ✅ **Sem erros de compatibilidade**

---

## 🎯 **Comandos Rápidos**

### **Se for seu primeiro build:**
```bash
npm install -g @expo/eas-cli
eas login
eas build --platform android --profile development
```

### **Se já tiver EAS configurado:**
```bash
eas build --platform android --profile development
```

---

## 🆘 **Se Encontrar Problemas**

### **Erro: "Not logged in"**
```bash
eas login
```

### **Erro: "Project not configured"**
```bash
eas build:configure
```

### **Erro: "EAS CLI not found"**
```bash
npm install -g @expo/eas-cli
```

---

## 📊 **Perfis de Build Disponíveis**

| Perfil | Descrição | Uso |
|--------|-----------|-----|
| `development` | Debug, não otimizado | Desenvolvimento |
| `preview` | Teste, otimizado | Testes internos |
| `production` | Release, otimizado | Loja de apps |

---

## 🎉 **Vantagens do EAS Build**

- ✅ **Sem problemas Java local**
- ✅ **Build na nuvem** (mais rápido)
- ✅ **APK otimizado** automaticamente
- ✅ **Suporte completo** do Expo
- ✅ **Download direto** do APK

---

**Status**: 🚀 Pronto para executar manualmente!
**Próximo**: Execute os comandos acima no seu terminal
