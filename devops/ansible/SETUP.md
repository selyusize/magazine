# Что где указывать

Чек-лист перед первым запуском. Нужно заполнить 4 места, остальное работает по умолчанию.
Подробности — в [README.md](README.md).

## 1. IP сервера

`devops/ansible/inventories/production/hosts.yml`

```yaml
ansible_host: 203.0.113.10      # ← IP вашего сервера
```

## 2. Домен, почта, ключи, реестр

`devops/ansible/inventories/production/group_vars/all/main.yml`, блок «Обязательно заполнить»:

```yaml
domain: example.ru                         # ← ваш домен
acme_email: admin@example.ru               # ← почта для Let's Encrypt
deploy_authorized_keys:                    # ← публичные SSH-ключи
  - ssh-ed25519 AAAA... you@laptop         #   ваш (cat ~/.ssh/id_ed25519.pub)
  - ssh-ed25519 AAAA... github-actions     #   ключ CI (ci_deploy.pub, см. п. 4)
image_prefix: ghcr.io/owner/magazine-template   # ← ghcr.io/<ваш-github>/<репозиторий>, строчными
```

В том же файле по желанию:

- `admin_allowlist` — с каких IP открыты админка Medusa, дашборд Traefik и RabbitMQ (по умолчанию — со всех);
- `rabbitmq_enabled` — выключить RabbitMQ, если он не нужен.

## 3. Секреты

Файл не пишется руками, его создаёт команда:

```bash
make infra-vault
```

Она генерирует все пароли в `group_vars/all/vault.yml` (зашифрован) и создаёт `devops/ansible/.vault_pass`.
Содержимое `.vault_pass` сохраните в менеджер паролей — оно понадобится в GitHub (п. 4).

Ключи ЮKassa, СДЭК и т.п. — позже через `make infra-vault-edit`, в блок `vault_backend_env`.

## 4. GitHub

Ключ для CI:

```bash
ssh-keygen -t ed25519 -f ci_deploy -N '' -C github-actions   # ci_deploy.pub → deploy_authorized_keys (п. 2)
ssh-keyscan <IP сервера>                                      # вывод → SSH_KNOWN_HOSTS
```

Репозиторий → Settings:

| Где | Имя | Значение |
|---|---|---|
| Environments → `production` → Secrets | `SSH_PRIVATE_KEY` | содержимое файла `ci_deploy` |
| Environments → `production` → Secrets | `SSH_KNOWN_HOSTS` | вывод `ssh-keyscan` |
| Environments → `production` → Secrets | `ANSIBLE_VAULT_PASSWORD` | содержимое `devops/ansible/.vault_pass` |
| Secrets and variables → Actions → Variables | `DEPLOY_ENABLED` | `true` |

Файлы `ci_deploy` и `ci_deploy.pub` в репозиторий не коммитьте.

## DNS

У регистратора — A-записи на IP сервера:

| Запись | Для чего |
|---|---|
| `example.ru` | витрина |
| `www` | редирект на `example.ru` |
| `api` | Medusa API и админка (`/app`) |
| `traefik` | дашборд Traefik |
| `rabbitmq` | UI RabbitMQ |

## Запуск

```bash
make infra-deps        # один раз на машине: коллекции Ansible
make infra-bootstrap   # чистый сервер, вход от root
make infra-traefik     # HTTPS
make infra-data        # postgres, redis, rabbitmq
git push origin main   # CI соберёт образы и задеплоит backend и frontend
```
