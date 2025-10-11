# Script PowerShell para baixar Gradle Wrapper 8.13

Write-Host "========================================" -ForegroundColor Green
Write-Host "BAIXANDO GRADLE WRAPPER 8.13" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Criar pasta se não existir
if (!(Test-Path "android\gradle\wrapper")) {
    New-Item -ItemType Directory -Path "android\gradle\wrapper" -Force
    Write-Host "Pasta gradle/wrapper criada" -ForegroundColor Yellow
}

# Baixar Gradle Wrapper 8.13
Write-Host "Baixando gradle-wrapper.jar..." -ForegroundColor Cyan
try {
    $url = "https://services.gradle.org/distributions/gradle-8.13-wrapper.jar"
    $output = "android\gradle\wrapper\gradle-wrapper.jar"
    
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "✅ Gradle Wrapper 8.13 baixado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Falha ao baixar: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Tentando método alternativo..." -ForegroundColor Yellow
    
    try {
        $url = "https://github.com/gradle/gradle/raw/v8.13.0/gradle/wrapper/gradle-wrapper.jar"
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Host "✅ Gradle Wrapper baixado com método alternativo!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Todos os métodos falharam: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verificar se arquivo foi baixado
if (Test-Path "android\gradle\wrapper\gradle-wrapper.jar") {
    $fileSize = (Get-Item "android\gradle\wrapper\gradle-wrapper.jar").Length
    Write-Host "✅ Arquivo encontrado - Tamanho: $fileSize bytes" -ForegroundColor Green
    
    # Testar Gradle
    Write-Host "Testando Gradle..." -ForegroundColor Cyan
    Set-Location "android"
    try {
        & ".\gradlew.bat" --version
        Write-Host "✅ Gradle funcionando!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Gradle ainda não funciona: $($_.Exception.Message)" -ForegroundColor Red
    }
    Set-Location ".."
} else {
    Write-Host "❌ Arquivo gradle-wrapper.jar não foi baixado" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "PROCESSO CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Read-Host "Pressione Enter para continuar"
