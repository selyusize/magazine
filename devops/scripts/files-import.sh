#!/usr/bin/env bash
# Распаковка загрузок Medusa с прода (make pull-files) в backend/static — туда их пишет и отдаёт локальный file-local.
# Использование: devops/scripts/files-import.sh [архив]  (по умолчанию — свежий из devops/dumps)
set -euo pipefail
cd "$(dirname "$0")/.."

file=${1:-}
if [[ -z $file ]]; then
  for f in dumps/uploads-*.tar.gz; do [[ -f $f ]] && file=$f; done
fi
if [[ ! -f $file ]]; then
  echo "Нет архива в devops/dumps — сначала make pull-files" >&2
  exit 1
fi

mkdir -p ../backend/static
tar xzf "$file" -C ../backend/static
echo "Загрузки распакованы в backend/static из $file"
