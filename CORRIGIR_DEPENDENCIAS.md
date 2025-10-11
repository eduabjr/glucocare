# 🔧 Corrigir Dependências - EAS Build

## 🚨 **Problema Identificado:**
```
npm error ERESOLVE could not resolve
npm error Conflicting peer dependency: react@19.1.0
npm error @react-native-community/datetimepicker@"8.4.4"
```

## ✅ **Solução Aplicada:**
- ✅ **datetimepicker**: 8.4.4 → 7.7.0 (compatível com React Native 0.81.4)

---

## 🚀 **COMANDOS PARA POWERSHELL:**

### **🎯 OPÇÃO 1: Corrigir Dependências Localmente**

```powershell
# Remover node_modules e package-lock.json
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Limpar cache npm
npm cache clean --force

# Instalar com --legacy-peer-deps
npm install --legacy-peer-deps

# Build com EAS
eas build --platform android --profile development
```

### **🎯 OPÇÃO 2: Usar Script**

```powershell
# Executar script de correção
.\fix-dependencies.bat

# Build com EAS
eas build --platform android --profile development
```

### **🎯 OPÇÃO 3: Build com --legacy-peer-deps**

```powershell
# Build direto com flag de compatibilidade
eas build --platform android --profile development --legacy-peer-deps
```

---

## 🔧 **Arquivos Corrigidos:**

### **package.json**
```json
"@react-native-community/datetimepicker": "7.7.0"
```

---

## 🏆 **RECOMENDAÇÃO:**

### **Execute este comando:**
```powershell
npm install --legacy-peer-deps
eas build --platform android --profile development
```

---

## 📱 **Resultado Esperado:**

### **Com Dependências Corrigidas:**
- ✅ **Instalação sem conflitos**
- ✅ **Build EAS funcionando**
- ✅ **APK gerado com sucesso**

---

## 🆘 **Se Ainda Houver Problemas:**

### **Método Alternativo:**
```powershell
# Forçar instalação
npm install --force

# Build
eas build --platform android --profile development
```

---

## 🎯 **Próximo Passo:**

**Execute os comandos acima no PowerShell!**

**Status**: 🔧 Dependências corrigidas
**Próximo**: `eas build --platform android --profile development`
