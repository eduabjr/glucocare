# Script PowerShell para corrigir package-lock.json definitivamente

Write-Host "========================================" -ForegroundColor Green
Write-Host "CORRIGINDO PACKAGE-LOCK DEFINITIVAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# 1. Remover TODOS os arquivos de lock
Write-Host "1. Removendo arquivos de lock..." -ForegroundColor Cyan
$lockFiles = @("package-lock.json", "yarn.lock", "pnpm-lock.yaml")
foreach ($file in $lockFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Removido: $file" -ForegroundColor Green
    }
}

# 2. Remover node_modules completamente
Write-Host "2. Removendo node_modules..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "   ✅ node_modules removido" -ForegroundColor Green
}

# 3. Limpar cache npm
Write-Host "3. Limpando cache npm..." -ForegroundColor Cyan
try {
    npm cache clean --force
    Write-Host "   ✅ Cache npm limpo" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Erro ao limpar cache: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Limpar cache do usuário
Write-Host "4. Limpando cache do usuário..." -ForegroundColor Cyan
$userCache = "$env:APPDATA\npm-cache"
if (Test-Path $userCache) {
    Remove-Item -Recurse -Force $userCache -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cache do usuário limpo" -ForegroundColor Green
}

# 5. Instalar dependências
Write-Host "5. Instalando dependências..." -ForegroundColor Cyan
try {
    npm install --legacy-peer-deps
    Write-Host "   ✅ Dependências instaladas" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro na instalação: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Tentando com --force..." -ForegroundColor Yellow
    try {
        npm install --force
        Write-Host "   ✅ Dependências instaladas com --force" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Falha na instalação" -ForegroundColor Red
    }
}

# 6. Verificar package-lock.json
Write-Host "6. Verificando package-lock.json..." -ForegroundColor Cyan
if (Test-Path "package-lock.json") {
    $fileSize = (Get-Item "package-lock.json").Length
    Write-Host "   ✅ package-lock.json criado - Tamanho: $fileSize bytes" -ForegroundColor Green
} else {
    Write-Host "   ❌ package-lock.json não foi criado" -ForegroundColor Red
}

# 7. Verificar instalação
Write-Host "7. Verificando instalação..." -ForegroundColor Cyan
try {
    npm list --depth=0
    Write-Host "   ✅ Instalação verificada" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Erro na verificação: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 8. Testar configuração expo
Write-Host "8. Testando configuração expo..." -ForegroundColor Cyan
try {
    npx expo config
    Write-Host "   ✅ Configuração expo OK" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Erro na configuração expo: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "PROCESSO CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Agora tente:" -ForegroundColor Yellow
Write-Host "eas build --platform android --profile development" -ForegroundColor White
Write-Host ""

Read-Host "Pressione Enter para continuar"
