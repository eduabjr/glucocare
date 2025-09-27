#!/bin/bash
# Adiciona todas as alterações
git add .

# Verifica se há alterações antes de commitar
if git diff-index --quiet HEAD --; then
  echo "Nenhuma mudança para commit."
else
  # Commit com uma mensagem padrão
  git commit -m "Alterações automáticas"

  # Push para a branch principal (main) no GitHub
  git push origin main
  echo "Mudanças enviadas para o GitHub."
fi
