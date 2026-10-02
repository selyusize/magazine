# Правила реализации бэкенда (Medusa 2, TypeScript)

Единые правила разработки бэкенда магазина на Medusa 2.21. Все новые реализации должны им соответствовать.
Если правило расходится с документацией Medusa, побеждает документация, а этот файл нужно поправить.

---

## 1. Стек и общая архитектура

- **Платформа**: Medusa 2.21 (Node.js ≥ 20.19, TypeScript), PostgreSQL, Redis, pnpm.
- **Конфигурация**: `medusa-config.ts` + переменные окружения (`.env`, шаблон — `.env.template`).
  Новая переменная окружения обязательно добавляется в `.env.template` с комментарием.
- **DI‑контейнер**: встроенный контейнер Medusa (awilix). Свой контейнер, синглтоны и глобальные переменные не заводим.
- **Процессы**: `MEDUSA_WORKER_MODE` = `server` (HTTP API + админка) / `worker` (подписчики, jobs, workflows) / `shared` (dev).
  Код не должен полагаться на состояние в памяти процесса: server и worker — разные контейнеры.

### Соответствие слоёв

| Задача                                  | Где живёт                                   | Аналог в «классическом» DDD |
|-----------------------------------------|---------------------------------------------|-----------------------------|
| HTTP‑эндпоинт                           | `src/api/{store,admin}/.../route.ts`        | Action                      |
| Валидация входа                         | `src/api/.../validators.ts` (zod) + `src/api/middlewares.ts` | —              |
| Изменение данных (use‑case)             | `src/workflows/{domain}/` — workflow + steps | Command + Handler          |
| Чтение данных                           | `query.graph(...)` / `useQueryGraphStep`     | Query + Fetcher            |
| Сущности и хранение                     | `src/modules/{domain}/models/` + сервис модуля | Entity + Repository      |
| Связи между модулями                    | `src/links/`                                | —                           |
| Реакция на события                      | `src/subscribers/`                          | Listener + EventRegister    |
| Задачи по расписанию                    | `src/jobs/`                                 | —                           |
| Интеграции (почта, оплата, доставка)    | провайдеры модулей в `src/modules/{provider}/` | инфраструктурный сервис  |
| Общие хелперы без состояния             | `src/lib/`                                  | —                           |
| Расширения админки                      | `src/admin/`                                | вёрстка                     |

### Границы

- Внешний мир (HTTP, события, расписание) меняет данные **только через workflows**. Роут, подписчик и job не вызывают
  `create*/update*/delete*` сервисов модулей напрямую.
- Чтение — через **Query** (`ContainerRegistrationKeys.QUERY`), а не через сервисы модулей, когда нужны данные
  нескольких модулей или связи.
- Модуль изолирован: не импортирует сервисы, модели и типы других модулей и не ходит в их таблицы.
  Связь между модулями — только через `defineLink` в `src/links/`, оркестрация — только в workflows.
- Прямой SQL / Knex / MikroORM `EntityManager` вне сервиса своего модуля запрещены.

---

## 2. Структура домена

Новый домен повторяет эту раскладку (пример — домен `loyalty`):

```
src/
  modules/loyalty/
    index.ts              # Module(LOYALTY_MODULE, { service })
    service.ts            # LoyaltyModuleService extends MedusaService({ ... })
    models/
      loyalty-account.ts  # model.define(...)
    migrations/           # генерируется: pnpm medusa db:generate loyalty
  links/
    customer-loyalty-account.ts
  workflows/loyalty/
    steps/
      create-loyalty-account.ts
    create-loyalty-account.ts
  api/store/loyalty/
    route.ts
    validators.ts
  subscribers/
    customer-created-loyalty.ts
  jobs/
    expire-loyalty-points.ts
```

- Имена файлов и папок — kebab-case. Один файл — одна сущность / один step / один workflow / один подписчик.
- Модуль регистрируется в `medusa-config.ts` в `modules: [...]`, провайдер — в `providers` своего модуля
  (пример — `src/modules/smtp` в `notificationModule`).

---

## 3. HTTP‑слой (API routes)

- **Расположение**: `src/api/store/{domain}/route.ts` — витрина, `src/api/admin/{domain}/route.ts` — админка.
  Динамические сегменты — папки `[id]`.
- **Обработчик** — экспортируемая функция с именем метода (`GET`, `POST`, `DELETE`), типизированная
  `MedusaRequest<Body>` / `MedusaResponse`.
- **Структура обработчика**:
  1. Берём уже провалидированные данные: `req.validatedBody`, `req.validatedQuery`, `req.params`,
     для авторизованного покупателя — `req.auth_context.actor_id`.
  2. Изменение — запускаем workflow: `await createLoyaltyAccountWorkflow(req.scope).run({ input: { ... } })`.
     Чтение — `req.scope.resolve(ContainerRegistrationKeys.QUERY).graph({ ... })`.
  3. Отдаём результат `res.json({ loyalty_account: result })` — объект с именованным ключом в snake_case, как в
     Store API Medusa (это ожидает фронтовый клиент).
- **Валидация**: zod‑схема в `validators.ts` рядом с роутом, подключается в `src/api/middlewares.ts` через
  `validateAndTransformBody(Schema)` / `validateAndTransformQuery(Schema, config)`.
  Ручных проверок тела запроса в обработчике нет.
- **Авторизация**: через middleware `authenticate("customer", ["session", "bearer"])` в `middlewares.ts`,
  а не проверками внутри роута.
- **Ошибки**: `try-catch` в роутах **не пишем**. Бросаем (или пропускаем из workflow) `MedusaError` —
  обработчик ошибок Medusa сам превратит её в ответ с нужным статусом:
  - `INVALID_DATA`, `NOT_ALLOWED` → 400, `UNAUTHORIZED` → 401, `FORBIDDEN` → 403, `NOT_FOUND` → 404,
    `DUPLICATE_ERROR` → 422, `UNEXPECTED_STATE` и прочее → 500.
  - `CONFLICT` (409) не используем для бизнес‑ошибок: Medusa подменяет его текст на сообщение про Idempotency-Key.
- **OpenAPI**: каждый store‑роут, который нужен витрине, получает JSDoc‑блок `@oas` (пример —
  `src/api/store/custom/route.ts`), после чего `pnpm openapi:generate` и коммит `openapi/store.oas.json`.
  Роут без `@oas` во фронтовый клиент (Orval) не попадёт.

```ts
export async function POST(req: MedusaRequest<CreateLoyaltyAccountBody>, res: MedusaResponse) {
  const { result } = await createLoyaltyAccountWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, source: req.validatedBody.source },
  });
  res.json({ loyalty_account: result });
}
```

---

## 4. Изменение данных: workflows и steps

Workflow — это use‑case (аналог Command + Handler). Только он меняет данные.

- **Расположение**: `src/workflows/{domain}/{use-case}.ts`, шаги — `src/workflows/{domain}/steps/{step}.ts`.
- **Имена**: `createLoyaltyAccountWorkflow` / `createLoyaltyAccountStep`, строковый id — kebab-case,
  совпадает с именем файла: `createWorkflow("create-loyalty-account", ...)`.
- **Вход**: типизированный объект `XxxWorkflowInput` (экспортируется), поля в snake_case — как во всей Medusa.
  Это DTO без логики.
- **Step**:
  - Делает одно действие: резолвит сервис модуля из `container` и вызывает его метод.
  - Возвращает `new StepResponse(result, compensationInput)`.
  - Если step что‑то создаёт/меняет во внешнем мире — обязательно пишем **компенсацию** (третий аргумент
    `createStep`), откатывающую изменение. Без компенсации допустимы только чтения и идемпотентные действия.
  - Бизнес‑проверки (нельзя списать больше баллов, чем есть) — здесь или в методе сервиса модуля,
    ошибка — `MedusaError`.
- **Workflow (композиция)**:
  - Функция композиции синхронная и декларативная: внутри нет `async/await`, `if`, циклов и операций над
    значениями шагов. Преобразования — `transform(...)`, условия — `when(...)`.
  - Возвращает `new WorkflowResponse(result)`.
  - Сначала переиспользуем готовые workflows и steps Medusa (`@medusajs/medusa/core-flows`), свои пишем только
    когда готового нет.
  - Расширение чужой логики — через hooks готовых workflows, а не копированием workflow.
- **Ссылки между модулями** создаются в workflow шагом `createRemoteLinkStep` / `link.create`, не в сервисе модуля.

```ts
export const createLoyaltyAccountStep = createStep(
  "create-loyalty-account",
  async (input: CreateLoyaltyAccountStepInput, { container }) => {
    const loyalty: LoyaltyModuleService = container.resolve(LOYALTY_MODULE);
    const account = await loyalty.createLoyaltyAccounts(input);
    return new StepResponse(account, account.id);
  },
  async (accountId, { container }) => {
    if (!accountId) return;
    const loyalty: LoyaltyModuleService = container.resolve(LOYALTY_MODULE);
    await loyalty.deleteLoyaltyAccounts(accountId);
  },
);
```

---

## 5. Чтение данных: Query

Аналог Query + Fetcher.

- Чтение для HTTP, подписчиков и jobs — через `query.graph({ entity, fields, filters, pagination })`
  (пример — `src/subscribers/order-placed.ts`). Внутри workflow — `useQueryGraphStep`.
- `fields` перечисляем явно — только то, что нужно потребителю. `*` и «на всякий случай» не используем.
  Если список полей длинный или переиспользуется — выносим в константу `XXX_FIELDS` (как `PRODUCT_GRAPH_FIELDS`
  в `src/search/product.ts`).
- Для витрины выборка ограничивается публикуемыми данными (статус, sales channel), если роут не идёт через
  стандартные middleware Medusa, которые делают это сами.
- Цены считаются через `QueryContext({ currency_code, region_id, ... })`, а не вручную.
- Результат нормализуем к плоскому DTO отдельной чистой функцией `toXxx(row)` (как `toDocument` в
  `src/search/product.ts`) — это проще тестировать.
- Если результат обязан существовать — проверяем и бросаем `MedusaError(NOT_FOUND, ...)`;
  если может отсутствовать — возвращаем `null` / пустой массив и обрабатываем у потребителя.

---

## 6. Модели данных (Data Models)

Аналог Entity.

- **Расположение**: `src/modules/{domain}/models/{entity}.ts`, экспорт по умолчанию — `model.define("{entity}", {...})`.
  Имя таблицы — snake_case в единственном числе.
- **Идентификатор**: `id: model.id({ prefix: "lact" }).primaryKey()` — строковый id с коротким префиксом домена.
- Поля описываем только через DSL `model.*`, с явными `.nullable()`, `.default()`, `.index()`, `enum` для статусов.
  Деньги — `model.bigNumber()`, произвольные данные — `model.json()`. `created_at/updated_at/deleted_at`
  Medusa добавляет сама.
- Связи внутри модуля — `model.hasMany` / `model.belongsTo`; с сущностями **других** модулей — только через
  `src/links/` (в модели храним максимум внешний id, если он нужен для фильтрации).
- В модели нет логики, хуков и валидации. Бизнес‑правила — в сервисе модуля или в step.
- Любое изменение модели → миграция: `pnpm medusa db:generate {module}`, затем `pnpm db:migrate`.
  Сгенерированные миграции коммитим, руками не правим без необходимости.

---

## 7. Сервис модуля

Аналог Repository + доменного сервиса.

- **Расположение**: `src/modules/{domain}/service.ts`, класс `{Domain}ModuleService extends MedusaService({ ...models })`.
  Имя модуля — константа `{DOMAIN}_MODULE = "{domain}"` в `index.ts`.
- **Сгенерированные методы** используем как есть, не дублируем:
  - `retrieveXxx(id)` — обязан найти, иначе `NOT_FOUND`;
  - `listXxxs(filters, config)` / `listAndCountXxxs(...)` — может вернуть пустой массив;
  - `createXxxs`, `updateXxxs`, `deleteXxxs`, `softDeleteXxxs`, `restoreXxxs`.
- **Свои методы** — только доменная логика, которой нет в сгенерированных. Нейминг:
  - `get...` — обязан вернуть результат, при отсутствии бросает `MedusaError(MedusaError.Types.NOT_FOUND, "...")`;
  - `find...` — может не найти, возвращает `null` / пустой массив;
  - методы с запросами к БД — с декораторами `@InjectManager()` / `@InjectTransactionManager()` и последним
    параметром `@MedusaContext() sharedContext: Context = {}`.
- **Зависимости** — через конструктор из контейнера модуля (`logger`, опции модуля). Сервисы других модулей
  в модуль не инжектим (см. изоляцию в п.1).
- Опции модуля проверяем в `static validateOptions` (пример — `SmtpNotificationService`), а не при каждом вызове.
- `try-catch` в сервисе модуля не используем. Исключение — провайдеры внешних интеграций (см. п.8).

---

## 8. Провайдеры интеграций

Почта, оплата (ЮKassa/СБП), доставка (СДЭК), файлы — это провайдеры встроенных модулей Medusa
(`AbstractNotificationProviderService`, `AbstractPaymentProvider`, `AbstractFulfillmentProviderService`, ...).

- **Расположение**: `src/modules/{provider}/` — `index.ts` с `ModuleProvider(Modules.X, { services: [...] })`,
  `service.ts` с классом провайдера (эталон — `src/modules/smtp`).
- Параметры — только через `options` из `medusa-config.ts`, которые берутся из env. Секреты в коде не храним.
- Провайдер подключается условно: без нужной env‑переменной магазин работает на заглушке
  (как `notification-local` без `SMTP_HOST`).
- Здесь `try-catch` **допустим**: ловим ошибку внешнего API, логируем с контекстом и бросаем `MedusaError`
  с понятным русским сообщением, не протаскивая наружу сырые ошибки SDK.

---

## 9. События и подписчики

Аналог Listener + EventRegister.

- **Расположение**: `src/subscribers/{event-or-purpose}.ts`. Регистрации событий отдельно нет — файл экспортирует
  `config: SubscriberConfig = { event: "order.placed" }`.
- Обработчик — именованная `export default async function` с говорящим именем (`orderPlacedEmail`).
- Из события берём только нужные данные (`event.data.id`), дочитываем остальное через Query и
  **передаём в workflow отдельными полями**, не пробрасывая объект события целиком.
- Подписчик не меняет данные напрямую — только запускает workflow (отправка письма через `sendEmail` из
  `src/lib/email.ts` — допустимое исключение: это сам модуль Notification).
- Подписчики выполняются в worker и могут быть доставлены повторно — логика должна быть идемпотентной.
- Свои события публикуем из workflow шагом `emitEventStep`, имя — `{domain}.{past-tense}`
  (`loyalty-account.created`).
- `try-catch` в подписчике — только при итеративной обработке (пачка записей), чтобы ошибка одной не останавливала
  остальные; ошибку логируем.

## 10. Задачи по расписанию (jobs)

- **Расположение**: `src/jobs/{purpose}.ts`, `export default async function` + `export const config = { name, schedule }`.
- Job, как и подписчик, только читает через Query и запускает workflows. Работает в worker, должен быть идемпотентным.

---

## 11. Ошибки и логирование

- **Ошибки**: только `MedusaError` с подходящим `MedusaError.Types.*`. Голые `Error`, `throw "строка"` и
  свои классы ошибок не используем.
- **Сообщения ошибок** — на русском, конкретные, с контекстом: `"Аккаунт лояльности для покупателя cus_123 не найден"`.
  Их видят и разработчик, и (через маппинг на фронте) покупатель.
- **`try-catch`** допустим только в: провайдерах интеграций (п.8), итеративной обработке в подписчиках/jobs/скриптах.
  В роутах, workflows, steps, моделях и сервисах модулей — нет. Компенсацию в workflow делает Medusa,
  а не `catch`.
- **Логирование**: только через логгер Medusa — `container.resolve(ContainerRegistrationKeys.LOGGER)` или
  `logger` из конструктора модуля. `console.*` в коде не оставляем.
  Сообщение начинается с префикса `{домен}/{use-case}:` — например
  ``logger.error(`loyalty/expire-points: не удалось списать баллы ${id}: ${error.message}`)``.

---

## 12. Стиль кода и соглашения

- **TypeScript**: `strictNullChecks` включён; у экспортируемых функций и методов — явные типы параметров,
  возвращаемый тип — когда он не очевиден из тела. `any` не используем: `unknown` + сужение или точный тип.
  Типы импортируем через `import type`.
- **Нейминг**:
  - поля DTO, входов workflow, моделей и JSON‑ответов — snake_case (контракт Medusa и фронтового клиента);
  - переменные, функции, классы — camelCase / PascalCase;
  - файлы — kebab-case; константы‑списки — `UPPER_SNAKE_CASE`.
- **Объект вместо позиционных параметров**: функции с двумя и более смысловыми параметрами принимают объект
  (`sendEmail(container, { to, template, data })`) — аналог именованных аргументов.
- **Иммутабельность**: результаты Query и входы шагов не мутируем, собираем новые объекты.
- **Комментарии**: JSDoc на русском над экспортируемыми сущностями — зачем она и где подключается
  (как в `src/modules/smtp/index.ts`). Комментарии объясняют «почему», а не пересказывают код.
- **Чистота**: неиспользуемые импорты и мёртвый код удаляем; `pnpm lint` (eslint‑конфиг Medusa) и prettier
  должны проходить.
- **Без глобального состояния**: зависимости — только из контейнера; модульные переменные — только для констант
  и чтения env на старте (как `shopUrls` в `src/lib/email.ts`).

---

## 13. Поток обработки запроса

1. `POST /store/loyalty` попадает в роут `src/api/store/loyalty/route.ts`.
2. Middleware из `src/api/middlewares.ts`: CORS, `authenticate`, `validateAndTransformBody` (zod).
3. Роут запускает workflow с данными из `req.validatedBody` и `req.auth_context`.
4. Workflow вызывает steps → steps вызывают сервисы модулей → сервисы пишут в свои таблицы через MikroORM.
   При ошибке Medusa откатывает выполненные шаги их компенсациями.
5. Workflow публикует события → подписчики в worker реагируют (письма, индексация поиска и т.п.).
6. Роут отдаёт `res.json({ ... })`; ошибка `MedusaError` превращается в ответ с нужным HTTP‑статусом.

---

## 14. Тесты

- Чистые функции (маппинг `toXxx`, расчёты цен, шаблоны писем) — unit‑тесты рядом с кодом в `__tests__/`,
  `pnpm test:unit`.
- Сервис модуля — `pnpm test:integration:modules` (`moduleIntegrationTestRunner`).
- Роуты и workflows end‑to‑end — `integration-tests/http/`, `pnpm test:integration:http` (`medusaIntegrationTestRunner`).
- Новый роут для витрины без интеграционного теста не считается готовым.

---

## 15. Админка и представления

- Расширения админки — только в `src/admin/` (`widgets/`, `routes/`, `i18n/`), на `@medusajs/ui` и `@medusajs/admin-sdk`.
- Админка не содержит бизнес‑логики и не ходит в БД: только вызовы Admin API (`/admin/...`), в том числе своих
  роутов из `src/api/admin/`.
- HTML писем — в шаблонах провайдера (`src/modules/smtp/templates.ts`), не в подписчиках и workflows.
- Витрина (`frontend/`) общается с бэкендом только через Store API и сгенерированный по `openapi/store.oas.json` клиент.

---

## 16. Запрещено / обязательно

**Запрещено**:
- Менять данные из роутов, подписчиков и jobs в обход workflows.
- Импортировать сервисы/модели одного модуля в другой; связывать модули иначе, чем через `src/links/`.
- Писать SQL и ходить в чужие таблицы вне сервиса своего модуля.
- `try-catch` в роутах, workflows, steps и сервисах модулей (кроме провайдеров интеграций).
- Логику и валидацию в моделях; ручную валидацию тела запроса в роуте.
- `console.*`, `any`, секреты и адреса в коде вместо env.
- Пробрасывать в workflow объект события или `req` целиком — только нужные поля.

**Обязательно**:
- Новый домен — по раскладке из п.2: `models` → `service` → `index` → `links` → `workflows/steps` → `api` →
  `subscribers`/`jobs`.
- Сначала искать готовое в Medusa (core-flows, встроенные модули, провайдеры), потом писать своё.
- Компенсация для каждого step, который что‑то меняет.
- Миграция для каждого изменения модели, `@oas` + `pnpm openapi:generate` для каждого store‑роута витрины.
- Новые env‑переменные — в `.env.template`, новый модуль/провайдер — в `medusa-config.ts`.
