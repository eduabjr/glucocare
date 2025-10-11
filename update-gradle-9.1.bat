@echo off
echo ========================================
echo ATUALIZANDO GRADLE PARA 9.1
echo ========================================
echo.

echo 1. Parando processos Gradle...
cd android
gradlew.bat --stop 2>nul

echo 2. Removendo cache Gradle antigo...
if exist ".gradle" rmdir /s /q ".gradle"

echo 3. Baixando Gradle Wrapper 9.1...
cd ..
powershell -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-9.1-wrapper.jar' -OutFile 'android\gradle\wrapper\gradle-wrapper.jar' -ErrorAction Stop; Write-Host 'Download successful' } catch { Write-Host 'Download failed: ' $_.Exception.Message }"

if exist "android\gradle\wrapper\gradle-wrapper.jar" (
    echo ✅ Gradle Wrapper 9.1 baixado com sucesso!
) else (
    echo ❌ Falha ao baixar Gradle Wrapper
    echo Tentando metodo alternativo...
    
    echo 4. Tentando baixar de fonte alternativa...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://github.com/gradle/gradle/raw/v9.1.0/gradle/wrapper/gradle-wrapper.jar' -OutFile 'android\gradle\wrapper\gradle-wrapper.jar' -ErrorAction Stop; Write-Host 'Alternative download successful' } catch { Write-Host 'Alternative download failed: ' $_.Exception.Message }"
)

echo 5. Verificando arquivos de configuracao...
if exist "android\gradle\wrapper\gradle-wrapper.properties" (
    echo ✅ gradle-wrapper.properties existe
    echo Conteudo:
    type android\gradle\wrapper\gradle-wrapper.properties
) else (
    echo ❌ gradle-wrapper.properties nao encontrado!
    pause
    exit /b 1
)

echo 6. Testando Gradle 9.1...
cd android
gradlew.bat --version

echo.
echo ========================================
echo GRADLE 9.1 CONFIGURADO!
echo ========================================
echo.
echo Agora tente:
echo npx expo run:android
echo.

cd ..
pause
