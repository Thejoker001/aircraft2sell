#!/usr/bin/env bash
# Installe un nouveau token Vercel : .env local + secret GitHub Actions.
#
# Le token se crée sur https://vercel.com/account/tokens
#   Name  : aircraft2sell-ci
#   Scope : thejoker001-8718's projects   (PAS "Personal Account")
#
# Usage : bash scripts/set-vercel-token.sh
#         (le token est demandé en saisie masquée, jamais dans l'historique shell)
set -euo pipefail

ENV_FILE="$HOME/.hermes/profiles/aircraft2sell/.env"
REPO="Thejoker001/aircraft2sell"

echo "Collez le token Vercel (la saisie reste invisible), puis Entrée :"
read -rs TOKEN
echo

if [ -z "${TOKEN}" ]; then
  echo "Aucun token saisi. Abandon." >&2
  exit 1
fi

# 1. Validation AVANT d'écrire quoi que ce soit : inutile d'installer un token mort.
echo -n "Vérification du token… "
if ! WHO=$(npx --yes vercel@latest whoami --token="$TOKEN" 2>/dev/null | tail -1); then
  echo "ÉCHEC"
  echo "Ce token est refusé par Vercel. Vérifiez qu'il a bien été copié en entier." >&2
  exit 1
fi
echo "OK (compte : $WHO)"

# 2. Accès au projet : un token valide mais sans le bon scope ne déploierait pas.
echo -n "Accès au projet aircraft2sell… "
if ! (cd "$(dirname "$0")/.." && vercel pull --yes --environment=production --token="$TOKEN" >/dev/null 2>&1); then
  echo "ÉCHEC"
  echo "Token valide mais sans accès au projet : recréez-le avec le scope" >&2
  echo "\"thejoker001-8718's projects\" au lieu de \"Personal Account\"." >&2
  exit 1
fi
echo "OK"

# 3. Mise à jour du .env (remplace la ligne existante, sinon l'ajoute).
if grep -q '^VERCEL_TOKEN=' "$ENV_FILE" 2>/dev/null; then
  tmp=$(mktemp)
  grep -v '^VERCEL_TOKEN=' "$ENV_FILE" > "$tmp"
  printf 'VERCEL_TOKEN=%s\n' "$TOKEN" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "OK  .env mis à jour"
else
  printf 'VERCEL_TOKEN=%s\n' "$TOKEN" >> "$ENV_FILE"
  echo "OK  .env complété"
fi

# 4. Secret GitHub Actions : c'est lui qui débloque le déploiement automatique.
if printf '%s' "$TOKEN" | gh secret set VERCEL_TOKEN --repo "$REPO" >/dev/null 2>&1; then
  echo "OK  secret GitHub VERCEL_TOKEN mis à jour"
else
  echo "ÉCHEC du secret GitHub — le faire à la main :" >&2
  echo "  gh secret set VERCEL_TOKEN --repo $REPO" >&2
  exit 1
fi

echo
echo "Terminé. Pour vérifier que la CI redéploie :"
echo "  gh workflow run 'Deploy to Vercel' --repo $REPO"
echo "  gh run list --limit 1 --repo $REPO"
