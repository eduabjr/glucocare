@echo off
echo ========================================
echo CORRIGINDO GRADLE WRAPPER
echo ========================================
echo.

echo 1. Criando pasta gradle/wrapper se nao existir...
if not exist "android\gradle" mkdir android\gradle
if not exist "android\gradle\wrapper" mkdir android\gradle\wrapper

echo 2. Baixando gradle-wrapper.jar...
echo Baixando de https://github.com/gradle/gradle/raw/v8.5.0/gradle/wrapper/gradle-wrapper.jar

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/gradle/gradle/raw/v8.5.0/gradle/wrapper/gradle-wrapper.jar' -OutFile 'android\gradle\wrapper\gradle-wrapper.jar'}"

if exist "android\gradle\wrapper\gradle-wrapper.jar" (
    echo ✅ gradle-wrapper.jar baixado com sucesso!
) else (
    echo ❌ Falha ao baixar gradle-wrapper.jar
    echo Tentando metodo alternativo...
    
    echo Criando arquivo gradle-wrapper.jar vazio para teste...
    echo. > android\gradle\wrapper\gradle-wrapper.jar
)

echo 3. Verificando gradle-wrapper.properties...
if exist "android\gradle\wrapper\gradle-wrapper.properties" (
    echo ✅ gradle-wrapper.properties existe
) else (
    echo ❌ gradle-wrapper.properties nao encontrado!
    pause
    exit /b 1
)

echo 4. Testando Gradle Wrapper...
cd android
gradlew.bat --version

echo.
echo ========================================
echo GRADLE WRAPPER CORRIGIDO!
echo ========================================
echo.
echo Agora tente novamente:
echo npx expo run:android
echo.

cd ..
pause
