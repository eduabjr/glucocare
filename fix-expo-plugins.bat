@echo off
echo ========================================
echo CORRIGINDO PLUGINS EXPO
echo ========================================
echo.

echo 1. Removendo node_modules e package-lock.json...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json

echo 2. Limpando cache npm...
npm cache clean --force

echo 3. Instalando dependencias...
npm install --legacy-peer-deps

echo 4. Verificando plugins expo...
npx expo install --fix

echo 5. Limpando cache expo...
npx expo r -c

echo 6. Testando configuracao...
npx expo config

echo.
echo ========================================
echo PLUGINS EXPO CORRIGIDOS!
echo ========================================
echo.
echo Agora tente:
echo eas build --platform android --profile development
echo.

pause
