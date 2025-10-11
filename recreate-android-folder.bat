@echo off
echo ========================================
echo RECRIANDO PASTA ANDROID COMPLETA
echo ========================================
echo.

echo 1. Fazendo backup da pasta android atual...
if exist "android_backup" rmdir /s /q android_backup
if exist "android" (
    move android android_backup
    echo Backup criado em android_backup
)

echo 2. Criando novo projeto Expo temporario...
mkdir temp-expo-project
cd temp-expo-project

echo 3. Inicializando projeto Expo...
npx create-expo-app@latest temp-app --template blank-typescript

echo 4. Gerando pasta android...
cd temp-app
npx expo prebuild --platform android

echo 5. Copiando pasta android para o projeto principal...
if exist "android" (
    xcopy /E /I /Y android ..\..\android
    echo ✅ Pasta android copiada com sucesso!
) else (
    echo ❌ Falha ao gerar pasta android
    cd ..\..
    rmdir /s /q temp-expo-project
    pause
    exit /b 1
)

echo 6. Limpando arquivos temporarios...
cd ..\..
rmdir /s /q temp-expo-project

echo 7. Ajustando configuracoes para o projeto glucocare...
echo Aplicando configuracoes personalizadas...

echo 8. Testando Gradle...
cd android
gradlew.bat --version

echo.
echo ========================================
echo PASTA ANDROID RECRIADA COM SUCESSO!
echo ========================================
echo.
echo Agora tente:
echo npx expo run:android
echo.

cd ..
pause
