@echo off
cd /d "%~dp0"

echo Configurando repositórios remotos...
git remote remove origin 2>nul
git remote add origin https://github.com/eduardofamilia01-hub/glucocare.git
git remote add eduabjr https://github.com/eduabjr/glucocare.git

echo Fazendo commit e push...
git add .
for /f "tokens=1-6 delims=: " %%a in ("%time%") do set timestamp=%%a%%b%%c
git commit -m "Update: %date% %time%"
git push origin main
git push eduabjr main

echo Concluído!
pause
