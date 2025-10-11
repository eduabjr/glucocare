@echo off
echo ========================================
echo SINCRONIZANDO REPOSITORIO GIT
echo ========================================
echo.

echo 1. Verificando status atual...
git status

echo 2. Fazendo fetch das mudanças remotas...
git fetch origin main

echo 3. Verificando diferencas...
git log HEAD..origin/main --oneline

echo 4. Fazendo pull com rebase...
git pull origin main --rebase

echo 5. Verificando status apos pull...
git status

echo 6. Adicionando mudanças locais...
git add .

echo 7. Fazendo commit das mudanças...
git commit -m "Fix: Corrigir dependencias e package-lock.json - Solucao definitiva para problemas de build EAS"

echo 8. Fazendo push para o GitHub...
git push origin main

echo 9. Verificando status final...
git status

echo.
echo ========================================
echo REPOSITORIO SINCRONIZADO!
echo ========================================
echo.

pause
