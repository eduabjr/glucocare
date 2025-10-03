@echo off
echo Iniciando commit e push rapido...

REM Adiciona todas as alteracoes
git add .

REM Verifica se ha alteracoes
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo Nenhuma mudanca para commit.
    exit /b 0
)

REM Commit com mensagem automatica
git commit -m "Atualizacoes automaticas - %date% %time%"

REM Push para o GitHub
git push origin main

if %errorlevel% equ 0 (
    echo Mudancas enviadas para o GitHub com sucesso!
) else (
    echo Erro ao enviar mudancas para o GitHub.
    exit /b 1
)
