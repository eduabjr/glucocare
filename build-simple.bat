@echo off
echo ========================================
echo BUILD APK GLUCOCARE
echo ========================================
echo.

echo Navegando para pasta android...
cd android

echo Verificando arquivos...
if not exist "gradlew.bat" (
    echo ERRO: gradlew.bat nao encontrado!
    pause
    exit /b 1
)

echo Limpando build anterior...
call gradlew.bat clean

echo Construindo APK de debug...
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCESSO! APK construido!
    echo ========================================
    echo.
    echo APK localizado em:
    echo app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Para instalar:
    echo adb install app\build\outputs\apk\debug\app-debug.apk
    echo.
) else (
    echo.
    echo ========================================
    echo ERRO no build!
    echo ========================================
    echo.
)

pause
