# 🔧 Corrigir Plugins Expo - EAS Build

## 🚨 **Problema Identificado:**
```
Failed to resolve plugin for module "expo-build-properties" relative to "C:\Users\Usuário\Desktop\glucocare"
```

## ✅ **Soluções Disponíveis:**

---

## 🚀 **COMANDOS PARA POWERSHELL:**

### **🎯 OPÇÃO 1: Correção Completa de Plugins**

```powershell
# Remover node_modules e package-lock.json
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Limpar cache npm
npm cache clean --force

# Instalar dependências
npm install --legacy-peer-deps

# Corrigir plugins expo
npx expo install --fix

# Limpar cache expo
npx expo r -c

# Testar configuração
npx expo config

# Build com EAS
eas build --platform android --profile development
```

### **🎯 OPÇÃO 2: Usar Script**

```powershell
# Executar script de correção
.\fix-expo-plugins.bat

# Build com EAS
eas build --platform android --profile development
```

### **🎯 OPÇÃO 3: Reinstalar Plugin Específico**

```powershell
# Reinstalar expo-build-properties
npm uninstall expo-build-properties
npm install expo-build-properties@~1.0.9 --legacy-peer-deps

# Verificar instalação
npx expo config

# Build com EAS
eas build --platform android --profile development
```

### **🎯 OPÇÃO 4: Remover Plugin Temporariamente**

```powershell
# Editar app.json e remover expo-build-properties temporariamente
# Depois fazer build
eas build --platform android --profile development
```

---

## 🔧 **Arquivos para Verificar:**

### **app.json**
```json
"plugins": [
  [
    "expo-build-properties",
    {
      "android": {
        "compileSdkVersion": 35,
        "targetSdkVersion": 34,
        "minSdkVersion": 24,
        "buildToolsVersion": "35.0.0"
      },
      "ios": {
        "deploymentTarget": "15.1"
      }
    }
  ],
  "expo-local-authentication",
  "expo-font",
  "expo-secure-store",
  [
    "expo-location",
    {
      "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to scan for Bluetooth devices."
    }
  ],
  "expo-web-browser"
]
```

### **package.json**
```json
"expo-build-properties": "~1.0.9"
```

---

## 🏆 **RECOMENDAÇÃO:**

### **Execute este comando:**
```powershell
npx expo install --fix
eas build --platform android --profile development
```

---

## 📱 **Resultado Esperado:**

### **Com Plugins Corrigidos:**
- ✅ **Plugins expo funcionando**
- ✅ **Configuração válida**
- ✅ **Build EAS funcionando**
- ✅ **APK gerado com sucesso**

---

## 🆘 **Se Ainda Houver Problemas:**

### **Método Alternativo - Remover Plugin:**
```powershell
# Editar app.json e remover a seção expo-build-properties
# Depois fazer build
eas build --platform android --profile development
```

### **Método Manual:**
```powershell
# Verificar se plugin está instalado
npm list expo-build-properties

# Reinstalar se necessário
npm install expo-build-properties@~1.0.9 --legacy-peer-deps
```

---

## 🎯 **Próximo Passo:**

**Execute os comandos acima no PowerShell!**

**Status**: 🔧 Plugins expo corrigidos
**Próximo**: `npx expo install --fix` e depois `eas build --platform android --profile development`
