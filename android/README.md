# GlucoCare - Android

Este diretório contém o projeto Android nativo do GlucoCare.

## Estrutura do Projeto

```
android/
├── app/                          # Módulo principal da aplicação
│   ├── build.gradle             # Configurações de build do app
│   ├── src/main/
│   │   ├── java/com/glucocare/  # Código Kotlin/Java
│   │   │   ├── MainActivity.kt  # Activity principal
│   │   │   └── MainApplication.kt # Application class
│   │   ├── res/                 # Recursos Android
│   │   │   ├── values/
│   │   │   ├── drawable/
│   │   │   ├── mipmap/
│   │   │   └── xml/
│   │   └── AndroidManifest.xml  # Manifest da aplicação
│   ├── proguard-rules.pro       # Regras do ProGuard
│   └── google-services.json     # Configuração do Firebase
├── build.gradle                 # Configurações de build do projeto
├── gradle.properties           # Propriedades do Gradle
├── settings.gradle             # Configurações do Gradle
└── gradle/wrapper/             # Wrapper do Gradle
```

## Pré-requisitos

1. **Android Studio** (recomendado) ou **Android SDK**
2. **JDK 8** ou superior
3. **Node.js** e **npm** (para dependências React Native)
4. **React Native CLI** ou **Expo CLI**

## Configuração

### 1. Instalar Dependências

```bash
# Na raiz do projeto
npm install

# Instalar dependências Android (se necessário)
cd android
./gradlew clean
```

### 2. Configurar Firebase

1. Substitua o arquivo `app/google-services.json` pelo arquivo real do seu projeto Firebase
2. Configure as credenciais do Google OAuth no Firebase Console

### 3. Configurar Permissões

O aplicativo requer as seguintes permissões:
- **INTERNET**: Para comunicação com APIs
- **BLUETOOTH**: Para conexão com dispositivos de glicose
- **LOCATION**: Para descoberta de dispositivos Bluetooth
- **CAMERA**: Para escaneamento de QR codes
- **STORAGE**: Para importação de arquivos
- **NOTIFICATIONS**: Para alertas de glicose

## Construção do APK

### Usando Scripts Automatizados

```bash
# Windows (PowerShell)
.\build-apk.ps1

# Windows (CMD)
build-apk.bat
```

### Usando Gradle Diretamente

```bash
cd android

# Limpar build anterior
./gradlew clean

# Construir APK de debug
./gradlew assembleDebug

# Construir APK de release (requer keystore configurado)
./gradlew assembleRelease
```

### Usando React Native CLI

```bash
# Na raiz do projeto
npx react-native run-android

# Para build de release
npx react-native run-android --variant=release
```

## Instalação no Dispositivo

### Via ADB

```bash
# Instalar APK de debug
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Instalar APK de release
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via Android Studio

1. Abra o projeto no Android Studio
2. Conecte o dispositivo ou inicie um emulador
3. Execute o projeto (Shift + F10)

## Configuração de Release

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

### 3. Atualizar build.gradle

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

## Troubleshooting

### Erro de Permissões

Se encontrar problemas com permissões:

1. Verifique se todas as permissões estão no `AndroidManifest.xml`
2. Para Android 6+, implemente runtime permissions
3. Teste em dispositivos físicos, não apenas emuladores

### Erro de Build

```bash
# Limpar cache do Gradle
./gradlew clean
./gradlew --stop

# Limpar cache do React Native
npx react-native start --reset-cache
```

### Erro de Dependências

```bash
# Verificar dependências
./gradlew app:dependencies

# Forçar atualização
./gradlew --refresh-dependencies
```

## Estrutura de Build

### Debug APK
- **Localização**: `app/build/outputs/apk/debug/app-debug.apk`
- **Tamanho**: ~50-80MB
- **Assinatura**: Debug keystore (automática)
- **Otimizações**: Desabilitadas

### Release APK
- **Localização**: `app/build/outputs/apk/release/app-release.apk`
- **Tamanho**: ~30-50MB
- **Assinatura**: Release keystore (configurada)
- **Otimizações**: ProGuard habilitado

## Próximos Passos

1. **Configurar CI/CD**: GitHub Actions ou similar
2. **Implementar Code Signing**: Para distribuição na Play Store
3. **Otimizar Bundle**: Reduzir tamanho do APK
4. **Testes Automatizados**: Unit tests e UI tests
5. **Analytics**: Firebase Analytics e Crashlytics

## Suporte

Para problemas específicos do Android:
1. Verifique os logs: `adb logcat`
2. Consulte a documentação do React Native
3. Verifique issues conhecidas no GitHub
