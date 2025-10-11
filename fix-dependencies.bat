@echo off
echo ========================================
echo CORRIGINDO DEPENDENCIAS
echo ========================================
echo.

echo 1. Removendo node_modules e package-lock.json...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json

echo 2. Limpando cache npm...
npm cache clean --force

echo 3. Instalando dependencias com --legacy-peer-deps...
npm install --legacy-peer-deps

echo 4. Verificando instalacao...
npm list --depth=0

echo.
echo ========================================
echo DEPENDENCIAS CORRIGIDAS!
echo ========================================
echo.
echo Agora tente:
echo eas build --platform android --profile development
echo.

pause
