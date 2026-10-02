# Правила реализации бэкенда (Medusa 2, TypeScript)

Единые правила разработки бэкенда магазина на Medusa 2.21. Все новые реализации должны им соответствовать.
Если правило расходится с поведением Medusa, побеждает Medusa, а этот файл нужно поправить.

---

## 1. Стек и общая идея

- **Платформа**: Medusa 2.21 (Node.js ≥ 20.19, TypeScript), PostgreSQL, Redis, pnpm.
- **Конфигурация**: `medusa-config.ts` + переменные окружения (`.env`, шаблон — `.env.template`).
- **DI‑контейнер**: контейнер Medusa (`req.scope`, `container` в подписчиках и jobs). Свой контейнер, синглтоны и
  глобальные переменные не заводим.
- **Процессы**: `MEDUSA_WORKER_MODE` = `server` (HTTP API + админка) / `worker` (подписчики, jobs) / `shared` (dev).
  Код не хранит состояние в памяти процесса: server и worker — разные контейнеры.

### Слои

Внешний мир общается с модулем только через три входа:

| Вход        | Что делает                                     | Где лежит                                   |
|-------------|------------------------------------------------|---------------------------------------------|
| **Action**  | принимает HTTP‑запрос, отдаёт ответ            | `src/modules/{module}/action/{use-case}/`   |
| **Command** | меняет данные (создать, изменить, удалить)     | `src/modules/{module}/command/{use-case}/`  |
| **Query**   | читает данные                                  | `src/modules/{module}/query/{use-case}/`    |

Маршруты, подписчики и jobs — тонкие точки входа, которые Medusa ищет в фиксированных папках
(`src/api`, `src/subscribers`, `src/jobs`). Логики в них нет: они только создают Action / Handler / Fetcher и
передают им данные.

```text
HTTP ──▶ src/api/store/.../route.ts ──▶ Action ──▶ Handler (command) ──▶ workflow ──▶ steps ──▶ сервис модуля ──▶ БД
                                           └─────▶ Fetcher (query) ──▶ Query Medusa ──▶ БД
Событие ──▶ src/subscribers/*.ts ──▶ Handler / Fetcher
Расписание ──▶ src/jobs/*.ts ──▶ Handler / Fetcher
```

### Что такое workflow

Workflow в Medusa — это сценарий (use‑case) из шагов (steps). У каждого шага есть откат (компенсация): если упал
третий шаг, Medusa сама откатит первые два. Ещё workflow умеет повторы, долгие процессы и переживает рестарт worker.

Напрямую с workflow мы не работаем: его прячет класс‑обёртка **Handler** (см. п.5). Снаружи это обычный
`handler.handle(command)`, внутри — workflow с шагами и откатом.

---

## 2. Нейминг

- **Простые и понятные имена по схеме «что делаем — из чего / для чего»**:
  `get-user-by-id`, `get-reviews-by-product-id`, `create-review-for-product`, `create-order-from-cart`,
  `send-email-by-template`. Имя use‑case одинаковое в папке action, command/query, классах и роуте.
- **Классы и типы** — PascalCase из имени use‑case + роль: `GetUserByIdFetcher`, `CreateReviewForProductHandler`,
  `CreateReviewForProductAction`, `CreateReviewForProductCommand`, `GetUserByIdQuery`. DTO — имя данных + `DTO`:
  `ReviewDTO`, `CreatedReviewDTO`, `UserDTO`.
- **Аббревиатуры — капслоком**: `SMTP`, `API`, `HTTP`, `URL`, `SKU`, `DTO`, `JSON`, `OTP`.
  Примеры: `SMTP`, `SMTPMessage`, `getProductBySKU`, `ReviewDTO`, `API_URL`.
  **Исключение — `Id`**: `getUserById`, `customerId`.
- **Поля DTO, входов команд и JSON‑ответов** — snake_case (`customer_id`, `product_id`): это контракт Medusa и
  сгенерированного фронтового клиента. Переменные и методы — camelCase.
- **Файлы и папки** — kebab-case. Константы‑списки — `UPPER_SNAKE_CASE`.
- **Id workflow** — имя use‑case, совпадает с именем папки: `createWorkflow("create-review-for-product", ...)`
  (это проверяет линтер Medusa). **Id шага** — имя файла шага: `createStep("create-review", ...)`. Оба глобально
  уникальны, поэтому имя use‑case должно быть конкретным (`send-email-by-template`, а не `send`).

---

## 3. Структура модуля

Модуль — это домен магазина (`review`, `loyalty`, `delivery`). Раскладка всегда одна:

```text
src/
  shared/                                  # общий слой для всех модулей (п.4)
  modules/review/
    index.ts                               # Module(REVIEW_MODULE, { service: ReviewModuleService })
    entity/
      review.ts                            # model.define(...) + тип ReviewEntity
    models/
      review.ts                            # export * from "../entity/review" — только для Medusa
    service/
      review-module-service.ts             # ReviewModuleService extends MedusaService({ Review })
    command/
      create-review-for-product/
        command.ts                         # CreateReviewForProductCommand — вход
        dto.ts                             # CreatedReviewDTO — что возвращает handler
        handler.ts                         # CreateReviewForProductHandler extends AbstractCommandHandler
        workflow.ts                        # createReviewForProductWorkflow
        step/
          create-review.ts                 # createReviewStep (+ откат)
    query/
      get-reviews-by-product-id/
        query.ts                           # GetReviewsByProductIdQuery — вход
        dto.ts                             # ReviewDTO — что возвращает fetcher
        fetcher.ts                         # GetReviewsByProductIdFetcher extends AbstractFetcher
    action/
      create-review-for-product/
        action.ts                          # CreateReviewForProductAction implements Action
        schema.ts                          # zod-схема тела запроса
      get-reviews-by-product-id/
        action.ts
    migrations/                            # генерируется: pnpm medusa db:generate review
  api/store/products/[id]/reviews/
    route.ts                               # GET, POST → Action
    middleware.ts                          # авторизация + валидация этого маршрута
  api/middlewares.ts                       # собирает все middleware.ts
  subscribers/                             # тонкие подписчики → Handler / Fetcher
  jobs/                                    # тонкие задачи → Handler / Fetcher
  links/                                   # связи между модулями (defineLink)
  container/                               # контейнер приложения (п.4)
    index.ts                               # export const Container = createContainer(dependencies)
    dependencies.ts                        # собирает все common/*.ts
    common/
      review.ts                            # define(...) для классов модуля review
```

Рабочий пример инфраструктурного сервиса — `src/shared/smtp/service/smtp.ts` и его определение
`src/container/common/smtp.ts` (п.4, «Инфраструктурные сервисы»).

- **`entity/` и `models/`.** Сущности пишем в `entity/`. Medusa ищет модели только в папке `models/`, поэтому на
  каждую сущность там лежит однострочный реэкспорт `export * from "../entity/review";` (файл `models/index.ts`
  Medusa игнорирует — нужен файл на сущность).
- **DTO лежит в папке той команды или того фетчера, который его возвращает** (`dto.ts`). Общей папки `dto/`
  на модуль нет: каждый use‑case владеет своим выходом и отдаёт только нужные ему поля.
- **Модуль без своих таблиц** (например, своя логика вокруг заказов Medusa) содержит только
  `command/`, `query/`, `action/` и `service/` — без `index.ts`, `entity/` и регистрации в `medusa-config.ts`.
- Модуль с таблицами регистрируется в `medusa-config.ts` в `modules: [...]`.
- HTTP‑маршруты в модуль **не кладём** — они в `src/api/store/...` и `src/api/admin/...` (п.9).

---

## 4. Общий слой `src/shared`

Базовые классы и контракты, по которым пишутся все модули. Модули зависят от `shared`, `shared` — ни от одного модуля.

```text
src/shared/
  contract/                     # только интерфейсы и типы, без реализации
    dto.ts                      # DTO
    command.ts                  # Command (+ JSONValue)
    query.ts                    # Query
    command-handler.ts          # CommandHandler: handle(command: Command)
    fetcher.ts                  # Fetcher: fetch(query: Query)
    action.ts                   # Action: handle(req, res)
  command/
    abstract-command-handler.ts # обёртка над workflow
  query/
    abstract-fetcher.ts         # доступ к Query Medusa
  container/
    injectable.ts               # @Injectable(), @InjectContainer()
    container.ts                # createContainer(), define()
  smtp/
    service/
      smtp.ts                   # SMTP.send(message) — инфраструктурный сервис
```

### Контракты данных: DTO, Command, Query

DTO (Data Transfer Object) — **только поля с данными**: без методов, конструкторов, геттеров и значений по умолчанию.
Command и Query — тоже DTO, но строже: только то, что переживает JSON (workflow хранит вход команды в Redis/БД),
поэтому даты в них — ISO‑строкой.

Контракты проверяются компилятором: тип с методом не проходит как `DTO`, `Date` не проходит как `Command`.
Поэтому DTO, Command и Query объявляем **только через `type`** — `interface` и `class` контракт не пройдут.

```ts
// shared/contract/dto.ts
/** Значение поля DTO: только данные. Функция (метод) сюда не подходит. */
export type DTOValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | readonly DTOValue[]
  | { readonly [key: string]: DTOValue };

/**
 * Data Transfer Object: только поля с данными — без методов, конструкторов и значений по умолчанию.
 * Объявляется через `type` (не `interface` и не `class`), иначе не пройдёт этот контракт.
 */
export type DTO = { readonly [key: string]: DTOValue };
```

```ts
// shared/contract/command.ts
/** Значение поля команды или запроса: только то, что переживает JSON (даты — ISO-строкой). */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly JSONValue[]
  | { readonly [key: string]: JSONValue };

/** Команда — DTO на изменение данных. Сериализуется: workflow хранит вход в Redis/БД. */
export type Command = { readonly [key: string]: JSONValue };
```

```ts
// shared/contract/query.ts
import type { JSONValue } from "./command";

/** Запрос — DTO на чтение данных. */
export type Query = { readonly [key: string]: JSONValue };
```

### Контракты обработчиков: CommandHandler, Fetcher, Action

```ts
// shared/contract/command-handler.ts
import type { Command } from "./command";
import type { DTO } from "./dto";

/** Обработчик команды: принимает Command, возвращает DTO, массив DTO или ничего. */
export interface CommandHandler<TCommand extends Command, TResult extends DTO | DTO[] | void> {
  handle(command: TCommand): Promise<TResult>;
}
```

```ts
// shared/contract/fetcher.ts
import type { DTO } from "./dto";
import type { Query } from "./query";

/** Фетчер: принимает Query, возвращает DTO, массив DTO или null. */
export interface Fetcher<TQuery extends Query, TResult extends DTO | DTO[] | null> {
  fetch(query: TQuery): Promise<TResult>;
}
```

```ts
// shared/contract/action.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/** HTTP-обработчик маршрута: разбирает запрос, вызывает Handler/Fetcher, отдаёт ответ. */
export interface Action<TRequest extends MedusaRequest = MedusaRequest> {
  handle(req: TRequest, res: MedusaResponse): Promise<void>;
}
```

Наружу из Handler и Fetcher уходят **только DTO** — не сущности и не сырые строки Query.

### Базовые классы

```ts
// shared/command/abstract-command-handler.ts
/** Обработчик команды: снаружи handle(command), внутри — workflow с шагами и откатом. */
@Injectable()
export abstract class AbstractCommandHandler<TCommand extends Command, TResult extends DTO | DTO[] | void>
  implements CommandHandler<TCommand, TResult>
{
  protected abstract readonly workflow: ReturnWorkflow<TCommand, TResult, []>;

  constructor(@InjectContainer() protected readonly container: MedusaContainer) {}

  async handle(command: TCommand): Promise<TResult> {
    const { result } = await this.workflow(this.container).run({ input: command });
    return result;
  }
}
```

```ts
// shared/query/abstract-fetcher.ts
/** Фетчер: только чтение через Query Medusa (graph). */
@Injectable()
export abstract class AbstractFetcher<TQuery extends Query, TResult extends DTO | DTO[] | null>
  implements Fetcher<TQuery, TResult>
{
  constructor(@InjectContainer() protected readonly container: MedusaContainer) {}

  /** Query Medusa: чтение своих сущностей, сущностей Medusa и связей между ними. */
  protected get graph() {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY);
    return query.graph.bind(query);
  }

  abstract fetch(query: TQuery): Promise<TResult>;
}
```

Action базового класса не имеет: ему нечего наследовать, он просто реализует контракт `Action`.

### Контейнер

Аналог PHP‑DI из `api/v1/config`: классы собираются автоматически по типам параметров конструктора, а там, где
автосборки мало, — по определениям из `src/container/common/*.ts`.

| PHP (Slim + PHP‑DI)                                         | Здесь                                                    |
|-------------------------------------------------------------|----------------------------------------------------------|
| `api/v1/config/common/{domain}.php`                         | `src/container/common/{module}.ts`                       |
| `dependencies.php` + `ConfigAggregator`                     | `src/container/dependencies.ts`                          |
| `container.php` + `ContainerBuilder`                        | `src/container/index.ts` → `createContainer(...)`        |
| `Class::class => static fn (ContainerInterface $c) => ...`  | `define(Class, ({ get, container }) => new Class(...))`  |
| `'config' => ['domain' => [...]]`                           | `export const {module}Config = { ... }` в том же файле   |
| автосборка по Reflection                                    | автосборка по `@Injectable()` + `reflect-metadata`       |
| `Container::get(Handler::class)`                            | `Container.from(container).get(Handler)`                 |

- **Автосборка.** Класс с `@Injectable()` контейнер собирает сам: каждый параметр конструктора — класс, который
  контейнер тоже соберёт. Контейнер Medusa получает параметр с `@InjectContainer()` (у базовых Handler и Fetcher он
  уже есть). Handler, Fetcher и Action без своих значений **не описываем** — как и в PHP‑версии.
- **Зависимости конструктора импортируем как значения**, не через `import type`: иначе тип стирается и контейнер
  бросит ошибку «параметр #N не класс».
- **`define`** — только когда в конструкторе есть то, что не выводится из типа: значение из конфига или env,
  выбор реализации абстрактного класса. Фабрика получает `get(Class)` для других зависимостей и `container` Medusa.
- **Конфиг и env** читаются только в `src/container/common/*.ts`. Классы получают готовые значения через конструктор
  и сами в `process.env` не ходят. Настройки модулей и провайдеров Medusa — в `medusa-config.ts`.
- **Время жизни.** `Container.from(container)` открывает область: внутри неё каждый класс создаётся один раз,
  следующий `from` — новые экземпляры. В роуте область открывается на `req.scope` (один запрос), в подписчике и job —
  на их `container` (одно событие / один запуск). Глобальных синглтонов нет: процесс Node живёт долго, и общий
  экземпляр делил бы состояние между покупателями.
- **Контракты для привязки.** Интерфейсов TypeScript нет во время выполнения, поэтому контракт, реализацию которого
  выбирает контейнер, объявляется `abstract class` только с абстрактными методами и привязывается через `define`.
- **Данные запроса** (текущий пользователь, корзина) в контейнер не кладём: Action берёт их из `req` и передаёт
  в Command / Query.

```ts
// src/container/common/smtp.ts
export const smtpConfig: SMTPOptions = {
  host: process.env.SMTP_HOST ?? "",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",
  user: process.env.SMTP_USER ?? "",
  password: process.env.SMTP_PASSWORD ?? "",
  from: process.env.SMTP_FROM ?? "",
};

export default [
  define(SMTP, ({ container }) => new SMTP(smtpConfig, container.resolve(ContainerRegistrationKeys.LOGGER))),
];
```

```ts
// src/container/dependencies.ts
export const dependencies: Definition<unknown>[] = [...smtp, ...review];

// src/container/index.ts
export const Container = createContainer(dependencies);
```

### Инфраструктурные сервисы (`src/shared/{service}/service/`)

Технические сервисы без своего домена — почта, HTTP‑клиенты ЮKassa и СДЭК, хранилища — живут в `shared`, а не
в `modules`: у них нет сущностей, команд и запросов. Пример — `src/shared/smtp/service/smtp.ts`.

- Класс получает настройки и логгер через конструктор, сам в `process.env` не ходит.
- Описывается в контейнере через `define` в `src/container/common/{service}.ts` — там же читается env.
- Без обязательной env‑переменной работает на заглушке (SMTP без `SMTP_HOST` пишет письмо в лог).
- Ошибку внешней системы ловит, логирует и бросает `MedusaError` с понятным текстом — это одно из мест,
  где `try-catch` разрешён (п.11).
- Используется из Handler, Fetcher, шагов и доменных сервисов — через параметр конструктора или контейнер:

```ts
// параметр конструктора — контейнер подставит SMTP по определению из common/smtp.ts
@Injectable()
export class SendWelcomeEmailHandler implements CommandHandler<SendWelcomeEmailCommand, void> {
  constructor(private readonly smtp: SMTP) {}

  async handle(command: SendWelcomeEmailCommand): Promise<void> {
    await this.smtp.send({ to: command.email, subject: "Добро пожаловать", html: "<p>…</p>" });
  }
}

// там, где конструктора нет (подписчик, job, шаг workflow)
await Container.from(container).get(SMTP).send({ to, subject, html });
```

Handler без workflow (как выше) допустим, когда откатывать нечего: письмо не отзовёшь. Если команда меняет данные
в БД — только `AbstractCommandHandler` с workflow.

---

## 5. Command: изменение данных

Аналог Command + Handler. Только команды меняют данные.

- **`command.ts`** — DTO команды: `export type CreateReviewForProductCommand = { ... }`, должен подходить под контракт
  `Command` (п.4). Только поля в snake_case, без методов и значений по умолчанию, даты — ISO‑строкой.
- **`dto.ts`** — что возвращает команда: `export type CreatedReviewDTO = { ... }` под контракт `DTO` (п.8).
- **`handler.ts`** — `CreateReviewForProductHandler extends AbstractCommandHandler<Command, CreatedReviewDTO>`, в нём
  только ссылка на workflow. Своих методов нет.
- **`workflow.ts`** — сценарий из шагов:
  - функция композиции синхронная и декларативная: внутри нет `async/await`, `if`, циклов и операций над результатами
    шагов. Преобразования — `transform(...)`, условия — `when(...)`;
  - сначала переиспользуем готовые шаги и workflows Medusa (`@medusajs/medusa/core-flows`);
  - связи между модулями создаём здесь (`createRemoteLinkStep`), события публикуем здесь (`emitEventStep`).
- **`step/{action}.ts`** — один шаг = одно действие: резолвит сервис модуля из `container` и вызывает его метод.
  - Возвращает `new StepResponse(dto, compensationInput)` — последний шаг собирает DTO из `../dto.ts`.
  - Шаг, который что‑то создаёт или меняет, **обязан иметь откат** (третий аргумент `createStep`).
  - Бизнес‑проверки — в шаге или в методе сервиса модуля, ошибка — `MedusaError`.

```ts
// command/create-review-for-product/command.ts
export type CreateReviewForProductCommand = {
  product_id: string;
  customer_id: string;
  rating: number;
  text: string;
};
```

```ts
// command/create-review-for-product/dto.ts
export type CreatedReviewDTO = {
  id: string;
  status: "pending" | "published" | "rejected";
};
```

```ts
// command/create-review-for-product/step/create-review.ts
export const createReviewStep = createStep(
  "create-review",
  async (command: CreateReviewForProductCommand, { container }) => {
    const reviews = container.resolve<ReviewModuleService>(REVIEW_MODULE);
    const review = await reviews.createReviews(command);
    const dto: CreatedReviewDTO = { id: review.id, status: review.status };
    return new StepResponse(dto, review.id);
  },
  async (reviewId, { container }) => {
    if (!reviewId) return;
    const reviews = container.resolve<ReviewModuleService>(REVIEW_MODULE);
    await reviews.deleteReviews(reviewId);
  },
);
```

```ts
// command/create-review-for-product/workflow.ts
export const createReviewForProductWorkflow = createWorkflow(
  "create-review-for-product",
  (command: CreateReviewForProductCommand) => new WorkflowResponse(createReviewStep(command)),
);
```

```ts
// command/create-review-for-product/handler.ts
@Injectable()
export class CreateReviewForProductHandler extends AbstractCommandHandler<CreateReviewForProductCommand, CreatedReviewDTO> {
  protected readonly workflow = createReviewForProductWorkflow;
}
```

---

## 6. Query: чтение данных

Аналог Query + Fetcher. Чтению workflow не нужен — откатывать нечего.

- **`query.ts`** — DTO запроса под контракт `Query`: `export type GetReviewsByProductIdQuery = { product_id: string }`.
- **`dto.ts`** — что возвращает фетчер: `export type ReviewDTO = { ... }` под контракт `DTO` (п.8).
- **`fetcher.ts`** — `GetReviewsByProductIdFetcher extends AbstractFetcher<Query, ReviewDTO[]>`, метод `fetch(query)`.
  - Читает через `this.graph({ entity, fields, filters, pagination })` — так доступны и свои сущности,
    и сущности Medusa, и связи между ними.
  - `fields` — явный список, только то, что нужно потребителю. `*` не используем.
  - Цены — через `QueryContext({ currency_code, region_id })`, не вручную.
  - Возвращает DTO / массив DTO / `null` из своего `dto.ts`. Маппинг строки в DTO — функцией `toXxxDTO(row)`
    в том же `fetcher.ts`.
- **Нейминг по контракту**:
  - `get-...` — результат обязан быть; нет данных → `MedusaError(MedusaError.Types.NOT_FOUND, "...")`;
  - `find-...` — может не найти; возвращает `null`;
  - коллекции (`get-reviews-by-product-id`) — пустой массив, если по смыслу это не ошибка.

```ts
// query/get-reviews-by-product-id/dto.ts
export type ReviewDTO = {
  id: string;
  rating: number;
  text: string;
  created_at: Date;
};
```

```ts
// query/get-reviews-by-product-id/fetcher.ts
const REVIEW_FIELDS = ["id", "rating", "text", "created_at"];

const toReviewDTO = (review: ReviewDTO): ReviewDTO => ({
  id: review.id,
  rating: review.rating,
  text: review.text,
  created_at: new Date(review.created_at),
});

@Injectable()
export class GetReviewsByProductIdFetcher extends AbstractFetcher<GetReviewsByProductIdQuery, ReviewDTO[]> {
  async fetch(query: GetReviewsByProductIdQuery): Promise<ReviewDTO[]> {
    const { data } = await this.graph({
      entity: "review",
      fields: REVIEW_FIELDS,
      filters: { product_id: query.product_id, status: "published" },
    });
    return data.map(toReviewDTO);
  }
}
```

---

## 7. Action: HTTP‑логика

Аналог Action из Slim. Знает про HTTP, ничего не знает про БД.

- **`action.ts`** — `CreateReviewForProductAction implements Action<AuthenticatedMedusaRequest<Body>>`.
  - Помечен `@Injectable()`. Зависимости (Handler, Fetcher) — через конструктор, `private readonly`,
    собирает их контейнер.
  - `handle(req, res)`:
    1. берёт уже провалидированные данные: `req.validatedBody`, `req.validatedQuery`, `req.params`,
       `req.auth_context.actor_id`;
    2. собирает Command / Query;
    3. вызывает `handler.handle(...)` / `fetcher.fetch(...)`;
    4. отдаёт `res.json({ review })` / `res.status(201).json(...)` — объект с именованным ключом в snake_case,
       как в Store API Medusa.
  - `try-catch` нет: ошибки превращает в ответ обработчик Medusa (п.11).
- **`schema.ts`** — zod‑схема тела/параметров запроса и тип из неё:
  `export type CreateReviewForProductBody = z.infer<typeof CreateReviewForProductSchema>`.
  zod импортируем из `@medusajs/framework/zod` (та же версия, что у валидаторов Medusa).

```ts
// action/create-review-for-product/schema.ts
import { z } from "@medusajs/framework/zod";

export const CreateReviewForProductSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(1).max(2000),
});

export type CreateReviewForProductBody = z.infer<typeof CreateReviewForProductSchema>;
```

```ts
// action/create-review-for-product/action.ts
@Injectable()
export class CreateReviewForProductAction implements Action<AuthenticatedMedusaRequest<CreateReviewForProductBody>> {
  constructor(private readonly handler: CreateReviewForProductHandler) {}

  async handle(req: AuthenticatedMedusaRequest<CreateReviewForProductBody>, res: MedusaResponse): Promise<void> {
    const review = await this.handler.handle({
      product_id: req.params.id,
      customer_id: req.auth_context.actor_id,
      rating: req.validatedBody.rating,
      text: req.validatedBody.text,
    });
    res.status(201).json({ review });
  }
}
```

---

## 8. Entity и сервис модуля

### Entity (`entity/{entity}.ts`)

- `export const Review = model.define("review", { ... })` + `export type ReviewEntity = InferTypeOf<typeof Review>`.
  `ReviewEntity` используется только внутри модуля, наружу уходят DTO команд и фетчеров.
  Имя таблицы — snake_case, единственное число.
- Идентификатор: `id: model.id({ prefix: "rev" }).primaryKey()` — строка с коротким префиксом модуля.
- Поля только через DSL `model.*` с явными `.nullable()`, `.default()`, `.index()`; статусы — `model.enum([...])`;
  деньги — `model.bigNumber()`. `created_at/updated_at/deleted_at` Medusa добавляет сама.
- Связи внутри модуля — `model.hasMany` / `model.belongsTo`. С сущностями других модулей — только через `src/links/`;
  в сущности храним максимум внешний id для фильтрации (`product_id`).
- В сущности нет логики, хуков и валидации.
- Любое изменение сущности → `pnpm medusa db:generate {module}` → `pnpm db:migrate`. Миграции коммитим.

```ts
// entity/review.ts
import { model } from "@medusajs/framework/utils";
import type { InferTypeOf } from "@medusajs/framework/types";

export const Review = model.define("review", {
  id: model.id({ prefix: "rev" }).primaryKey(),
  product_id: model.text().index(),
  customer_id: model.text().index(),
  rating: model.number(),
  text: model.text(),
  status: model.enum(["pending", "published", "rejected"]).default("pending"),
});

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ReviewEntity = InferTypeOf<typeof Review>;
```

### DTO (`command/{use-case}/dto.ts`, `query/{use-case}/dto.ts`)

То, что команда или фетчер отдаёт наружу (и что в итоге видит витрина).

- Лежит **в папке той команды или того фетчера, который его возвращает**. Общей папки `dto/` в модуле нет.
- Подходит под контракт `DTO` (п.4): только поля, **без методов, конструкторов и значений по умолчанию**, только `type`.
- Содержит только поля, которые нужны этому use‑case, — не копия сущности. Если двум use‑case нужны одинаковые данные,
  у каждого свой DTO: так изменение одного ответа не ломает другой.
- Маппинг в DTO — в шаге (команда) или в `fetcher.ts` (запрос), не в самом DTO.

### Сервис модуля (`service/{module}-module-service.ts`)

Аналог Repository: единственное место, которое пишет в таблицы модуля.

- `export class ReviewModuleService extends MedusaService({ Review }) {}`, имя модуля — константа
  `REVIEW_MODULE = "review"` в `index.ts`.
- Сгенерированные методы используем как есть: `retrieveReview` (нет → `NOT_FOUND`), `listReviews`,
  `listAndCountReviews`, `createReviews`, `updateReviews`, `deleteReviews`, `softDeleteReviews`, `restoreReviews`.
- Свои методы — только доменная логика, которой нет в сгенерированных. Нейминг тот же: `get...` бросает
  `NOT_FOUND`, `find...` возвращает `null`. Методы с запросами к БД — с `@InjectManager()` и последним параметром
  `@MedusaContext() sharedContext: Context = {}`.
- Сервис модуля вызывают **только шаги команд**. Fetcher читает через Query, Action — через Handler/Fetcher.
- Модуль изолирован: сервис не импортирует сервисы, сущности и типы других модулей.
- Опции модуля проверяем в `static validateOptions`. `try-catch` в сервисе нет.

### Доменные сервисы (`service/`)

Чистая логика без БД и HTTP (расчёт скидки, проверка правил) — обычные функции или классы в `service/`,
используются из шагов и fetcher'ов. Покрываются unit‑тестами.

---

## 9. HTTP: маршруты и middleware

- **Маршрут** — правильный REST‑путь от ресурса: `src/api/store/products/[id]/reviews/route.ts`
  (`GET /store/products/:id/reviews`, `POST /store/products/:id/reviews`). Ресурсы — во множественном числе,
  динамические сегменты — папки `[id]`. Админка — `src/api/admin/...`.
- **`route.ts`** — только связывание: берёт Action из контейнера и вызывает `handle`. Плюс JSDoc `@oas` для
  каждого роута, нужного витрине, затем `pnpm openapi:generate` и коммит `openapi/store.oas.json`
  (иначе роут не попадёт во фронтовый клиент).
- **`middleware.ts`** рядом с `route.ts` — авторизация и валидация этого маршрута. Medusa читает только
  `src/api/middlewares.ts`, поэтому каждый `middleware.ts` подключается туда.

```ts
// api/store/products/[id]/reviews/route.ts
export const GET = (req: MedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetReviewsByProductIdAction).handle(req, res);

export const POST = (req: AuthenticatedMedusaRequest<CreateReviewForProductBody>, res: MedusaResponse) =>
  Container.from(req.scope).get(CreateReviewForProductAction).handle(req, res);
```

```ts
// api/store/products/[id]/reviews/middleware.ts
export const productReviewsMiddleware: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/products/:id/reviews",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(CreateReviewForProductSchema),
    ],
  },
];

// api/middlewares.ts
export default defineMiddlewares({
  routes: [...productReviewsMiddleware /* , ...остальные */],
});
```

---

## 10. Подписчики, jobs, связи, интеграции

- **Подписчик** — `src/subscribers/{module}-{event}.ts` (`review-order-placed.ts`): `export default async function`
  и `export const config: SubscriberConfig = { event: "order.placed" }`. Берёт из события только нужные поля и
  вызывает Handler / Fetcher модуля через `Container.from(container)`. Объект события целиком внутрь не передаёт.
  Логика должна быть идемпотентной — событие может прийти повторно.

```ts
// src/subscribers/review-order-placed.ts
export default async function reviewOrderPlaced({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  await Container.from(container).get(RequestReviewForOrderHandler).handle({ order_id: data.id });
}

export const config: SubscriberConfig = { event: "order.placed" };
```

- **Job** — `src/jobs/{module}-{what-it-does}.ts` + `export const config = { name, schedule }`. Тоже только вызывает
  Handler / Fetcher, работает в worker, идемпотентен.
- **Связи модулей** — `src/links/{module-a}-{module-b}.ts` через `defineLink`.
- **Свои события** — из workflow шагом `emitEventStep`, имя `{entity}.{past-tense}` (`review.created`).
- **Интеграции** (почта, ЮKassa/СБП, СДЭК):
  - свой клиент внешней системы — инфраструктурный сервис в `src/shared/{service}/service/` (п.4, пример — SMTP);
  - если интеграция должна встроиться в процессы Medusa (оплата в checkout, тарифы доставки) — провайдер встроенного
    модуля Medusa (`AbstractPaymentProvider`, `AbstractFulfillmentProviderService`) в `src/modules/{provider}/`,
    настройки — через `options` в `medusa-config.ts`.

---

## 11. Ошибки и логирование

- **Ошибки** — только `MedusaError` с подходящим типом. Обработчик Medusa превращает их в HTTP‑статус:
  - `INVALID_DATA`, `NOT_ALLOWED` → 400, `UNAUTHORIZED` → 401, `FORBIDDEN` → 403, `NOT_FOUND` → 404,
    `DUPLICATE_ERROR` → 422, `UNEXPECTED_STATE` и прочее → 500;
  - `CONFLICT` (409) для бизнес‑ошибок не используем: Medusa подменяет его текст на сообщение про Idempotency-Key.
- **Сообщения** — на русском, конкретные, с контекстом: `"Отзыв rev_123 не найден"`.
- **`try-catch`** разрешён только в:
  - инфраструктурных сервисах и провайдерах интеграций — ловим ошибку внешнего API, логируем, бросаем `MedusaError`
    с понятным текстом;
  - итеративной обработке (пачка записей в подписчике, job, скрипте), чтобы одна ошибка не останавливала остальные.

  В Action, Handler, workflow, шагах, Fetcher, сервисах и сущностях — нет. Откат делает workflow, а не `catch`.
- **Логирование** — только логгер Medusa (`container.resolve(ContainerRegistrationKeys.LOGGER)` или `logger` из
  конструктора модуля), без `console.*`. Сообщение начинается с префикса `{module}/{use-case}:` —
  `review/create-review-for-product: ...`.

---

## 12. Стиль кода

- **TypeScript**: `strictNullChecks`; явные типы параметров и возвращаемых значений у публичных методов;
  `any` не используем (`unknown` + сужение); типы импортируем через `import type`, **кроме зависимостей
  конструктора** — их импортируем как значения (п.4, «Контейнер»).
- **Зависимости** — через конструктор, свойства `private readonly` (в базовых классах — `protected readonly`).
- **Объект вместо позиционных параметров**, когда параметров два и больше смысловых — аналог именованных аргументов.
  Исключение — конструкторы классов из контейнера: там параметры позиционные, иначе автосборка не увидит типы.
- **Иммутабельность**: результаты Query и входы команд не мутируем.
- **Комментарии**: JSDoc на русском над экспортируемыми классами — зачем он и где используется.
  Комментарии объясняют «почему», а не пересказывают код.
- **Чистота**: неиспользуемые импорты и мёртвый код удаляем; `pnpm lint` и prettier проходят.

---

## 13. Тесты

- Чистые функции и доменные сервисы (`toXxx`, расчёты) — unit‑тесты в `__tests__/` рядом с кодом, `pnpm test:unit`.
- Сервис модуля — `pnpm test:integration:modules`.
- Маршрут целиком (route → Action → Handler/Fetcher → БД) — `integration-tests/http/`, `pnpm test:integration:http`.
  Новый роут витрины без интеграционного теста не считается готовым.

---

## 14. Админка и вёрстка

- Расширения админки — только `src/admin/` на `@medusajs/ui` и `@medusajs/admin-sdk`; ходят только в Admin API.
- HTML писем собирает тот use‑case, который письмо отправляет; SMTP только доставляет готовое письмо.
- Витрина (`frontend/`) общается с бэкендом только через Store API и клиент, сгенерированный из `openapi/store.oas.json`.

---

## 15. Запрещено / обязательно

**Запрещено**:

- Логика в `route.ts`, подписчиках и jobs — только вызов Action / Handler / Fetcher.
- Менять данные в обход Command; вызывать сервис модуля откуда‑либо, кроме шагов команд.
- Импортировать сервисы и сущности одного модуля в другой; связывать модули иначе, чем через `src/links/`.
- SQL и доступ к чужим таблицам.
- Логика и валидация в сущностях; ручная валидация тела запроса в Action.
- `try-catch` вне инфраструктурных сервисов, провайдеров интеграций и итеративной обработки.
- `console.*`, `any`, секреты и адреса в коде вместо env.
- Передавать внутрь модуля `req` или объект события целиком.

**Обязательно**:

- Структура модуля из п.3, базовые классы и контракты из `src/shared` (п.4).
- Handler, Fetcher, Action и доменные сервисы — с `@Injectable()`; создаются только через `Container`, не через `new`.
- Command, Query и DTO — только `type` без методов и значений по умолчанию; наружу из модуля — только DTO.
- DTO лежит в папке команды или фетчера, который его возвращает.
- Имена по схеме «что делаем — из чего»; аббревиатуры капслоком, кроме `Id`.
- Откат для каждого шага, который что‑то меняет.
- Миграция на каждое изменение сущности; `@oas` + `pnpm openapi:generate` на каждый роут витрины.
- Сначала искать готовое в Medusa (core-flows, встроенные модули, провайдеры), потом писать своё.
- Новые env‑переменные — в `.env.template`, новый модуль — в `medusa-config.ts`.
