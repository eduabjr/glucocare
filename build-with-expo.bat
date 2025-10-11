@echo off
echo ========================================
echo BUILD COM EXPO CLI (ALTERNATIVA)
echo ========================================
echo.
echo Este metodo usa o Expo CLI para build,
echo que e mais estavel que o EAS CLI.
echo.

echo 1. Verificando se Expo CLI esta instalado...
npx expo --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Expo CLI nao encontrado. Instalando...
    npm install -g @expo/cli
    if %ERRORLEVEL% NEQ 0 (
        echo Erro ao instalar Expo CLI.
        echo Tentando instalacao local...
        npm install @expo/cli
    )
)

echo 2. Verificando projeto Expo...
if not exist "app.json" (
    echo ❌ Arquivo app.json nao encontrado!
    echo Certifique-se de estar na pasta raiz do projeto.
    pause
    exit /b 1
)

echo 3. Iniciando build local...
echo.
echo Escolha o tipo de build:
echo [1] Build local (recomendado)
echo [2] Build na nuvem (EAS)
echo [3] Run no dispositivo/emulador
echo.
set /p choice="Digite sua escolha (1-3): "

if "%choice%"=="1" (
    echo Iniciando build local...
    npx expo run:android
) else if "%choice%"=="2" (
    echo Iniciando build na nuvem...
    npx expo build:android
) else if "%choice%"=="3" (
    echo Executando no dispositivo...
    npx expo start --android
) else (
    echo Opcao invalida. Iniciando build local...
    npx expo run:android
)

echo.
echo ========================================
echo BUILD INICIADO!
echo ========================================
echo.

pause
