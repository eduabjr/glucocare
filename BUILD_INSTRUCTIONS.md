# Instruções de Build - GlucoCare Android

Este documento contém instruções detalhadas para construir o APK do GlucoCare.

## 🚀 Métodos de Build

### 1. Build Local com Scripts Automatizados

#### Windows (PowerShell)
```powershell
.\build-apk.ps1
```

#### Windows (CMD)
```cmd
build-apk.bat
```

### 2. Build Local com Gradle

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### 3. Build com EAS (Recomendado)

```bash
# Instalar EAS CLI (se não tiver)
npm install -g @expo/eas-cli

# Login no Expo
eas login

# Build de desenvolvimento
eas build --platform android --profile development

# Build de preview
eas build --platform android --profile preview

# Build de produção
eas build --platform android --profile production
```

### 4. Build com React Native CLI

```bash
# Build e instalação automática
npx react-native run-android

# Build de release
npx react-native run-android --variant=release
```

## 📱 Localização dos APKs

### Build Local
- **Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release**: `android/app/build/outputs/apk/release/app-release.apk`

### Build EAS
- Os APKs são baixados automaticamente após o build
- Ou acesse: [expo.dev](https://expo.dev) → Seu projeto → Builds

## 🔧 Pré-requisitos

### Obrigatórios
- ✅ Node.js 16+
- ✅ npm ou yarn
- ✅ Android Studio ou Android SDK
- ✅ JDK 8+

### Opcionais (mas recomendados)
- ✅ EAS CLI para builds na nuvem
- ✅ Expo CLI para desenvolvimento
- ✅ Dispositivo Android físico para testes

## 📋 Checklist de Build

### Antes do Build
- [ ] Verificar se todas as dependências estão instaladas
- [ ] Configurar variáveis de ambiente se necessário
- [ ] Verificar configurações do Firebase
- [ ] Testar em emulador/dispositivo físico

### Durante o Build
- [ ] Monitorar logs para erros
- [ ] Verificar se não há conflitos de dependências
- [ ] Aguardar conclusão do processo

### Após o Build
- [ ] Testar APK em dispositivo
- [ ] Verificar todas as funcionalidades
- [ ] Verificar permissões necessárias
- [ ] Documentar versão e mudanças

## 🐛 Troubleshooting

### Erro: "SDK location not found"
```bash
# Configurar ANDROID_HOME
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS/Linux
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk  # Windows

# Adicionar ao PATH
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Erro: "Could not find tools.jar"
```bash
# Verificar JAVA_HOME
echo $JAVA_HOME  # macOS/Linux
echo %JAVA_HOME%  # Windows

# Deve apontar para JDK, não JRE
```

### Erro: "Metro bundler not found"
```bash
# Instalar dependências
npm install

# Limpar cache
npx react-native start --reset-cache
```

### Erro: "Gradle build failed"
```bash
cd android
./gradlew clean
./gradlew --stop
./gradlew assembleDebug
```

## 📊 Informações do APK

### Debug APK
- **Tamanho**: ~50-80MB
- **Assinatura**: Debug keystore
- **Otimizações**: Desabilitadas
- **Uso**: Desenvolvimento e testes

### Release APK
- **Tamanho**: ~30-50MB
- **Assinatura**: Release keystore
- **Otimizações**: ProGuard habilitado
- **Uso**: Distribuição

## 🔐 Configuração de Release

### 1. Gerar Keystore
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore glucocare-release-key.keystore -alias glucocare-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configurar gradle.properties
```properties
MYAPP_RELEASE_STORE_FILE=glucocare-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=glucocare-key-alias
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

## 📱 Instalação

### Via ADB
```bash
adb install app-debug.apk
```

### Via Android Studio
1. Abrir projeto no Android Studio
2. Conectar dispositivo
3. Executar projeto (Shift + F10)

### Via EAS
```bash
# Instalar no dispositivo conectado
eas build:run --platform android
```

## 🚀 Deploy

### Google Play Store
1. Gerar APK/AAB de release
2. Upload via Google Play Console
3. Configurar informações da loja
4. Publicar

### Distribuição Interna
1. Usar APK de debug ou preview
2. Compartilhar via email/cloud
3. Instalar manualmente nos dispositivos

## 📈 Monitoramento

### Firebase Analytics
- Instalações
- Usuários ativos
- Crashes

### Play Console
- Downloads
- Avaliações
- Relatórios de erro

## 🔄 CI/CD

### GitHub Actions
```yaml
name: Build Android APK
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm install
      - name: Build APK
        run: cd android && ./gradlew assembleDebug
```

## 📞 Suporte

### Logs e Debug
```bash
# Logs do Android
adb logcat

# Logs do React Native
npx react-native log-android

# Logs do Metro
npx react-native start --verbose
```

### Recursos Úteis
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Android Developer Docs](https://developer.android.com/)

---

**Última atualização**: $(date)
**Versão**: 1.0.0
**Autor**: Equipe GlucoCare
