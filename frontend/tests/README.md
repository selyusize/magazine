# Тесты фронтенда

```bash
make test                  # из корня: всё, Medusa поднимается автоматически
pnpm test                  # из frontend: всё (Medusa должна быть запущена)
pnpm test:unit             # только unit, без сети
pnpm test:integration      # только integration
```

| Папка | Что проверяет | Зависимости |
|---|---|---|
| `unit/` | Чистая логика: сроки JWT, формат ответов Server Actions, параметры cookie | нет |
| `integration/` | Server Actions против живой Medusa: корзина, вход/регистрация, продление сессии | Medusa на `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` в `.env.local`, товары в каталоге |

В интеграционных тестах `next/headers` подменён хранилищем cookie в памяти (`helpers/cookie-jar.ts`):
Server Actions работают как в Next, а тест видит, что и с какими опциями записано в cookie.
Перед каждым тестом хранилище очищается — каждый тест это новый посетитель.
Email покупателей уникальны, поэтому тесты можно гонять на одной базе сколько угодно раз.

## Сценарии

### Сессия и cookie (`unit/session-cookies.test.ts`, `unit/jwt.test.ts`)
- cookie сессии: `httpOnly`, `sameSite=lax`, `path=/`; `secure` в проде, `COOKIE_SECURE` переопределяет;
- cookie с JWT живёт ровно до `exp` токена; без `exp` — 7 дней; для истёкшего — 0;
- токен обновляется, когда прошла половина срока жизни; свежий — нет; мусор вместо токена не роняет код.

### Маппер имён snake_case ↔ camelCase (`unit/case-mapper.test.ts`, `unit/http.test.ts`)
- `product_id ↔ productId`, обратимо; `address_1` остаётся `address_1`; фильтры `createdAt[$gt] → created_at[$gt]`;
- ответ → camelCase глубоко (объекты, массивы), тело запроса и query → snake_case, значения не меняются;
- ключи внутри `metadata` / `additional_data` не трогаются;
- трансформер OpenAPI переименовывает поля схем, `required` и query-параметры тем же правилом;
- publishable key в каждом запросе, ошибки → `ApiError` со статусом и телом.

### Формат ответа Server Actions (`unit/action-result.test.ts`)
- успех → `{ ok: true, data }`; ошибка Medusa → `{ ok: false, error: { status, message, type } }`;
- `unwrap` для TanStack Query: данные или исключение `ActionFailure`.

### Корзина гостя (`integration/cart.test.ts`)
- у нового посетителя корзины нет и cookie не создаётся;
- первое добавление создаёт корзину, id → httpOnly-cookie на 30 дней;
- следующие добавления идут в ту же корзину; `getCart` находит её по cookie;
- изменение количества, удаление позиции, изменение данных корзины (email);
- битый id в cookie → корзины нет, следующее добавление создаёт новую;
- операции без корзины и ошибки Medusa возвращаются как `ActionResult` со статусом, без исключений;
- `forgetCart` удаляет cookie;
- маппер на живой Medusa: адрес (`firstName`, `address_1`, `countryCode`) и `metadata` проходят туда и обратно без потерь.

### Покупатель (`integration/auth.test.ts`)
- регистрация создаёт покупателя с профилем и сразу авторизует;
- JWT → httpOnly-cookie со сроком жизни токена;
- гостевая корзина переходит к покупателю после регистрации/входа;
- повторная регистрация на тот же email и неверный пароль → 401, cookie не создаются;
- выход удаляет JWT и id корзины; гость и поддельный токен → `getCustomer() === null`;
- изменение профиля: работает для вошедшего, 401 для гостя.

### Продление сессии (`integration/session-refresh.test.ts`, proxy.ts)
- гость и свежий токен — запрос проходит без изменений;
- после половины срока токен обновляется через Medusa, новый пишется в httpOnly-cookie
  и сразу виден в текущем запросе; новым токеном можно пользоваться;
- истёкший токен удаляется; поддельный токен не роняет запрос.
