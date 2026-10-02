# Magazine — frontend

Next.js 16 (App Router, Turbopack) · TypeScript · React Compiler · TanStack Query + TanStack Devtools · Zustand · shadcn/ui · FSD (Steiger)

## Команды

```bash
pnpm dev            # генерация API-клиента + dev-сервер
pnpm build          # генерация API-клиента + production-сборка (standalone)
pnpm typecheck      # генерация API-клиента + tsc
pnpm lint           # ESLint (+ правила TanStack Query)
pnpm lint:fsd       # Steiger — проверка архитектуры FSD
pnpm api:generate   # Orval: клиент + хуки TanStack Query из OpenAPI → src/shared/api/generated
```

Бэкенд — Medusa (`../backend`). Клиент генерируется Orval (`orval.config.ts`) из спецификации
`../backend/openapi/store.oas.json` (Store API + свои роуты; обновляется `make api-generate` из корня);
другую схему можно указать через `OPENAPI_SCHEMA`.
Папка `src/shared/api/generated` не коммитится — она создаётся перед `dev` / `build` / `typecheck`.

Переменные — в `.env.example`, локально — `.env.local`:
- `NEXT_PUBLIC_API_URL` — адрес Medusa для браузера;
- `API_INTERNAL_URL` — адрес Medusa для сервера Next (в Docker `http://backend:9000`);
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` — ключ Store API (админка → Settings → Publishable API Keys),
  `http` подставляет его в заголовок `x-publishable-api-key` каждого запроса.

## Структура

```
app/                 # только роутинг Next.js, реэкспортирует страницы из @pages
pages/               # заглушка, чтобы Next не считал src/pages Pages Router'ом
src/
  app/               # FSD app: root layout, провайдеры, глобальные стили
  pages/             # страницы
  widgets/
  features/
  entities/
  shared/
    ui/              # все компоненты shadcn
    lib/             # cn, хуки
    api/             # http (fetch-mutator для Orval), QueryClient
      generated/     # код Orval — не редактировать
        endpoints/   # fetch-функции и хуки, по тегам OpenAPI
        schemas/     # типы моделей
    config/          # env
```

## Алиасы

`@app/*` `@pages/*` `@widgets/*` `@features/*` `@entities/*` `@shared/*` `@api` / `@api/*` (= `src/shared/api`)

## HTTP-клиент (Orval)

Всё импортируется из `@api`. На каждый эндпоинт генерируются:

```ts
// Server Component — готовый HTML для SEO, кеш Next по тегам
const { products } = await getProducts({ limit: 12 }, { next: { tags: ["products"] } });
const { product } = await getProductsId(id);

// Client Component
const { data } = useGetProductsId(id);
const { data } = useGetProductsIdSuspense(id);
const addLineItem = usePostCartsIdLineItems();

// Prefetch на сервере + гидрация, инвалидация
await prefetchGetProductsIdQuery(queryClient, id);
getGetProductsIdQueryOptions(id); getGetProductsIdQueryKey(id);
await invalidateGetProductsId(queryClient, id);
```

Ошибки ответа приходят как `ApiError` (`status`, `body`).

### Имена полей: snake_case → camelCase
Бэкенд отдаёт `product_id`, на фронте везде `productId` — и в типах, и в данных. Правило одно
(`src/shared/api/case.ts`), применяется дважды: `orval.transformer.ts` переименовывает поля в спецификации
перед генерацией типов, `http.ts` преобразует данные (ответ → camelCase, тело и query → snake_case).
- `address_1`, `address_2` не меняются (подчёркивание перед цифрой) — так преобразование обратимо;
- ключи внутри `metadata` / `additional_data` не трогаются — это данные конкретного магазина;
- значения не меняются: в `fields: "*items.variant"`, `order: "created_at"` остаются имена бэкенда.

## Лайаут

```
app/layout.tsx              → RootLayout: html/body, шрифты, провайдеры
app/(shop)/layout.tsx       → ShopLayout: полный хедер + футер
app/(checkout)/layout.tsx   → CheckoutLayout: только логотип, без футера
app/(auth)/layout.tsx       → AuthLayout: без хедера и футера (/login, /register)
app/not-found.tsx           → 404 внутри ShopLayout
```

- `shared/config/site.ts` — настройки магазина: название, топбар, навигация, поиск, липкий хедер,
  колонки футера, контакты, соцсети. Новый магазин — обычно правка только этого файла.
- `shared/config/routes.ts` — все пути витрины.
- `shared/ui/app-shell.tsx` — каркас `header / main / footer` (landmark-теги, skip-link, `data-layout`).
- `shared/ui/container.tsx` — ширина контента (`narrow | default | wide | full`) задаётся на странице, а не в лайауте.
- `widgets/header`, `widgets/footer` — регионы (топбар, логотип, навигация, поиск, действия / колонки,
  контакты, соцсети, нижняя строка) — отдельные компоненты (`HeaderLogo`, `HeaderNavigation`, `FooterColumns`, …),
  пока каждый возвращает пустой `<div />`. Правило: не передан — стандартный компонент, `null` — скрыт,
  свой элемент — вместо стандартного: `<Header navigation={<Categories />} search={null} />`.
- Если лайаут не передал хедер или футер (`/checkout`), тегов `<header>` / `<footer>` на странице нет.
- Новый вариант лайаута: компонент в `src/app/layouts` + route group `app/(имя)/layout.tsx`.
- Стилей пока нет: они добавляются позже через `className` в компонентах регионов и каркаса.

## Сессия покупателя
- **Публичные данные** (каталог, регионы) — сгенерированные функции и хуки напрямую.
- **Приватные** (покупатель, корзина) — только Server Actions в `entities/*/api` и `features/*/api`:
  JWT и id корзины лежат в httpOnly-cookie (`src/shared/session`), браузер их не видит.
- Мутации возвращают `ActionResult` (`{ ok, data } | { ok, error: { status, message, type } }`);
  хуки TanStack Query (`useCart`, `useAddLineItem`, `useLogin`…) превращают ошибку в `ActionFailure`.
- `proxy.ts` продлевает JWT, когда прошла половина его срока (`JWT_EXPIRES_IN` в backend), и убирает истёкший.
- `COOKIE_SECURE=false` — если прод-сборка открывается по http (secure-cookie иначе не сохранятся).

## Правила слоёв
- `ui/` — только «тупые» компоненты: пропсы → разметка. Никакой логики, запросов, валидации.
- `model/` — всё остальное: хуки форм (`use-*-form.ts`), схемы zod, мутации, связка логики с ui.
- Ошибки — в одном месте: `shared/lib/errors.ts` (словарь `errorMessages`, `getErrorMessage`, `getFieldErrors`).
  Фичи не пишут свои тексты ошибок, схемы zod берут их из словаря.
- Валидация — zod (`shared/lib/zod.ts`, русская локаль). Server Actions проверяют вход той же схемой, что и форма.

## Вход и регистрация
Формы — блоки shadcn `login-04` / `signup-04`:
- `features/auth/ui/*-form.tsx` — разметка блока (`LoginFormView`, `SignupFormView`);
- `features/auth/model/use-login-form.ts`, `use-signup-form.ts` — валидация, запрос, ошибки, переход;
- `features/auth/model/auth-forms.tsx` — связка (`LoginForm`, `SignupForm`), её используют страницы.

Страницы `/login` и `/register`: вошедшего покупателя сразу перенаправляют; `?next=/cart` — куда вернуть
после входа (только пути сайта); картинка второй колонки — `siteConfig.auth.image`.

## Тесты
`make test` из корня или `pnpm test` — см. [`tests/README.md`](tests/README.md). Сгенерированный код стоит коммитить —
тогда сборка не зависит от доступности бэкенда.

Новые компоненты shadcn: `pnpm dlx shadcn@latest add <name>` — попадут в `src/shared/ui`.
