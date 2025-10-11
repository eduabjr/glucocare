@echo off
echo ========================================
echo BUILD SIMPLES COM EXPO CLI
echo ========================================
echo.
echo Este metodo evita problemas de EAS e Gradle
echo usando o Expo CLI local.
echo.

echo 1. Verificando se estamos na pasta correta...
if not exist "app.json" (
    echo ❌ Arquivo app.json nao encontrado!
    echo Certifique-se de estar na pasta raiz do projeto.
    pause
    exit /b 1
)

echo 2. Verificando se Expo CLI esta disponivel...
npx expo --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Instalando Expo CLI localmente...
    npm install @expo/cli
)

echo 3. Iniciando build local...
echo.
echo Escolha o tipo de build:
echo [1] Build e instalar no dispositivo (recomendado)
echo [2] Build apenas (gerar APK)
echo [3] Executar no emulador
echo.
set /p choice="Digite sua escolha (1-3): "

if "%choice%"=="1" (
    echo Iniciando build e instalacao...
    npx expo run:android
) else if "%choice%"=="2" (
    echo Iniciando build apenas...
    npx expo run:android --no-install
) else if "%choice%"=="3" (
    echo Iniciando no emulador...
    npx expo start --android
) else (
    echo Opcao invalida. Iniciando build completo...
    npx expo run:android
)

echo.
echo ========================================
echo BUILD INICIADO!
echo ========================================
echo.
echo O Expo CLI ira:
echo 1. Compilar o projeto
echo 2. Gerar o APK
echo 3. Instalar no dispositivo (se conectado)
echo 4. Executar a aplicacao
echo.

pause
