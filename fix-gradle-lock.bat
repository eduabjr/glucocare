@echo off
echo ========================================
echo CORRIGINDO PROBLEMAS GRADLE E EAS
echo ========================================
echo.

echo 1. Parando todos os processos Gradle...
cd android
gradlew.bat --stop 2>nul

echo 2. Removendo arquivos de lock...
if exist ".gradle\8.5\checksums\checksums.lock" (
    del /f /q ".gradle\8.5\checksums\checksums.lock" 2>nul
    echo checksums.lock removido
)

echo 3. Removendo cache Gradle...
if exist ".gradle" (
    rmdir /s /q ".gradle" 2>nul
    echo Cache Gradle removido
)

echo 4. Removendo build anterior...
if exist "app\build" (
    rmdir /s /q "app\build" 2>nul
    echo Build anterior removido
)

echo 5. Verificando se arquivo build.gradle esta correto...
cd ..
if exist "android\build.gradle" (
    echo Arquivo build.gradle encontrado
) else (
    echo ERRO: build.gradle nao encontrado!
    pause
    exit /b 1
)

echo 6. Testando Gradle...
cd android
gradlew.bat --version

echo.
echo ========================================
echo PROBLEMAS CORRIGIDOS!
echo ========================================
echo.
echo Agora tente novamente:
echo 1. Para build local: gradlew.bat assembleDebug
echo 2. Para EAS: eas build --platform android --profile development
echo 3. Para Expo: npx expo run:android
echo.

pause
