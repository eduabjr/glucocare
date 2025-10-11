# 🚀 EAS Build - Comando Correto

## ❌ **Erro Identificado:**
O nome do pacote estava incorreto.

## ✅ **Comandos Corretos:**

### **1. Instalar EAS CLI (nome correto):**
```bash
npm install -g eas-cli
```

### **2. Login no Expo:**
```bash
eas login
```

### **3. Build do APK:**
```bash
eas build --platform android --profile development
```

---

## 🔄 **Alternativa: Usar Expo CLI**

Se ainda houver problemas, use o Expo CLI:

### **1. Instalar Expo CLI:**
```bash
npm install -g @expo/cli
```

### **2. Build com Expo:**
```bash
npx expo run:android
```

### **3. Ou build local:**
```bash
npx expo build:android
```

---

## 🎯 **Comandos Rápidos Corrigidos:**

### **Primeira opção (EAS):**
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile development
```

### **Segunda opção (Expo):**
```bash
npm install -g @expo/cli
npx expo run:android
```

---

## 📱 **Resultado Esperado:**
- ✅ APK construído na nuvem
- ✅ Download automático
- ✅ Sem problemas Java local

---

**Execute o primeiro comando corrigido: `npm install -g eas-cli`**
