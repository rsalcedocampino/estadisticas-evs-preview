#!/bin/bash
# deploy.sh — Publicar estadísticas EVs
# Uso:
#   ./deploy.sh preview     → publica en preview.energiasfuturo.com
#   ./deploy.sh prod        → publica en estadisticas.energiasfuturo.com
#   ./deploy.sh all         → publica en ambos

set -e

FECHA=$(date '+%d/%m/%Y %H:%M')

publish_preview() {
  echo "📤 Publicando en preview.energiasfuturo.com..."
  # Crear rama temporal con CNAME de preview
  git checkout -b _deploy_preview 2>/dev/null || git checkout _deploy_preview
  git reset --hard dev
  echo "preview.energiasfuturo.com" > CNAME
  git add CNAME
  git commit -m "deploy: preview ($FECHA)" --allow-empty
  git push preview _deploy_preview:main --force
  git checkout dev
  git branch -D _deploy_preview
  echo "✅ Preview publicado"
}

publish_prod() {
  echo "📤 Publicando en estadisticas.energiasfuturo.com..."
  git checkout main
  git merge dev -m "Publicar: merge dev → main ($FECHA)"
  # Asegurar CNAME correcto en main
  echo "estadisticas.energiasfuturo.com" > CNAME
  git add CNAME
  git diff --cached --quiet || git commit -m "fix: CNAME estadisticas.energiasfuturo.com"
  git push origin main
  git checkout dev
  echo "✅ Producción publicada"
}

case "$1" in
  preview) publish_preview ;;
  prod)    publish_prod ;;
  all)     publish_preview && publish_prod ;;
  *)       echo "Uso: ./deploy.sh [preview|prod|all]" && exit 1 ;;
esac
