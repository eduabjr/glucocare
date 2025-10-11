# 🚀 Comandos Manuais para Build

## 🚨 **Problema:**
O terminal não está respondendo aos comandos. Execute os comandos abaixo manualmente no seu terminal.

---

## 🎯 **OPÇÃO 1: EAS Build (Recomendado)**

### **Passo 1: Instalar EAS CLI**
```bash
npm install -g eas-cli
```

### **Passo 2: Fazer Login**
```bash
eas login
```

### **Passo 3: Build de Desenvolvimento**
```bash
eas build --platform android --profile development
```

### **Passo 4: Build de Produção**
```bash
eas build --platform android --profile production
```

---

## 🎯 **OPÇÃO 2: Expo CLI Local**

### **Passo 1: Build e Instalar**
```bash
npx expo run:android
```

### **Passo 2: Build Apenas**
```bash
npx expo run:android --no-install
```

### **Passo 3: Executar no Emulador**
```bash
npx expo start --android
```

---

## 🎯 **OPÇÃO 3: Corrigir Gradle Wrapper**

### **Passo 1: Baixar Gradle Wrapper**
```bash
curl -L -o android\gradle\wrapper\gradle-wrapper.jar https://services.gradle.org/distributions/gradle-8.5-wrapper.jar
```

### **Passo 2: Testar Gradle**
```bash
cd android
gradlew.bat --version
```

### **Passo 3: Build com Gradle**
```bash
gradlew.bat assembleDebug
```

---

## 🎯 **OPÇÃO 4: Recriar Pasta Android**

### **Passo 1: Remover Pasta Android**
```bash
rmdir /s /q android
```

### **Passo 2: Gerar Nova Pasta**
```bash
npx expo prebuild --platform android --clean
```

### **Passo 3: Testar Build**
```bash
npx expo run:android
```

---

## 🎯 **OPÇÃO 5: Android Studio**

### **Passos:**
1. Abrir Android Studio
2. **File → Open** → Pasta `android`
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

## 🏆 **RECOMENDAÇÃO:**

### **Para máxima compatibilidade:**
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile development
```

### **Para desenvolvimento rápido:**
```bash
npx expo run:android
```

---

## 📱 **Resultado Esperado:**

### **Com EAS Build:**
- ✅ Build executado na nuvem
- ✅ APK disponível para download
- ✅ Sem problemas de ambiente local

### **Com Expo CLI:**
- ✅ Build executado localmente
- ✅ APK instalado automaticamente
- ✅ App executando no dispositivo

---

## 🆘 **Se Nada Funcionar:**

### **Última opção:**
1. **Remover pasta android:** `rmdir /s /q android`
2. **Executar:** `npx expo prebuild --platform android --clean`
3. **Testar:** `npx expo run:android`

---

## 🎯 **Próximo Passo:**

**Escolha uma opção e execute os comandos manualmente no seu terminal:**

1. **EAS Build:** `eas build --platform android --profile development` ⭐ (Recomendado)
2. **Expo CLI:** `npx expo run:android`
3. **Corrigir Gradle:** `curl -L -o android\gradle\wrapper\gradle-wrapper.jar https://services.gradle.org/distributions/gradle-8.5-wrapper.jar`

---

**Status**: 🔧 Comandos manuais criados
**Recomendado**: EAS Build (mais confiável)
