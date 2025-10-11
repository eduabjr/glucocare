@echo off
echo ========================================
echo CORRIGINDO EAS BUILD FINAL
echo ========================================
echo.

echo 1. Removendo node_modules e package-lock.json...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json

echo 2. Limpando cache npm...
npm cache clean --force

echo 3. Instalando dependencias...
npm install --legacy-peer-deps

echo 4. Instalando expo-dev-client...
npm install expo-dev-client@~6.0.13 --legacy-peer-deps

echo 5. Corrigindo plugins expo...
npx expo install --fix

echo 6. Limpando cache expo...
npx expo r -c

echo 7. Testando configuracao...
npx expo config

echo.
echo ========================================
echo EAS BUILD CORRIGIDO!
echo ========================================
echo.
echo Agora tente:
echo eas build --platform android --profile development
echo.

pause
