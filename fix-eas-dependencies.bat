@echo off
echo ========================================
echo CORRIGINDO DEPENDENCIAS PARA EAS BUILD
echo ========================================
echo.

echo 1. Removendo arquivos de lock...
if exist "package-lock.json" del package-lock.json
if exist "yarn.lock" del yarn.lock

echo 2. Removendo node_modules...
if exist "node_modules" rmdir /s /q node_modules

echo 3. Limpando cache npm...
npm cache clean --force

echo 4. Instalando dependencias com --legacy-peer-deps...
npm install --legacy-peer-deps

echo 5. Verificando instalacao...
npm list --depth=0

echo.
echo ========================================
echo DEPENDENCIAS CORRIGIDAS PARA EAS!
echo ========================================
echo.
echo Agora tente:
echo eas build --platform android --profile development
echo.

pause
