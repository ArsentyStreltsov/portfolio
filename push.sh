#!/usr/bin/env bash
# Закоммитить локальные изменения и запушить в GitHub.
# Использование: ./push.sh "сообщение коммита"
set -euo pipefail

cd "$(dirname "$0")"

MSG="${1:-}"
if [[ -z "$MSG" ]]; then
  echo "Использование: ./push.sh \"сообщение коммита\""
  exit 1
fi

git add -A

if git diff --cached --quiet; then
  echo "Нет изменений для коммита."
  if [[ -n "$(git status -sb | grep 'ahead')" ]]; then
    echo "Пушу уже существующие незапушенные коммиты..."
    git push
  else
    echo "Нечего пушить."
  fi
  exit 0
fi

git commit -m "$MSG"
git push

echo "Готово: запушено в origin/$(git branch --show-current)"
