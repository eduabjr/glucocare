@echo off
echo ========================================
echo LIMPANDO CACHE GRADLE
echo ========================================
echo.

echo 1. Parando daemon do Gradle...
cd android
gradlew.bat --stop 2>nul

echo 2. Removendo cache do Gradle...
if exist "%USERPROFILE%\.gradle\caches" (
    echo Removendo cache global...
    rmdir /s /q "%USERPROFILE%\.gradle\caches" 2>nul
)

echo 3. Removendo cache local do projeto...
if exist ".gradle" (
    rmdir /s /q ".gradle" 2>nul
)

if exist "app\build" (
    rmdir /s /q "app\build" 2>nul
)

echo 4. Limpando cache do VS Code...
if exist "%USERPROFILE%\.gradle\daemon" (
    rmdir /s /q "%USERPROFILE%\.gradle\daemon" 2>nul
)

echo 5. Baixando nova versao do Gradle...
gradlew.bat wrapper --gradle-version=8.5

echo 6. Testando nova versao...
gradlew.bat --version

echo.
echo ========================================
echo CACHE LIMPO! TENTE NOVAMENTE
echo ========================================
echo.
echo Agora tente:
echo 1. Fechar e reabrir o VS Code
echo 2. Ou executar: gradlew.bat assembleDebug
echo.

pause
