@echo off
echo ========================================
echo CORRIGINDO PACKAGE-LOCK DEFINITIVAMENTE
echo ========================================
echo.

echo 1. Removendo TODOS os arquivos de lock...
if exist "package-lock.json" del package-lock.json
if exist "yarn.lock" del yarn.lock
if exist "pnpm-lock.yaml" del pnpm-lock.yaml

echo 2. Removendo node_modules completamente...
if exist "node_modules" rmdir /s /q node_modules

echo 3. Limpando cache npm completamente...
npm cache clean --force

echo 4. Removendo cache do npm...
if exist "%APPDATA%\npm-cache" rmdir /s /q "%APPDATA%\npm-cache"

echo 5. Instalando dependencias com --legacy-peer-deps...
npm install --legacy-peer-deps

echo 6. Verificando se package-lock.json foi criado...
if exist "package-lock.json" (
    echo ✅ package-lock.json criado com sucesso!
    echo Tamanho do arquivo:
    dir package-lock.json
) else (
    echo ❌ package-lock.json nao foi criado!
)

echo 7. Verificando instalacao das dependencias...
npm list --depth=0

echo 8. Testando configuracao expo...
npx expo config

echo.
echo ========================================
echo PACKAGE-LOCK CORRIGIDO DEFINITIVAMENTE!
echo ========================================
echo.
echo Agora tente:
echo eas build --platform android --profile development
echo.

pause
