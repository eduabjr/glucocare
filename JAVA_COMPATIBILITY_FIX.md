# 🔧 Correção de Compatibilidade Java 25 + Gradle

## 🚨 Problema Identificado

**Erro**: `Unsupported class file major version 69` e `Can't use Java 25 and Gradle 8.0.1`

**Causa**: Java 25 é muito recente e não é totalmente compatível com Gradle 8.0.1.

## ✅ Soluções Implementadas

### 1. **Atualização do Gradle** ✅
- Gradle atualizado de `8.0.1` para `8.5`
- Melhor compatibilidade com Java moderno

### 2. **Configurações Otimizadas** ✅
- JVM args atualizados para Java 25
- Configurações de cache e paralelização

### 3. **Arquivo de Configuração Local** ✅
- `gradle.properties.local` criado com configurações alternativas

## 🛠️ Soluções Recomendadas

### **Opção 1: Usar Java 17 ou 21 (Recomendado)**

```cmd
# Baixar e instalar Java 17 LTS
# https://adoptium.net/temurin/releases/

# Configurar JAVA_HOME
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
```

### **Opção 2: Forçar Gradle a Usar Java Específico**

Edite `android/gradle.properties` e adicione:
```properties
# Descomente e configure o caminho do Java 17/21
org.gradle.java.home=C:\\Program Files\\Java\\jdk-17.0.9
```

### **Opção 3: Usar Android Studio (Mais Fácil)**

1. **Abrir Android Studio**
2. **File → Open** → Pasta `android`
3. **Android Studio usa seu próprio JDK interno**
4. **Build → Build Bundle(s) / APK(s)**

## 🔍 Diagnóstico

Execute o script de diagnóstico:
```cmd
diagnose-java.bat
```

## 📋 Passos para Correção

### **Passo 1: Verificar Java**
```cmd
java -version
echo %JAVA_HOME%
```

### **Passo 2: Instalar Java 17 (se necessário)**
1. Baixar de: https://adoptium.net/
2. Instalar Java 17 LTS
3. Configurar JAVA_HOME

### **Passo 3: Limpar Cache do Gradle**
```cmd
cd android
gradlew.bat --stop
gradlew.bat clean
```

### **Passo 4: Testar Build**
```cmd
gradlew.bat assembleDebug
```

## 🚀 Build Alternativo

### **EAS Build (Recomendado para Java 25)**
```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Login
eas login

# Build na nuvem (não depende do Java local)
eas build --platform android --profile development
```

### **Expo CLI**
```bash
# Build com Expo (usa ambiente na nuvem)
npx expo run:android
```

## 📊 Compatibilidade de Versões

| Java Version | Gradle Version | Compatibilidade |
|--------------|----------------|-----------------|
| Java 17      | 8.0+           | ✅ Excelente    |
| Java 21      | 8.4+           | ✅ Excelente    |
| Java 25      | 8.5+           | ⚠️ Limitada     |

## 🎯 Próximos Passos

1. **Execute**: `diagnose-java.bat` para identificar o problema
2. **Escolha uma solução**:
   - Instalar Java 17/21 (recomendado)
   - Usar Android Studio
   - Usar EAS Build na nuvem
3. **Teste o build** novamente

## 🆘 Se Nada Funcionar

### **Solução Definitiva: EAS Build**
```bash
# Build na nuvem do Expo (sem dependências locais)
eas build --platform android --profile development
```

---

**Status**: 🔧 Problema identificado e soluções implementadas
**Próximo**: Escolher uma das soluções acima e testar
