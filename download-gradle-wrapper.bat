@echo off
echo ========================================
echo BAIXANDO GRADLE WRAPPER
echo ========================================
echo.

echo 1. Criando pasta gradle/wrapper...
if not exist "android\gradle\wrapper" mkdir android\gradle\wrapper

echo 2. Baixando gradle-wrapper.jar...
echo Tentando baixar de: https://services.gradle.org/distributions/gradle-8.5-wrapper.jar

powershell -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.5-wrapper.jar' -OutFile 'android\gradle\wrapper\gradle-wrapper.jar' -ErrorAction Stop; Write-Host 'Download successful' } catch { Write-Host 'Download failed: ' $_.Exception.Message }"

if exist "android\gradle\wrapper\gradle-wrapper.jar" (
    echo ✅ gradle-wrapper.jar baixado com sucesso!
    dir android\gradle\wrapper\gradle-wrapper.jar
) else (
    echo ❌ Falha ao baixar gradle-wrapper.jar
    echo Tentando metodo alternativo...
    
    echo 3. Tentando baixar de fonte alternativa...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://github.com/gradle/gradle/raw/v8.5.0/gradle/wrapper/gradle-wrapper.jar' -OutFile 'android\gradle\wrapper\gradle-wrapper.jar' -ErrorAction Stop; Write-Host 'Alternative download successful' } catch { Write-Host 'Alternative download failed: ' $_.Exception.Message }"
    
    if exist "android\gradle\wrapper\gradle-wrapper.jar" (
        echo ✅ gradle-wrapper.jar baixado com metodo alternativo!
    ) else (
        echo ❌ Todos os metodos falharam
        echo Criando arquivo placeholder...
        echo. > android\gradle\wrapper\gradle-wrapper.jar
    )
)

echo 4. Testando Gradle Wrapper...
cd android
gradlew.bat --version

echo.
echo ========================================
echo PROCESSO CONCLUIDO!
echo ========================================
echo.

cd ..
pause
