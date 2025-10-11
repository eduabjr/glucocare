@echo off
echo ========================================
echo CORRIGINDO COMPATIBILIDADE JAVA + GRADLE
echo ========================================
echo.

echo 1. Parando todos os processos Gradle...
cd android
gradlew.bat --stop 2>nul

echo 2. Removendo cache antigo...
if exist "%USERPROFILE%\.gradle\caches\8.0.1" (
    rmdir /s /q "%USERPROFILE%\.gradle\caches\8.0.1" 2>nul
    echo Cache 8.0.1 removido
)

echo 3. Atualizando Gradle Wrapper para versao 8.5...
gradlew.bat wrapper --gradle-version=8.5 --distribution-type=all

echo 4. Verificando nova versao...
gradlew.bat --version

echo 5. Limpando build local...
gradlew.bat clean

echo.
echo ========================================
echo CORRECAO CONCLUIDA!
echo ========================================
echo.
echo Agora tente:
echo 1. Fechar completamente o VS Code
echo 2. Reabrir o VS Code
echo 3. Ou executar: gradlew.bat assembleDebug
echo.

pause
