@echo off
echo Construindo APK do GlucoCare...

REM Verificar se estamos no diretório correto
if not exist "android" (
    echo Erro: Diretório android não encontrado. Execute este script na raiz do projeto.
    pause
    exit /b 1
)

REM Navegar para o diretório android
cd android

REM Limpar build anterior
echo Limpando build anterior...
call gradlew clean

REM Construir APK de debug
echo Construindo APK de debug...
call gradlew assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo APK construído com sucesso!
    echo ========================================
    echo.
    echo Localização do APK:
    echo app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Para instalar no dispositivo conectado:
    echo adb install app\build\outputs\apk\debug\app-debug.apk
    echo.
) else (
    echo.
    echo ========================================
    echo Erro ao construir APK!
    echo ========================================
    echo.
)

pause
