@echo off
echo ========================================
echo BUILD SEM GRADLE (METODO ALTERNATIVO)
echo ========================================
echo.

echo Este metodo usa o Expo CLI sem depender do Gradle
echo diretamente, evitando problemas de wrapper.
echo.

echo 1. Verificando se estamos na pasta correta...
if not exist "app.json" (
    echo ❌ Arquivo app.json nao encontrado!
    echo Certifique-se de estar na pasta raiz do projeto.
    pause
    exit /b 1
)

echo 2. Verificando se dispositivo/emulador esta conectado...
adb devices

echo 3. Iniciando build com Expo CLI...
echo.
echo Opcoes disponiveis:
echo [1] Build e instalar no dispositivo
echo [2] Build e executar no emulador
echo [3] Build apenas (gerar APK)
echo.
set /p choice="Digite sua escolha (1-3): "

if "%choice%"=="1" (
    echo Iniciando build e instalacao no dispositivo...
    npx expo run:android --device
) else if "%choice%"=="2" (
    echo Iniciando build e executando no emulador...
    npx expo run:android
) else if "%choice%"=="3" (
    echo Iniciando build apenas...
    npx expo run:android --no-install
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
