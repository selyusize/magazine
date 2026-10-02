# Magazine

Шаблон интернет-магазина.

| Папка | Что внутри |
|---|---|
| [`frontend/`](frontend/README.md) | Витрина: Next.js 16, TypeScript, React Compiler, TanStack Query, Zustand, shadcn/ui, FSD, Orval |
| [`backend/`](backend/README.md) | Medusa 2 (headless commerce): Store/Admin API, админка |
| [`devops/`](devops/README.md) | Docker Compose для локального запуска |
| [`devops/ansible/`](devops/ansible/README.md) | Прод: Ansible, Traefik + Let's Encrypt, PostgreSQL, Redis, RabbitMQ, деплой без простоя |
| [`.github/workflows/`](.github/workflows) | CI на PR, CD на push в `main`: образы в GHCR → Ansible |

## Разработка

```bash
make dev-install    # .env из шаблонов, pnpm install, Postgres/Redis/Mailpit, миграции, генерация API, publishable key
make dev-up         # Postgres/Redis/Mailpit + генерация API + backend :9000 и frontend :3000 (Ctrl+C — остановить)
make api-generate   # только генерация API
make test           # тесты фронта (unit + integration против Medusa, поднимается сама)
make dev-down       # остановить контейнеры и dev-серверы
make dev-restart    # dev-down + dev-up
```

Админ Medusa: `cd backend && pnpm user:create -e admin@example.com -p <пароль>`.
Весь стек в Docker — см. [`devops/README.md`](devops/README.md).

## Локальные адреса

После `make dev-up` (и так же при запуске всего стека в Docker):

| Что | Адрес | Примечание |
|---|---|---|
| Витрина | http://localhost:3000 | Next.js |
| Вход / регистрация покупателя | http://localhost:3000/login, http://localhost:3000/register | |
| Оформление заказа | http://localhost:3000/checkout | |
| Админка Medusa | http://localhost:9000/app | логин — созданный через `pnpm user:create` |
| Store API | http://localhost:9000/store | нужен заголовок `x-publishable-api-key` (ключ — в `frontend/.env.local`) |
| Admin API | http://localhost:9000/admin | токен админа |
| Healthcheck backend / витрины | http://localhost:9000/health, http://localhost:3000/api/health | |
| Загруженные файлы | http://localhost:9000/static/… | картинки товаров (`backend/static`) |
| **Почта (Mailpit)** | http://localhost:8025 | все письма магазина: заказ, сброс пароля, приглашение, приветствие. Наружу ничего не уходит |
| PostgreSQL | `localhost:5432` | БД / пользователь / пароль — `medusa` / `medusa` / `medusa` (`devops/.env`) |
| Redis | `localhost:6379` | |
| SMTP Mailpit | `localhost:1025` | для backend (`SMTP_HOST` в `backend/.env`) |

Спецификация Store API — `backend/openapi/store.oas.json`.

На проде (домен из `devops/ansible/inventories/production/group_vars/all/main.yml`):
витрина `https://<домен>`, API и админка `https://api.<домен>` (`/app`), дашборд Traefik `https://traefik.<домен>`,
RabbitMQ `https://rabbitmq.<домен>`.

## Почта

Письма отправляет backend (модуль Notification + SMTP, `backend/src/modules/smtp`):

| Событие | Письмо | Кому |
|---|---|---|
| `order.placed` | Заказ оформлен: позиции, доставка, итог | покупателю |
| `auth.password_reset` | Ссылка на смену пароля (витрина `/reset-password` или админка) | покупателю / сотруднику |
| `invite.created`, `invite.resent` | Приглашение в админку | сотруднику |
| `customer.created` | Приветствие после регистрации (гостям — нет) | покупателю |

Локально всё уходит в Mailpit (http://localhost:8025). На проде — любой SMTP: `smtp_host` / `smtp_user` в
`group_vars/all/main.yml`, пароль — `vault_smtp_password` (`make infra-vault-edit`). Тексты писем —
`backend/src/modules/smtp/templates.ts`, новое письмо = шаблон + подписчик в `backend/src/subscribers`.
Без `SMTP_HOST` письма не отправляются, а пишутся в лог backend.

## Прод

```bash
make infra-deps         # коллекции Ansible
make infra-vault        # секреты (случайные, зашифрованы)
make infra-bootstrap    # чистый сервер: пользователь deploy, SSH по ключу, UFW, Docker
make infra-traefik      # HTTPS
make infra-data         # postgres, redis, rabbitmq
make deploy TAG=sha-…   # backend + frontend (обычно это делает CI на push в main)
make prod-restart       # перезапуск; prod-down / prod-up — остановить и поднять (SERVICES=backend,frontend)
```

Пошагово, CI/CD-секреты, откат, бэкапы — [`devops/ansible/README.md`](devops/ansible/README.md).

## Генерация API

```
backend/src/api/**/route.ts (JSDoc @oas)  ┐
Store API Medusa (docs.medusajs.com)       ┴─ medusa-oas → backend/openapi/store.oas.json (коммитится)
                                                  └─ Orval → frontend/src/shared/api/generated (не коммитится)
```

Чтобы свой store-роут появился во фронте, опишите его JSDoc-блоком `@oas` (пример — `backend/src/api/store/custom/route.ts`)
и запустите `make api-generate`: получите `getCustom()`, `useGetCustom()`, `prefetchGetCustomQuery()` и т.д.
