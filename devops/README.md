# DevOps

Docker Compose для инфраструктуры и всего стека. Контекст сборки образов — корень репозитория.

```
postgres ──┐
redis ─────┤
mailpit ───┼── backend-migrate (medusa db:migrate, один раз)
           ├── backend          :9000  Store/Admin API + админка /app   (MEDUSA_WORKER_MODE=server)
           └── backend-worker          подписчики, jobs, workflows      (MEDUSA_WORKER_MODE=worker)
frontend   :3000  Next.js standalone ── http://backend:9000 (SSR, внутренняя сеть)
браузер ── http://localhost:9000 (NEXT_PUBLIC_API_URL, CORS: STORE_CORS)
```

## Запуск

```bash
cp .env.example .env            # заполнить секреты и NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

# только postgres + redis + mailpit (backend и frontend — через `pnpm dev`); письма — http://localhost:8025
docker compose up -d

# весь стек
docker compose --profile app up -d --build

# админ Medusa
docker compose --profile app run --rm backend-migrate pnpm exec medusa user -e admin@example.com -p <пароль>

# логи / остановка
docker compose --profile app logs -f backend frontend
docker compose --profile app down
```

## Как фронт общается с бэкендом

- **SSR / Server Components** ходят по внутренней сети compose: `API_INTERNAL_URL=http://backend:9000` (рантайм).
- **Браузер** ходит на `NEXT_PUBLIC_API_URL` — значение вшивается в бандл при сборке образа (build arg).
  Origin фронта должен быть в `STORE_CORS` (и `AUTH_CORS` для логина покупателей).
- Каждый `/store`-запрос несёт `x-publishable-api-key` = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.
  Ключ создаётся при первой миграции; посмотреть — в админке (Settings → Publishable API Keys).
  После смены ключа или `NEXT_PUBLIC_API_URL` нужно пересобрать образ фронта.

## Прод

Здесь — локальный запуск. Сервер, HTTPS, БД, CI/CD и деплой без простоя — [`ansible/README.md`](ansible/README.md).
