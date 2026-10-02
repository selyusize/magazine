#!/usr/bin/env bash
# Создаёт inventories/<окружение>/group_vars/all/vault.yml со случайными секретами и шифрует его.
# Пароль Vault берётся из .vault_pass (создаётся, если его нет) или $ANSIBLE_VAULT_PASSWORD.
# Использование: scripts/vault-init.sh [production]
set -euo pipefail
cd "$(dirname "$0")/.."

inventory=${1:-production}
file=inventories/$inventory/group_vars/all/vault.yml

if [[ ! -d inventories/$inventory ]]; then
  echo "Нет inventories/$inventory" >&2
  exit 1
fi
if [[ -e $file ]]; then
  echo "$file уже существует — редактирование: make infra-vault-edit INVENTORY=$inventory" >&2
  exit 1
fi
if [[ -z ${ANSIBLE_VAULT_PASSWORD:-} && ! -f .vault_pass ]]; then
  (umask 077 && openssl rand -base64 32 > .vault_pass)
  echo "Создан devops/ansible/.vault_pass — сохраните его в менеджер паролей и в секрет CI ANSIBLE_VAULT_PASSWORD"
fi

# hex — безопасно для URL подключений (postgres://, redis://, amqp://) без экранирования
secret() { openssl rand -hex "${1:-24}"; }

(umask 077 && cat > "$file" <<EOF
# Секреты окружения $inventory (зашифровано ansible-vault). Редактирование: make infra-vault-edit
# В паролях, которые попадают в URL подключений, используйте только [A-Za-z0-9].

vault_postgres_password: $(secret)
vault_redis_password: $(secret)
vault_rabbitmq_password: $(secret)

# Medusa
vault_medusa_jwt_secret: $(secret 32)
vault_medusa_cookie_secret: $(secret 32)
vault_medusa_auth_mfa_encryption_key: $(secret 32)

# Пароль SMTP (smtp_host / smtp_user — в group_vars/all/main.yml). Для Яндекс 360 и Mail.ru — пароль приложения
vault_smtp_password: ""

# Дашборд traefik: https://traefik.<домен>, пользователь admin
vault_traefik_dashboard_password: $(secret 12)

# Доступ сервера к реестру образов для ручного деплоя (make deploy-*).
# Для GHCR — Personal Access Token с правом read:packages. CI передаёт свой GITHUB_TOKEN и эти значения не использует.
vault_registry_username: ""
vault_registry_password: ""

# Секретные переменные окружения backend: ключи ЮKassa, СДЭК, SMTP…
# Несекретные — в backend_env (group_vars/all/main.yml).
vault_backend_env: {}
#  YOOKASSA_SHOP_ID: "123456"
#  YOOKASSA_SECRET_KEY: live_xxx
EOF
)

ANSIBLE_VAULT_PASSWORD_FILE=vault-pass.sh ansible-vault encrypt "$file"
echo "Готово: $file"
