@echo off
echo ========================================
echo CORRIGINDO PROBLEMAS DE GIT PUSH
echo ========================================
echo.

echo 1. Verificando status do Git...
git status

echo 2. Fazendo pull das mudanças remotas...
git pull origin main

echo 3. Adicionando todas as mudanças...
git add .

echo 4. Fazendo commit das mudanças...
git commit -m "Fix: Corrigir dependências e package-lock.json - Solução definitiva para problemas de build EAS"

echo 5. Fazendo push para o GitHub...
git push origin main

echo.
echo ========================================
echo GIT PUSH CORRIGIDO!
echo ========================================
echo.

pause
