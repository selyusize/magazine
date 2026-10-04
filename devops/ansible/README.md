# Прод: Ansible + Traefik + CI/CD

Сеть магазинов Snowaa: один бэкенд Medusa на все магазины и фронт каждого магазина (`<магазин>-frontend`).
Ansible готовит серверы и раскладывает сервисы как отдельные compose-проекты в `/opt/snowaa/`, Traefik отдаёт
всё по HTTPS (Let's Encrypt), GitHub Actions собирает образы и деплоит. **На сервер не заходим**: деплой,
миграции, логи, бэкапы, восстановление, разовые команды и админы — цели `make` с вашей машины (раздел
«Повседневное»).

Хосты — две группы inventory: `backend` (Medusa, БД, Redis, RabbitMQ) и `storefronts` (фронты магазинов).
Сейчас это один сервер в обеих группах; фронты можно вынести на свои хосты без правок ролей — тогда они ходят в
API по `https://api.<домен сети>`, а не по внутренней docker-сети.

```
                       ┌──────────── сеть proxy ────────────────────────────────┐
интернет ─ :80/:443 ─ traefik ─┬─ olisa-frontend   olisa.ru, www → 301          (Next.js)
           (HTTP→HTTPS,        ├─ snowaa-backend   api.snowaa.ru (/app, /admin — только admin_allowlist)
            LE-сертификаты)    ├─ rabbitmq         rabbitmq.snowaa.ru (UI, admin_allowlist)
                               └─ дашборд          traefik.snowaa.ru (basic auth + admin_allowlist)
                       └───────────────────────────────────────────────────────┘
                       ┌──────────── сеть internal (без выхода в интернет) ─────┐
snowaa-backend, snowaa-backend-worker ─ snowaa-postgres · snowaa-redis · snowaa-rabbitmq (AMQP)
                       └───────────────────────────────────────────────────────┘
```

| Сервис | Зачем | Роль |
|---|---|---|
| Traefik v3 + docker-socket-proxy | HTTPS, редиректы, заголовки безопасности, сжатие, retry | `traefik` |
| PostgreSQL 17, Redis 8 | БД и шина событий/воркфлоу Medusa | `postgres`, `redis` |
| RabbitMQ 4 | для своих модулей и интеграций (1С, ERP, очереди) — Medusa его не использует | `rabbitmq` |
| Medusa: server + worker | API, админка, фоновые задачи — одни на всю сеть | `backend` |
| Next.js | витрина магазина (`olisa-frontend`; несколько магазинов — шаг 9 плана) | `frontend` |
| Сервер | пакеты, swap, пользователь `deploy`, SSH только по ключу, UFW, fail2ban, автообновления безопасности, Docker | `common`, `docker` |

Medusa работает только на PostgreSQL — это единственная БД стека. Адрес RabbitMQ попадает в backend как `RABBITMQ_URL`;
не нужен — `rabbitmq_enabled: false`.

## Какой сервер брать

Для маленького магазина (до ~1000 товаров, до нескольких тысяч посетителей в день) хватает одного VPS:

| | Минимум | Рекомендуется |
|---|---|---|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 ГБ (+ swap 2 ГБ, его создаёт роль `common`) | 8 ГБ |
| Диск | 40 ГБ NVMe | 80 ГБ NVMe |
| ОС | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS / Debian 12 |
| Сеть | публичный IPv4 | + IPv6 |

Сколько занимают сервисы в простое: Medusa server + worker ≈ 0,8–1,2 ГБ, Next.js ≈ 200–300 МБ, PostgreSQL ≈ 150 МБ
(+ `postgres_shared_buffers`), RabbitMQ ≈ 150 МБ, Redis и Traefik — десятки МБ.
На 2 ГБ стек тоже запустится, но только без RabbitMQ и с риском OOM при выкате:
в момент выката backend и frontend на минуту работают в двух экземплярах.

Хостинг с серверами в РФ (152-ФЗ: персональные данные россиян хранятся в России) — например Selectel, Timeweb Cloud,
Yandex Cloud, VK Cloud. Берите тариф с NVMe и почасовой оплатой, включите бэкапы диска у провайдера.

## Новый сервер за 15 минут

Короткий чек-лист «что где указывать» — [SETUP.md](SETUP.md).

Нужно: VPS с Ubuntu 24.04 / Debian 12 (см. «Какой сервер брать»), домен, на машине — `ansible-core` ≥ 2.19 и `openssl`.

```bash
pipx install ansible-core        # или brew install ansible
make infra-deps                  # коллекции community.docker / community.general / ansible.posix
```

**1. DNS.** A-записи на IP сервера: домен сети — `api`, `traefik`, `rabbitmq` (`api.snowaa.ru`…), домен витрины
и `www` (`olisa.ru`). Без них Let's Encrypt не выдаст сертификаты.

**2. Inventory.** `devops/ansible/inventories/production/`:

- `hosts.yml` — `ansible_host: <IP сервера>` (хост в группах `backend` и `storefronts`);
- `group_vars/all/main.yml` — `network_domain`, `frontend_domain`, `acme_email`, `image_prefix`
  (`ghcr.io/<owner>/<repo>` в нижнем регистре), `deploy_authorized_keys` — ваш публичный ключ и ключ CI (см. ниже).
  Остальное — по желанию.

**3. Секреты.**

```bash
make infra-vault                 # vault.yml со случайными паролями (зашифрован) + devops/ansible/.vault_pass
```

`.vault_pass` в git не попадает — сохраните его в менеджер паролей, он же пойдёт в секрет CI.
Посмотреть/поменять секреты: `make infra-vault-edit`.

**4. Сервер.** Первый вход — под root (или `BOOTSTRAP_USER=ubuntu` у облаков без root):

```bash
make infra-bootstrap             # создаёт deploy, выключает вход по паролю, UFW, fail2ban, Docker
```

Дальше Ansible ходит под `deploy`.

**5. Инфраструктура.**

```bash
make infra-traefik               # HTTPS
make infra-data                  # postgres, redis, rabbitmq
```

**6. Приложения.** Либо через CI (ниже), либо руками, если образы уже лежат в реестре:

```bash
make deploy TAG=sha-abc1234      # backend (миграции) → frontend
```

Всё сразу на готовом сервере: `make infra-site`.

**7. Админ Medusa.**

```bash
make backend-user EMAIL=admin@example.ru PASSWORD='<пароль>'   # пароль в лог Ansible не попадает
```

Админка — `https://api.<домен сети>/app`.

## CI/CD (GitHub Actions)

- `.github/workflows/ci.yml` — на каждый PR: линт, FSD, типы, unit-тесты и сборка фронта, линт и сборка backend,
  `make infra-lint` (ansible-lint + syntax-check плейбуков).
- `.github/workflows/deploy.yml` — на push в `main` (или вручную): CI → образ backend в GHCR → деплой backend
  (миграции + выкат без простоя) → образ витрины → деплой витрины. Теги образов: `sha-<commit>` и `latest`.
  Деплой — те же цели, что вручную: `make deploy-backend` / `make deploy-frontend` с `TAG` и `IMAGE_PREFIX`.
- `.github/workflows/infra-check.yml` — раз в неделю и вручную: `make infra-check` (`infra-site --check --diff`) —
  показывает, чем серверы разошлись с описанием в Ansible.

Витрина собирается после деплоя backend: в её бандл вшиваются `NEXT_PUBLIC_API_URL` и publishable key,
а ключ создаётся первой миграцией. Плейбук `frontend-build-args.yml` берёт ключ из `medusa_publishable_key`
или из БД.

Настройка один раз:

```bash
ssh-keygen -t ed25519 -f ci_deploy -N '' -C github-actions   # ci_deploy.pub → deploy_authorized_keys, затем make infra-server
ssh-keyscan <IP сервера>                                      # → SSH_KNOWN_HOSTS
```

В репозитории GitHub:

| Где | Что |
|---|---|
| Settings → Environments → `production` → Secrets | `SSH_PRIVATE_KEY` (содержимое `ci_deploy`), `SSH_KNOWN_HOSTS`, `ANSIBLE_VAULT_PASSWORD` (содержимое `.vault_pass`) |
| Settings → Environments → `production` → Variables | `SITE_URL` (необязательно, ссылка в интерфейсе деплоя) |
| Settings → Variables → Actions (репозиторий) | `DEPLOY_ENABLED=true` — без неё деплой не запускается (чтобы свежие копии шаблона не падали) |

Ручное подтверждение деплоя — Required reviewers в окружении `production`.
Сервер тянет образы токеном самого запуска (`GITHUB_TOKEN`), отдельный PAT нужен только для `make deploy` с вашей машины
(`vault_registry_username` / `vault_registry_password`, право `read:packages`).

## Как устроен деплой без простоя

`/opt/<project>/bin/compose-rollout` (роль `docker`) для `backend` и `frontend`:

1. рядом со старыми контейнерами поднимаются новые;
2. пока новые не стали `healthy`, Traefik в них трафик не шлёт;
3. старые останавливаются. Не поднялись новые — они удаляются, старые продолжают работать, деплой падает.

Traefik повторяет идемпотентные запросы на живой контейнер (`retry`, POST не повторяется) и не ждёт 30 с
исчезнувший IP (`dialTimeout: 2s`). На стенде выкат Medusa и Next под постоянной нагрузкой прошёл без единой ошибки;
худший запрос — ~2 с.

Миграции идут до выката (`docker compose run --rm backend-migrate`). Упали — деплой останавливается на старой версии.
Worker просто пересоздаётся.

## Безопасность

Что включено сразу:

| Уровень | Что сделано |
|---|---|
| Сервер | вход по SSH только по ключу, root — только по ключу (`common_ssh_permit_root_login: no` — совсем запретить), fail2ban для SSH, UFW: открыты только 22/80/443, автообновления безопасности |
| Docker | наружу публикуется только Traefik; БД и брокер — в сети `internal` без выхода в интернет; Traefik видит Docker API через read-only socket-proxy; `no-new-privileges` у Traefik и приложений; контейнеры приложений работают не от root |
| TLS | Let's Encrypt с автопродлением, HTTP → HTTPS (301), TLS 1.2+ со стойкими шифрами, HSTS на год с поддоменами, HTTP/3 |
| Заголовки | CSP у каждого сервиса: витрина — с nonce на каждый запрос (без `unsafe-inline` для скриптов), API — `default-src 'none'`, админка — строгая; `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`; заголовки `Server` и `X-Powered-By` удаляются |
| Cookies | сессия покупателя — `HttpOnly`, `Secure`, `SameSite=Lax`; JWT недоступен JS |
| Доступ | админка Medusa, дашборд Traefik и UI RabbitMQ — только из `admin_allowlist`, дашборд ещё и под паролем |
| Перебор паролей | вход и регистрация (Medusa `/auth/*`, POST `/login` и `/register` витрины) — 10 попыток в минуту с IP; общий лимит — 100 запросов/с с IP |
| Секреты | только в ansible-vault и секретах GitHub, на сервере — в файлах `0600` |
| Данные | ночные дампы PostgreSQL; загрузки Medusa — в отдельном volume |

**Что сделать руками после запуска:**

1. Сузить `admin_allowlist` до своих IP или VPN и выполнить `make infra-traefik deploy-backend`.
2. Включить двухфакторную аутентификацию в админке Medusa (ключ `AUTH_MFA_ENCRYPTION_KEY` уже задан).
3. Проверить сайт в [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory) и
   [SSL Labs](https://www.ssllabs.com/ssltest/). Цель — A+ в обоих.
4. Когда все поддомены точно работают по HTTPS — `traefik_hsts_preload: true` и заявка на [hstspreload.org](https://hstspreload.org).
5. Настроить копирование бэкапов за пределы сервера.
6. Включить Dependabot (`.github/dependabot.yml`) и Required reviewers для окружения `production`.

**CSP витрины и внешние сервисы.** Политику собирает `frontend/src/shared/lib/csp.ts`. Скрипты разрешены только
с nonce (Next ставит его сам; для своих `<Script>` берите nonce из заголовка `x-nonce`). Счётчики, платёжные
виджеты и CDN картинок добавляются через `frontend_env`, без пересборки образа:

```yaml
# group_vars/all/main.yml — пример для Яндекс Метрики и виджета ЮKassa
frontend_env:
  CSP_SCRIPT_SRC: https://mc.yandex.ru https://yastatic.net
  CSP_CONNECT_SRC: https://mc.yandex.ru wss://mc.yandex.ru https://mc.yandex.com
  CSP_IMG_SRC: https://mc.yandex.ru https://mc.yandex.com
  CSP_FRAME_SRC: https://yoomoney.ru
```

Нарушения CSP видны в консоли браузера (DevTools → Console). Цена nonce-CSP — все страницы витрины рендерятся
на каждый запрос (без ISR). Для маленького магазина нагрузка небольшая; если упрётесь — см. «Subresource Integrity»
в гайде Next по CSP.

**За CDN или DDoS-защитой** (Cloudflare, DDoS-Guard, Qrator) пропишите их подсети в `traefik_trusted_ips` —
иначе лимиты и `admin_allowlist` будут считать всех посетителей одним IP CDN.

## Повседневное

Всё — с вашей машины, без `ssh` (плейбуки `backend-ops.yml`, `db-ops.yml`, `stack.yml`):

```bash
make deploy-backend TAG=sha-abc1234     # деплой/откат backend на конкретный коммит
make deploy-frontend TAG=sha-abc1234    # то же для витрины
make prod-status                        # контейнеры, здоровье, образы на всех хостах
make prod-restart SERVICES=backend      # перезапустить сервис (короткий простой)
make prod-down / make prod-up           # остановить (спросит подтверждение) / поднять; данные остаются

make backend-migrate                    # миграции и migration-scripts (то же, что при деплое)
make backend-exec CMD="pnpm exec medusa exec ./src/scripts/resize-images.js"   # разовая команда
make backend-seed                       # демо-товары (для стенда; спросит подтверждение)
make backend-user EMAIL=… PASSWORD=…    # админ Medusa

make backend-logs SERVICE=worker SINCE=1h LINES=200   # server | worker | static | traefik → devops/logs/
make backend-log-files NAME='import-*'  # файловые логи (импорт поставщиков, 1С, фиды) → devops/logs/files-*/

make db-backup                          # бэкап сейчас (DOWNLOAD=1 — ещё и в devops/dumps)
make db-backups                         # бэкапы на сервере
make db-restore FILE=medusa-2026-10-04-0315.dump   # или путь к локальному .dump; спросит подтверждение

make infra-site                         # привести серверы к описанному состоянию (идемпотентно)
make infra-check                        # что изменит infra-site (--check --diff), ничего не меняя
make infra-data TAGS=rabbitmq           # один сервис из data.yml
make infra-lint                         # ansible-lint + syntax-check
```

- `backend-exec`, `backend-seed` и `backend-user` запускают разовый контейнер `backend-tools`: тот же образ и env,
  что у worker, с volumes загрузок, обмена и логов. Скрипты в образе собраны в `.js` (`./src/scripts/<имя>.js`).
- `db-restore` перед восстановлением делает бэкап текущего состояния, останавливает backend и worker, пересоздаёт
  БД, восстанавливает дамп, сбрасывает Redis (кэш Query и очереди относятся к старой БД), прогоняет миграции и ждёт
  `healthy`.
- Логи контейнеров (`backend-logs`) пишутся целиком в `devops/logs/` (в git не попадает), в консоль — последние
  строки. `SERVICE=traefik` — access-лог traefik хоста backend (JSON).

Откат — деплой предыдущего тега (`sha-…` есть в GHCR) или Re-run старого запуска Deploy в GitHub.
Учтите: миграции БД назад не откатываются.

Доступа к БД снаружи нет: данные — `make pull-db` (ниже), разовые запросы — скриптом через `make backend-exec`.

## Бэкапы

Каждую ночь cron делает дампы в `/opt/<project>/backups` и хранит `backup_keep_days` (7) дней:
PostgreSQL — `pg_dump -Fc` в 03:15.
Бэкап сейчас, список и восстановление — `make db-backup`, `make db-backups`, `make db-restore FILE=…`.

Бэкапы лежат на том же сервере. Для прода добавьте копирование наружу (S3 / rclone / restic).

## Выгрузка с прода на локальную машину

Аналог `dl deploy`: БД и загрузки Medusa скачиваются в `devops/dumps/` (в git не попадает)
и сразу импортируются в локальное окружение (`make dev-up`).

```bash
make pull                                   # БД + картинки товаров
make pull-db                                # только БД
make pull-db EXCLUDE=order,cart_*           # ещё без данных этих таблиц (на один раз)
make pull-db TABLES=product,product_variant # только эти таблицы, остальная локальная БД не трогается
make pull-files                             # только загрузки → backend/static
```

- Структура всех таблиц выгружается всегда, данные таблиц из `pull_excluded_tables` (group_vars) — нет.
  По умолчанию это журнал воркфлоу, уведомления и `auth_identity` / `provider_identity`, то есть логины и хеши
  паролей: персональные данные не уезжают на ноутбуки (152-ФЗ).
- Полный дамп пересоздаёт локальную БД. `TABLES=…` заменяет только строки этих таблиц, остальная база
  (и ваш локальный админ) остаётся; схема должна совпадать — локально применены те же миграции.
- Ссылки на картинки в БД (`https://api.<домен>/static/…`) при импорте переписываются на `http://localhost:9000/static/…`,
  сами файлы приносит `make pull-files`.
- Войти под админом с прода локально нельзя (логины не выгружаются). Создайте своего с e-mail, которого нет на проде:
  `cd backend && pnpm user:create -e dev@localhost -p <пароль>`.
- После полного импорта скрипт печатает publishable key прода — пропишите его в `frontend/.env.local`.
- Исключили таблицу, на которую ссылаются другие (например `order`), — исключайте и зависимые шаблоном: `EXCLUDE='order*'`.
- Импортировать уже скачанный файл: `devops/scripts/db-import.sh devops/dumps/postgres-….dump`.

## Новый магазин сети

Магазин создаётся в админке Medusa («Магазины» → создать): канал продаж, publishable-ключ, корневая категория,
секрет вебхука ревалидации. Деплой бэкенда не нужен. Фронт магазина из своего репозитория — запись в inventory и
одна команда (шаг 9 плана: роль `storefront`, список `storefronts:`). Пока фронт в inventory один — `olisa`
(`frontend_domain`, `storefront_slug`).

Staging — копия `inventories/production` в `inventories/staging`, команды с `INVENTORY=staging`.

## Переход со схемы «один магазин» (olisa-*)

Имена контейнеров, volume и каталогов теперь от `project_name: snowaa` (`/opt/snowaa`, `snowaa-postgres-data`…),
фронт — `olisa-frontend`, API — на домене сети. Старый стек `/opt/olisa` сам не переезжает: до релиза данные не
нужны (план, «режим разработки»), поэтому сервер поднимается заново — `make infra-site` на чистом сервере. Если на
сервере уже работал стек `olisa-*`, остановите его до деплоя новой схемы (`make prod-down` со старой версией
репозитория) — иначе два traefik будут спорить за порты 80/443.

## Где что настраивать

| Что | Где |
|---|---|
| Хосты и их роли (`backend`, `storefronts`) | `inventories/<env>/hosts.yml` |
| Домен сети, домен витрины, ключи, флаги сервисов, подключения | `inventories/<env>/group_vars/all/main.yml` |
| Пароли и секреты | `inventories/<env>/group_vars/all/vault.yml` (ansible-vault) |
| Переменные окружения Medusa (ЮKassa, СДЭК…) | `backend_env` (несекретные), `vault_backend_env` (секретные) |
| Переменные Next.js в рантайме | `frontend_env` (`NEXT_PUBLIC_*` вшиваются при сборке образа) |
| Версии образов, тюнинг БД, таймауты, HSTS, лимиты запросов, CSP API и админки | `roles/*/defaults/main.yml` (переопределяются в group_vars) |
| CSP витрины (Метрика, платёжки, CDN) | `frontend_env`: `CSP_SCRIPT_SRC`, `CSP_CONNECT_SRC`, `CSP_IMG_SRC`, `CSP_FRAME_SRC`, `CSP_FORM_ACTION`, `CSP_FRAME_ANCESTORS` |
| Зеркала Docker Hub (если он недоступен с сервера) | `docker_registry_mirrors` |
| CDN перед сервером (доверенные X-Forwarded-For) | `traefik_trusted_ips` |
| Тестовый CA Let's Encrypt (без лимитов) | `traefik_acme_staging: true` |

## Подводные камни

- **Пароли БД и RabbitMQ применяются только при первой инициализации volume.** Если поменять их в vault позже,
  сначала смените пароль в самой БД (`ALTER USER`, `rabbitmqctl change_password`), потом деплойте.
- В паролях из vault, которые попадают в URL подключений, — только `[A-Za-z0-9]` (`make infra-vault` генерирует hex).
- Docker публикует порты в обход UFW — наружу публикует только Traefik (80/443), не добавляйте `ports:` БД.
- Мажорную версию PostgreSQL меняйте только через дамп/восстановление.
- `deploy_authorized_keys` эксклюзивный: ключ, которого нет в списке, удаляется с сервера.
- CSP `frame-ancestors` витрины по умолчанию разрешает Вебвизор Яндекс Метрики (`CSP_FRAME_ANCESTORS` заменяет список).
- Новый внешний скрипт или виджет не работает — почти всегда это CSP: смотрите консоль браузера и дополните `CSP_*`.
- Пароль Vault Ansible берёт из `ANSIBLE_VAULT_PASSWORD_FILE=vault-pass.sh` — его подставляют Makefile и CI.
  При ручном `ansible-playbook` экспортируйте его сами.

## Инструкции и документация

| Тема | Ссылка |
|---|---|
| Ansible: установка, inventory, vault | [docs.ansible.com](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html), [Vault](https://docs.ansible.com/ansible/latest/vault_guide/index.html) |
| Коллекция community.docker | [docs.ansible.com/…/community/docker](https://docs.ansible.com/ansible/latest/collections/community/docker/index.html) |
| Traefik v3: Docker, Let's Encrypt, middlewares | [doc.traefik.io](https://doc.traefik.io/traefik/), [ACME](https://doc.traefik.io/traefik/https/acme/), [Headers](https://doc.traefik.io/traefik/middlewares/http/headers/), [RateLimit](https://doc.traefik.io/traefik/middlewares/http/ratelimit/) |
| Docker Engine на Ubuntu | [docs.docker.com/engine/install/ubuntu](https://docs.docker.com/engine/install/ubuntu/) |
| Medusa: деплой, конфиг, файлы | [docs.medusajs.com/learn/deployment](https://docs.medusajs.com/learn/deployment), [medusa-config](https://docs.medusajs.com/learn/configurations/medusa-config), [Local File](https://docs.medusajs.com/resources/infrastructure-modules/file/local) |
| Next.js: CSP, self-hosting | [CSP](https://nextjs.org/docs/app/guides/content-security-policy), [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting) |
| GitHub Actions: окружения и секреты, GHCR | [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment), [GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) |
| Проверка безопасности | [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory), [SSL Labs](https://www.ssllabs.com/ssltest/), [securityheaders.com](https://securityheaders.com), [CSP Evaluator](https://csp-evaluator.withgoogle.com) |
| Заголовки безопасности | [MDN: Practical security implementation guides](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides), [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/) |
| Настройка SSH-ключей | [GitHub: генерация SSH-ключа](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) |
