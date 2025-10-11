@echo off
echo ========================================
echo INSTALANDO EAS CLI
echo ========================================
echo.

echo Tentando diferentes metodos de instalacao...
echo.

echo 1. Metodo 1: eas-cli
npm install -g eas-cli
if %ERRORLEVEL% EQU 0 (
    echo ✅ eas-cli instalado com sucesso!
    goto :test
)

echo 2. Metodo 2: @expo/eas-cli
npm install -g @expo/eas-cli
if %ERRORLEVEL% EQU 0 (
    echo ✅ @expo/eas-cli instalado com sucesso!
    goto :test
)

echo 3. Metodo 3: @expo/cli (alternativa)
npm install -g @expo/cli
if %ERRORLEVEL% EQU 0 (
    echo ✅ @expo/cli instalado com sucesso!
    goto :test
)

echo 4. Metodo 4: yarn (se disponivel)
yarn global add eas-cli
if %ERRORLEVEL% EQU 0 (
    echo ✅ eas-cli instalado com yarn!
    goto :test
)

echo ❌ Nenhum metodo funcionou. Tentando diagnostico...
goto :diagnose

:test
echo.
echo Testando instalacao...
eas --version
if %ERRORLEVEL% EQU 0 (
    echo ✅ EAS CLI funcionando!
    echo.
    echo Pronto para build! Execute:
    echo eas login
    echo eas build --platform android --profile development
) else (
    echo ❌ EAS CLI nao esta funcionando
)

goto :end

:diagnose
echo.
echo ========================================
echo DIAGNOSTICO
echo ========================================
echo.
echo Verificando npm...
npm --version
echo.
echo Verificando node...
node --version
echo.
echo Verificando PATH...
echo %PATH%
echo.
echo Sugestoes:
echo 1. Verifique se npm esta instalado corretamente
echo 2. Tente executar como administrador
echo 3. Use a alternativa: npx expo run:android
echo.

:end
pause
