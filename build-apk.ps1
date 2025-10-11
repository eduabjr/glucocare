# Script para construir APK do GlucoCare
Write-Host "Construindo APK do GlucoCare..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "android")) {
    Write-Host "Erro: Diretório android não encontrado. Execute este script na raiz do projeto." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Navegar para o diretório android
Set-Location android

try {
    # Limpar build anterior
    Write-Host "Limpando build anterior..." -ForegroundColor Yellow
    & .\gradlew clean

    # Construir APK de debug
    Write-Host "Construindo APK de debug..." -ForegroundColor Yellow
    & .\gradlew assembleDebug

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "APK construído com sucesso!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Localização do APK:" -ForegroundColor Cyan
        Write-Host "app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
        Write-Host ""
        Write-Host "Para instalar no dispositivo conectado:" -ForegroundColor Cyan
        Write-Host "adb install app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "Erro ao construir APK!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
    }
} catch {
    Write-Host "Erro durante a construção: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Pressione Enter para sair"
