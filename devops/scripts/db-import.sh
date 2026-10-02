#!/usr/bin/env bash
# Импорт дампа PostgreSQL с прода (make pull-db) в локальный postgres из devops/docker-compose.yml.
#   полный дамп             — локальная БД пересоздаётся целиком;
#   дамп таблиц (*-tables)  — в этих таблицах локальные строки заменяются строками с прода, остальное не трогается
#                             (схема должна совпадать: локально применены те же миграции).
# Ссылки на картинки прода (https://api.<домен>/static) заменяются на локальные (http://localhost:9000/static).
# Использование: devops/scripts/db-import.sh [файл]  (по умолчанию — свежий из devops/dumps)
# Переменные $POSTGRES_* раскрываются внутри контейнера — одинарные кавычки намеренно
# shellcheck disable=SC2016
set -euo pipefail
cd "$(dirname "$0")/.."

file=${1:-}
if [[ -z $file ]]; then
  for f in dumps/postgres-*.dump; do [[ -f $f ]] && file=$f; done
fi
if [[ ! -f $file ]]; then
  echo "Нет дампа в devops/dumps — сначала make pull-db" >&2
  exit 1
fi

LOCAL_FILE_URL=${LOCAL_FILE_URL:-http://localhost:9000/static}
PROD_FILE_URL=
meta=${file%.dump}.env
# shellcheck disable=SC1090
[[ -f $meta ]] && source "$meta"

compose=(docker compose -f docker-compose.yml)
psql_local() { "${compose[@]}" exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"'; }
restore() {
  if ! "${compose[@]}" exec -T postgres sh -c "pg_restore -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" --no-owner --no-acl $*" < "$file"; then
    echo "pg_restore завершился с ошибками (см. выше). Частая причина — исключена таблица, на которую ссылаются другие:" >&2
    echo "исключайте и зависимые (шаблоном: EXCLUDE='order*')." >&2
    exit 1
  fi
}

"${compose[@]}" up -d --wait postgres

if [[ $file == *-tables.dump ]]; then
  # Таблицы из дампа; удаляем их строки и грузим данные с отключёнными триггерами и FK (порядок таблиц не важен)
  tables=$("${compose[@]}" exec -T postgres pg_restore --list < "$file" \
    | awk '$4 == "TABLE" && $5 == "DATA" { printf "%s\"%s\".\"%s\"", sep, $6, $7; sep = ", " }')
  if [[ -z $tables ]]; then
    echo "В $file нет данных таблиц" >&2
    exit 1
  fi
  echo "Заменяю данные: $tables"
  printf 'BEGIN;\nSET LOCAL session_replication_role = replica;\n%s\nCOMMIT;\n' \
    "$(tr ',' '\n' <<< "$tables" | sed 's/^ *//; s/^\(.*\)$/DELETE FROM \1;/')" | psql_local
  restore --data-only --disable-triggers
else
  "${compose[@]}" exec -T postgres sh -c \
    'dropdb -U "$POSTGRES_USER" --if-exists --force "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
  restore
fi
echo "Импортирован $file"

if [[ -n $PROD_FILE_URL && $PROD_FILE_URL != "$LOCAL_FILE_URL" ]]; then
  psql_local <<SQL
DO \$\$
BEGIN
  IF to_regclass('public.image') IS NOT NULL THEN
    UPDATE image SET url = replace(url, '$PROD_FILE_URL', '$LOCAL_FILE_URL') WHERE url LIKE '$PROD_FILE_URL%';
  END IF;
  IF to_regclass('public.product') IS NOT NULL THEN
    UPDATE product SET thumbnail = replace(thumbnail, '$PROD_FILE_URL', '$LOCAL_FILE_URL') WHERE thumbnail LIKE '$PROD_FILE_URL%';
  END IF;
END
\$\$;
SQL
  echo "Ссылки на картинки: $PROD_FILE_URL → $LOCAL_FILE_URL (файлы — make pull-files)"
fi

if [[ $file != *-tables.dump ]]; then
  key=$("${compose[@]}" exec -T postgres sh -c \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select token from api_key where type = '\''publishable'\'' and revoked_at is null order by created_at limit 1"' || true)
  [[ -n $key ]] && echo "Publishable key прода: $key — пропишите его в NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (frontend/.env.local)"
  echo "Логины не выгружаются (auth_identity в pull_excluded_tables): создайте локального админа с e-mail, которого нет на проде:"
  echo "  cd backend && pnpm user:create -e dev@localhost -p <пароль>"
fi
