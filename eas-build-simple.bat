@echo off
echo ========================================
echo EAS BUILD SIMPLES
echo ========================================
echo.

echo Este metodo usa o EAS Build na nuvem,
echo evitando problemas de Gradle local.
echo.

echo 1. Verificando se estamos na pasta correta...
if not exist "app.json" (
    echo ❌ Arquivo app.json nao encontrado!
    pause
    exit /b 1
)

echo 2. Verificando se EAS CLI esta instalado...
eas --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Instalando EAS CLI...
    npm install -g eas-cli
)

echo 3. Fazendo login no EAS (se necessario)...
eas whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Fazendo login no EAS...
    eas login
)

echo 4. Iniciando build na nuvem...
echo.
echo Opcoes disponiveis:
echo [1] Build de desenvolvimento
echo [2] Build de producao
echo.
set /p choice="Digite sua escolha (1-2): "

if "%choice%"=="1" (
    echo Iniciando build de desenvolvimento...
    eas build --platform android --profile development
) else if "%choice%"=="2" (
    echo Iniciando build de producao...
    eas build --platform android --profile production
) else (
    echo Opcao invalida. Iniciando build de desenvolvimento...
    eas build --platform android --profile development
)

echo.
echo ========================================
echo BUILD INICIADO NA NUVEM!
echo ========================================
echo.
echo O EAS Build ira:
echo 1. Fazer upload do projeto
echo 2. Compilar na nuvem
echo 3. Gerar o APK
echo 4. Disponibilizar para download
echo.

pause
