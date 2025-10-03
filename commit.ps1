# Script PowerShell para commit e push rápido
Write-Host "Iniciando commit e push automático..." -ForegroundColor Green

# Adiciona todas as alterações
git add .

# Verifica se há alterações antes de commitar
$changes = git diff --cached --name-only
if ($changes.Count -eq 0) {
    Write-Host "Nenhuma mudança para commit." -ForegroundColor Yellow
    exit 0
}

# Commit com uma mensagem padrão
git commit -m "Atualizações automáticas - $(Get-Date -Format 'dd/MM/yyyy HH:mm')"

if ($LASTEXITCODE -eq 0) {
    # Push para a branch principal (main) no GitHub
    git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Mudanças enviadas para o GitHub com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Erro ao fazer push para o GitHub." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Erro ao fazer commit." -ForegroundColor Red
    exit 1
}
