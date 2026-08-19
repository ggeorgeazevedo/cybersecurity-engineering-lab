#!/usr/bin/env bash
# Sobe este repositório para o SEU GitHub.
# Uso:
#   ./scripts/push-to-github.sh <seu-usuario-github> [public|private]
# Requisitos: git instalado. Opcional: gh (GitHub CLI) autenticado (gh auth login).
set -euo pipefail

USER="${1:?Informe seu usuario do GitHub. Ex: ./scripts/push-to-github.sh saber public}"
VIS="${2:-public}"   # public habilita code scanning/attestations grátis
REPO="cybersecurity-engineering-lab"

cd "$(dirname "$0")/.."

# Garante que estamos num repo git com commit
if [ ! -d .git ]; then
  git init -b main
fi
git add -A
git commit -m "chore: initial bootcamp scaffold (Day 0 blueprint)" 2>/dev/null || echo "Nada novo para commitar."

if command -v gh >/dev/null 2>&1; then
  echo ">> Usando GitHub CLI (gh) para criar e enviar o repositório..."
  gh repo create "${USER}/${REPO}" --"${VIS}" --source=. --remote=origin --push
else
  echo ">> gh não encontrado. Crie o repo vazio '${REPO}' em https://github.com/new (sem README) e depois:"
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/${USER}/${REPO}.git"
  echo ">> Enviando via git push (vai pedir suas credenciais / token)..."
  git push -u origin main
fi

echo ""
echo "✅ Pronto: https://github.com/${USER}/${REPO}"
