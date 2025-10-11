@echo off
echo ========================================
echo BUILD COM EAS (RECOMENDADO)
echo ========================================
echo.
echo Este metodo usa a nuvem do Expo para build,
echo evitando problemas de compatibilidade Java local.
echo.

echo 1. Verificando se EAS CLI esta instalado...
eas --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo EAS CLI nao encontrado. Instalando...
    npm install -g @expo/eas-cli
    if %ERRORLEVEL% NEQ 0 (
        echo Erro ao instalar EAS CLI. Verifique se o npm esta instalado.
        pause
        exit /b 1
    )
)

echo 2. Verificando login...
eas whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Fazendo login no Expo...
    eas login
)

echo 3. Iniciando build na nuvem...
echo Escolha o tipo de build:
echo [1] Development (debug)
echo [2] Preview (teste)
echo [3] Production (release)
echo.
set /p choice="Digite sua escolha (1-3): "

if "%choice%"=="1" (
    echo Iniciando build de desenvolvimento...
    eas build --platform android --profile development
) else if "%choice%"=="2" (
    echo Iniciando build de preview...
    eas build --platform android --profile preview
) else if "%choice%"=="3" (
    echo Iniciando build de producao...
    eas build --platform android --profile production
) else (
    echo Opcao invalida. Iniciando build de desenvolvimento...
    eas build --platform android --profile development
)

echo.
echo ========================================
echo BUILD INICIADO!
echo ========================================
echo.
echo O build esta sendo processado na nuvem.
echo Voce recebera um link para download quando concluido.
echo.

pause
