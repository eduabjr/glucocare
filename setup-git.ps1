# Script para configurar o repositório Git para o novo projeto
# Execute este script como administrador se necessário

Write-Host "🚀 Configurando repositório Git para GlucoCare..." -ForegroundColor Green

# Verificar se estamos em um repositório Git
if (-not (Test-Path ".git")) {
    Write-Host "❌ Não é um repositório Git. Inicializando..." -ForegroundColor Yellow
    git init
}

# Configurar o remote origin
Write-Host "📡 Configurando remote origin..." -ForegroundColor Blue
git remote remove origin 2>$null
git remote add origin https://github.com/eduardofamilia01-hub/glucocare.git

# Verificar configuração
Write-Host "✅ Remote configurado:" -ForegroundColor Green
git remote -v

# Configurar branch principal
Write-Host "🌿 Configurando branch principal..." -ForegroundColor Blue
git branch -M main

# Adicionar todos os arquivos
Write-Host "📁 Adicionando arquivos..." -ForegroundColor Blue
git add .

# Fazer commit inicial
Write-Host "💾 Fazendo commit inicial..." -ForegroundColor Blue
git commit -m "feat: configuração inicial do projeto GlucoCare

- Configuração do Expo para eduardofamilia01-hub
- Atualização do package.json com informações do repositório
- README.md completo com documentação
- .gitignore atualizado para React Native/Expo
- Estrutura do projeto organizada"

Write-Host "🎉 Configuração concluída!" -ForegroundColor Green
Write-Host "📤 Para enviar para o GitHub, execute:" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Cyan

Write-Host "`n📱 Para iniciar o projeto com Expo:" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Cyan
