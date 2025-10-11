@echo off
echo ========================================
echo CORRIGINDO DEPENDENCIAS FINAL
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

echo 5. Testando configuracao expo...
npx expo config

echo.
echo ========================================
echo DEPENDENCIAS CORRIGIDAS FINALMENTE!
echo ========================================
echo.
echo Agora tente:
echo eas build --platform android --profile development
echo.

pause
