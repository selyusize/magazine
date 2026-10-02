# Magazine — backend

Medusa 2.21 (Node.js, TypeScript, PostgreSQL, Redis). Админка — `http://localhost:9000/app`.

## Локальная разработка

```bash
# 1. Postgres + Redis
cd ../devops && cp -n .env.example .env && docker compose up -d

# 2. Backend
cp -n .env.template .env
pnpm install
pnpm db:migrate          # миграции + src/migration-scripts (начальные данные)
pnpm user:create -e admin@example.com -p <пароль>
pnpm dev                 # http://localhost:9000
```

## Команды

```bash
pnpm dev | build | start
pnpm db:migrate
pnpm seed                # демо-товары (src/scripts/seed-demo-products.ts)
pnpm user:create -e <email> -p <пароль>
pnpm openapi:generate    # openapi/store.oas.json: Store API Medusa + свои роуты с JSDoc @oas
pnpm lint
pnpm test:unit | test:integration:http | test:integration:modules
```

## Конфигурация

- `medusa-config.ts`: при заданном `REDIS_URL` события, workflows и блокировки идут через Redis
  (обязательно, когда server и worker в разных контейнерах).
  `MEDUSA_WORKER_MODE` — `shared` (dev), `server` (HTTP API + админка), `worker` (подписчики, jobs).
- Почта: модуль Notification с провайдером `src/modules/smtp` (nodemailer) при заданном `SMTP_HOST`, иначе письма
  только пишутся в лог. Шаблоны — `src/modules/smtp/templates.ts`, отправку запускают подписчики `src/subscribers`
  (заказ, сброс пароля, приглашение, приветствие). Локально `SMTP_HOST=localhost:1025` — Mailpit, http://localhost:8025.
- `openapi/store.oas.json` — спецификация Store API, из неё фронт генерирует клиент (Orval).
  Собирается `@medusajs/medusa-oas-cli`: базовая спецификация Medusa (скачивается с docs.medusajs.com)
  + JSDoc-блоки `@oas` из `src/api` (пример — `src/api/store/custom/route.ts`). Роут без `@oas`
  во фронтовый клиент не попадёт. Файл коммитится, чтобы сборки не зависели от сети.
- `src/migration-scripts/initial-data-seed.ts` выполняется один раз при `db:migrate` и создаёт демо-регион
  (Европа, EUR), склад, доставку и publishable key. Для боевого магазина замените на свои данные (RU, RUB).

## Структура `src/`

`api/` — свои эндпоинты (`store/`, `admin/`), `modules/` — свои модули, `links/` — связи модулей,
`workflows/`, `subscribers/`, `jobs/`, `admin/` — расширения админки.
