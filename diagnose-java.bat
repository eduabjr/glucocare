@echo off
echo ========================================
echo DIAGNOSTICO JAVA E GRADLE
echo ========================================
echo.

echo 1. Verificando versao do Java...
java -version
echo.

echo 2. Verificando JAVA_HOME...
if defined JAVA_HOME (
    echo JAVA_HOME: %JAVA_HOME%
    echo Arquivos em JAVA_HOME:
    dir "%JAVA_HOME%\bin\java.exe" 2>nul || echo Java nao encontrado em JAVA_HOME
) else (
    echo JAVA_HOME nao definido!
)
echo.

echo 3. Verificando instalacoes Java...
echo Procurando Java em locais comuns...
for %%i in ("C:\Program Files\Java\*" "C:\Program Files (x86)\Java\*" "%USERPROFILE%\AppData\Local\Programs\Java\*") do (
    if exist "%%i\bin\java.exe" (
        echo Encontrado: %%i
        "%%i\bin\java.exe" -version 2>&1 | findstr "version"
    )
)
echo.

echo 4. Verificando Gradle...
cd android
if exist "gradlew.bat" (
    echo Gradle Wrapper encontrado
    echo Tentando executar gradlew --version...
    gradlew.bat --version
) else (
    echo Gradle Wrapper nao encontrado!
)
echo.

echo 5. Verificando Android SDK...
if defined ANDROID_HOME (
    echo ANDROID_HOME: %ANDROID_HOME%
) else (
    echo ANDROID_HOME nao definido!
)
echo.

echo ========================================
echo RECOMENDACOES:
echo ========================================
echo.
echo 1. Instale Java 17 ou 21 (recomendado para Android)
echo 2. Configure JAVA_HOME para apontar para JDK, nao JRE
echo 3. Verifique se ANDROID_HOME esta configurado
echo 4. Use Android Studio para builds (mais facil)
echo.

pause
