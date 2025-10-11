# 🛠️ Build Manual - GlucoCare APK

## ⚠️ Problema com Terminal

O terminal PowerShell está apresentando problemas. Aqui estão as **instruções manuais** para construir o APK:

## 🚀 Método 1: Script Simples (Recomendado)

### Windows CMD/PowerShell:
```cmd
# Execute este comando no diretório raiz do projeto:
build-simple.bat
```

### Ou manualmente:
```cmd
cd android
gradlew.bat clean
gradlew.bat assembleDebug
```

## 🚀 Método 2: Android Studio

1. **Abrir Android Studio**
2. **File → Open** → Selecionar pasta `android`
3. **Aguardar sincronização** do Gradle
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. **Aguardar conclusão**

## 🚀 Método 3: Gradle Direto

### No diretório `android/`:
```bash
# Windows
gradlew.bat clean
gradlew.bat assembleDebug

# Linux/Mac
./gradlew clean
./gradlew assembleDebug
```

## 📱 Localização do APK

Após o build bem-sucedido, o APK estará em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📲 Instalação

### Via ADB:
```cmd
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via Android Studio:
1. **Run → Run 'app'** (Shift + F10)
2. Selecione dispositivo/emulador

## 🔧 Troubleshooting

### Erro: "SDK location not found"
```cmd
# Configurar ANDROID_HOME
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools
```

### Erro: "Java not found"
```cmd
# Configurar JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-11.0.x
```

### Erro: "Gradle daemon"
```cmd
cd android
gradlew.bat --stop
gradlew.bat clean
gradlew.bat assembleDebug
```

## ✅ Checklist de Build

- [ ] ✅ Pasta `android` criada
- [ ] ✅ Arquivos de configuração presentes
- [ ] ✅ Gradle Wrapper configurado
- [ ] ⏳ **Build executado** (próximo passo)
- [ ] ⏳ APK testado em dispositivo

## 📊 Informações do APK

- **Nome**: `app-debug.apk`
- **Tamanho**: ~50-80MB
- **Tipo**: Debug (não otimizado)
- **Assinatura**: Debug keystore
- **Uso**: Desenvolvimento e testes

## 🎯 Próximos Passos

1. **Execute o build** usando um dos métodos acima
2. **Teste o APK** em um dispositivo Android
3. **Configure Firebase** real (substituir google-services.json)
4. **Gere keystore** para builds de release

## 🆘 Se Nada Funcionar

### Alternativa: EAS Build (Recomendado)
```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Login
eas login

# Build na nuvem
eas build --platform android --profile development
```

### Alternativa: Expo CLI
```bash
# Build com Expo
npx expo run:android
```

---

**Status**: ✅ Estrutura criada, ⏳ Aguardando build manual
**Próximo**: Execute `build-simple.bat` ou use Android Studio
