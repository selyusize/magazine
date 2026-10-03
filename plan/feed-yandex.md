# План: генерация товарных фидов (первый формат — YML Яндекса)

Детализация этапа 13 из [backend.md](backend.md). Реализуем по [arch-guide.md](../backend/arch-guide.md).

**Цель.** Модуль `feed`, который собирает XML‑фиды из каталога магазина. Ядро не знает про форматы: формат
(Яндекс Директ, Яндекс Маркет, Google Merchant, VK…) — отдельный класс, который подключается одной строкой
в контейнере. Сейчас реализуем один формат — **товарный YML‑фид Яндекс Директа** (`yandex-direct-goods`) по ТЗ
«Требования к YML‑фиду → Товары» и «Каталоги».

**Данные.** Реальных товаров пока нет, поэтому источник данных — `MockFeedSource` с фикстурами, которые покрывают
все правила ТЗ. Источник подменяется в контейнере (`FEED_SOURCE=mock|medusa`); когда появится каталог (этап 2),
пишем `MedusaFeedSource`, форматы и тесты не меняются.

**Тесты.** 100 % покрытия кода модуля и 100 % правил ТЗ: на каждое правило — отдельный тест‑кейс
(матрица в разделе 9), плюс эталонный XML всего мок‑каталога.

---

## 1. Решения, принятые заранее

| Вопрос | Решение | Почему |
|---|---|---|
| Где лежит модуль | `src/modules/feed`, **без своих таблиц** (нет `index.ts`, `entity/`, регистрации в `medusa-config.ts`) | Настройки фидов пока в конфиге; таблица настроек появится с админкой (этап 13.2) |
| Command с workflow или без | `GenerateFeedBySlugHandler` **без workflow**, реализует `CommandHandler` напрямую (п.4 гайда: «откатывать нечего») | БД не меняется; файл пишется атомарно (tmp → rename), откат = не переименовать. Вход/выход workflow сериализуется в Redis/БД — тащить через него 100k оферов нельзя |
| Поток или память | Оферы читаются из источника **постранично** (`AsyncIterable`) и сразу пишутся в поток файла | Требование backend.md: «фиды — пакетами, потоково». Категории и каталоги (их мало) грузятся целиком до оферов |
| `offer id` | id **варианта** Medusa (`variant_…`), одинаковый во всех фидах (Яндекс, Google) и в e‑commerce Метрики на фронте | ТЗ: «идентификаторы одного товара в разных фидах должны быть одинаковы» и «совпадать с ID товаров в электронной коммерции». Длина ≤ 100 — проверяем |
| `categoryId` | Положительное целое ≤ 18 знаков. В моке — числа; для Medusa (id `pcat_…`) — стабильный числовой `feed_id` в `metadata` категории, выдаётся при создании (решаем на этапе `MedusaFeedSource`) | ТЗ требует целое число, у Medusa строки |
| Тип описания офера | Выбирается по данным: есть `vendor` и `model` → `type="vendor.model"` (если есть и `name` — это комбинированный тип); иначе упрощённый, обязателен `name` | ТЗ: в одном фиде допустимы оба типа |
| `available` | Пишем **всегда** явно (`true`/`false`); флаг фида `only_available` выкидывает отсутствующие | ТЗ: обязателен, если в фиде есть товары не в наличии |
| Булевы поля | В модели — `boolean`, в XML — только `true`/`false` (варианты `да/1/+` не генерируем) | Одно каноничное значение проще тестировать |
| `description` | Чистый текст: HTML‑теги вырезаем, сущности декодируем, пробелы схлопываем, без CDATA | Директ показывает текст, разметка ему не нужна |
| Ошибки | Ошибка офера → офер **не попадает** в фид и уходит в отчёт. Предупреждение → офер пишется (с исправлением, если оно есть). Ошибка фида (нет ни одного валидного офера, битое дерево категорий, неподдерживаемая валюта) → `MedusaError`, старый файл остаётся | backend.md: «товары с ошибками — в отчёт, не в фид» |
| Куда пишем | `static/feeds/{slug}.xml` → публично `MEDUSA_FILE_URL/feeds/{slug}.xml` (nginx). Отчёт — в файловый лог `logs/feed-{slug}.log` и в ответ команды | Отчёт не публичный |
| Дата `yml_catalog` | `YYYY-MM-DD hh:mm` в часовом поясе `FEED_TIMEZONE` (по умолчанию `Europe/Moscow`); время берём из `Clock`, который в тестах подменяется | ТЗ: дата и время генерации |
| Кодировка | `<?xml version="1.0" encoding="UTF-8"?>`, один корень `<yml_catalog>` | ТЗ |

> Раздел ТЗ «Каталоги» в присланном тексте обрезан: видны элементы `picture` (для РСЯ и Товарной галереи),
> `name` (обязательный), `description` (необязательный). Атрибут `id` и элемент `url` берём из справки
> Яндекса (`<collection id="…"><url>…</url>…</collection>`) — **перед реализацией сверить с полной страницей**.

---

## 2. Слои расширения

```text
             ┌──────────────── FeedSource (откуда данные) ───────────────┐
             │ MockFeedSource (сейчас)      MedusaFeedSource (этап 2+)   │
             └──────────────────────────────┬────────────────────────────┘
                                            │ FeedCatalog: shop, categories, collections, offers (AsyncIterable)
                                            ▼   — формат‑независимая модель, супермножество полей всех площадок
GenerateFeedBySlugHandler ──▶ FeedFormatRegistry.get(config.format) ──▶ FeedFormat.write(catalog, out, config)
                                            │
                     ┌──────────────────────┼─────────────────────────────┐
                     ▼                      ▼                             ▼
              AbstractYMLFormat       GoogleMerchantFormat (потом)   VKFormat (потом)
          (yml_catalog, shop, currencies,
           categories, offers, collections)
                 ▼               ▼                  ▼                    ▼
   YandexDirectGoodsFormat  YandexMarketFormat  YandexEducationFormat  YandexMedicineFormat
        (сейчас)              (потом)              (потом)               (потом)
                                            │
                                            ▼
                         XMLWriter (shared) ──▶ AtomicFileWriter (shared) ──▶ static/feeds/{slug}.xml
```

- **Новая площадка** = класс `FeedFormat` + строка в `src/container/common/feed.ts`. Ядро, источник и Handler
  не меняются.
- **Новый тип фида Яндекса** = наследник `AbstractYMLFormat`: переопределяет набор правил офера
  (`offerRules`) и порядок/набор элементов (`writeOffer`). Обёртка `yml_catalog/shop`, валюты, категории,
  каталоги, экранирование и дата уже в базе.
- Образование и медицина — другие сущности (курсы, врачи, клиники). Для них появится свой источник
  (`EducationFeedSource`) и своя модель; поэтому `FeedFormat` параметризован типом каталога:
  `FeedFormat<TCatalog>`, а реестр проверяет, что источник подходит формату.

---

## 3. Структура файлов

```text
src/shared/service/
  xml/
    xml-writer.ts                    # XMLWriter: потоковая запись, экранирование, запрещённые XML 1.0 символы
    __tests__/xml-writer.unit.spec.ts
  file/
    atomic-file-writer.ts            # AtomicFileWriter.write(path, (stream) => …): tmp → fsync → rename; при ошибке tmp удаляется
    __tests__/atomic-file-writer.unit.spec.ts
  clock/
    clock.ts                         # abstract class Clock { now(): Date } + SystemClock

src/modules/feed/
  service/
    catalog.ts                       # типы формат‑независимой модели (п.4)
    feed-config.ts                   # тип FeedConfig (slug, format, only_available, utm, …)
    issue.ts                         # FeedIssue, FEED_ISSUE_CODES, severity
    report.ts                        # FeedReportCollector: копит issues и счётчики, лимит деталей в отчёте
    source/
      feed-source.ts                 # abstract class FeedSource — контракт источника
      mock/
        mock-feed-source.ts          # MockFeedSource: отдаёт фикстуры страницами (page_size из конфига)
        fixtures/
          shop.ts
          categories.ts              # дерево: корень, вложенные, «сирота» с несуществующим parent
          collections.ts
          offers.ts                  # по офферу на каждое правило ТЗ (п.8)
    format/
      feed-format.ts                 # abstract class FeedFormat<TCatalog>: key, content_type, extension, write()
      feed-format-registry.ts        # FeedFormatRegistry: get(key) → формат, NOT_FOUND для неизвестного
      yml/
        abstract-yml-format.ts       # обёртка YML, currencies, categories, collections, проход по оферам
        rules/                       # чистые функции, каждая со своим unit‑тестом
          format-yml-date.ts
          format-price.ts
          normalize-url.ts           # punycode хоста, %20, percent-encoding пути/query по RFC 3986, ≤ 2048, http(s)
          apply-utm.ts               # добавляет UTM к URL, не ломая существующий query
          sanitize-text.ts           # вырезать HTML, управляющие символы, схлопнуть пробелы
          currencies.ts              # YML_CURRENCIES — список из ТЗ
          check-category-tree.ts     # id, parentId, циклы, дубли
          check-offer.ts             # общие проверки офера YML → { offer, issues }
        __tests__/
      yandex-direct-goods/
        yandex-direct-goods-format.ts   # правила Директа + порядок элементов офера
        offer-rules.ts                  # правила, специфичные для Директа (properties ≤ 10, custom_label_*, custom_score, …)
        __tests__/
          yandex-direct-goods-format.unit.spec.ts
          offer-rules.unit.spec.ts
          __fixtures__/yandex-direct-goods.expected.xml   # эталон для мок‑каталога
  command/
    generate-feed-by-slug/
      command.ts                     # GenerateFeedBySlugCommand { slug }
      dto.ts                         # GeneratedFeedDTO
      handler.ts                     # GenerateFeedBySlugHandler implements CommandHandler (без workflow — см. п.1)
      __tests__/handler.unit.spec.ts
  query/
    get-feeds/
      query.ts  dto.ts  fetcher.ts   # список настроенных фидов: slug, формат, публичный URL (для админки)
  action/
    generate-feed-by-slug/
      action.ts  schema.ts           # params: slug
    get-feeds/
      action.ts

src/api/admin/feeds/
  route.ts                           # GET  /admin/feeds                    → GetFeedsAction
  [slug]/generations/
    route.ts                         # POST /admin/feeds/:slug/generations  → GenerateFeedBySlugAction (201 + отчёт)
    middleware.ts                    # validateAndTransformParams; авторизацию admin Medusa даёт сама
src/jobs/feed-generate-all.ts        # по расписанию: по всем фидам, try-catch на каждый фид (итеративная обработка)
src/container/common/feed.ts         # feedConfig из env, define(FeedSource), define(FeedFormatRegistry), define(Clock)
integration-tests/http/feeds.spec.ts
```

---

## 4. Формат‑независимая модель (`service/catalog.ts`)

Все типы — `type`, поля snake_case, подходят под контракт `DTO`. Это **супермножество** полей площадок:
формат берёт то, что ему нужно, остальное игнорирует.

```ts
export type FeedShopDTO = {
  name: string;               // SHOP_NAME
  company: string;            // SHOP_COMPANY
  url: string;                // STOREFRONT_URL
  currency_code: string;      // "RUB"
};

export type FeedCategoryDTO = {
  id: string;                 // положительное целое строкой, ≤ 18 знаков
  parent_id: string | null;
  name: string;
};

export type FeedCollectionDTO = {
  id: string;
  url: string;
  name: string;
  picture: string | null;
  description: string | null;
};

export type FeedParamDTO = { name: string; value: string; unit: string | null };
export type FeedPropertyDTO = { name: string; value: string };

export type FeedOfferDTO = {
  id: string;
  group_id: string | null;     // для Google item_group_id / Маркета; Директ не использует
  available: boolean;
  url: string;
  price: number | null;        // в основных единицах валюты (рубли), как отдаёт Medusa
  old_price: number | null;
  currency_code: string;
  category_id: string;
  pictures: readonly string[];
  video: string | null;
  name: string | null;
  type_prefix: string | null;
  vendor: string | null;
  model: string | null;
  vendor_code: string | null;
  description: string | null;
  sales_notes: string | null;
  store: boolean | null;
  pickup: boolean | null;
  delivery: boolean | null;
  manufacturer_warranty: boolean | null;
  country_of_origin: string | null;
  age: { value: number; unit: "year" | "month" } | null;
  adult: boolean | null;
  downloadable: boolean | null;
  market_category: string | null;
  params: readonly FeedParamDTO[];
  properties: readonly FeedPropertyDTO[];
  collection_ids: readonly string[];
  custom_labels: readonly (string | null)[];   // индекс = номер custom_label_0..4
  custom_score: number | null;
};
```

```ts
// service/source/feed-source.ts
/** Контракт источника данных фида. Реализацию выбирает контейнер (FEED_SOURCE). */
export abstract class FeedSource {
  abstract getShop(): Promise<FeedShopDTO>;
  abstract getCategories(): Promise<FeedCategoryDTO[]>;
  abstract getCollections(): Promise<FeedCollectionDTO[]>;
  /** Оферы страницами — фид пишется потоково, весь каталог в память не грузим. */
  abstract getOffers(filter: { only_available: boolean }): AsyncIterable<FeedOfferDTO[]>;
}
```

```ts
// service/format/feed-format.ts
export abstract class FeedFormat {
  abstract readonly key: string;              // "yandex-direct-goods"
  abstract readonly content_type: string;     // "application/xml"
  abstract readonly extension: string;        // "xml"
  /** Пишет фид в out, возвращает отчёт. Ошибку уровня фида бросает MedusaError. */
  abstract write(input: { source: FeedSource; config: FeedConfig; out: Writable }): Promise<FeedReportDTO>;
}
```

```ts
// service/feed-config.ts
export type FeedConfig = {
  slug: string;                 // имя файла и часть URL: "yandex-direct"
  format: string;               // ключ формата в реестре
  only_available: boolean;
  utm: Readonly<Record<string, string>> | null;   // { utm_source: "yandex", utm_medium: "cpc" }
  max_pictures: number;         // ТЗ рекомендует 5
};
```

`FeedIssue`: `{ severity: "error" | "warning"; code: string; offer_id: string | null; field: string | null; message: string }`.
Сообщения на русском, с контекстом: `"Офер 123: oldprice 1500 не больше price 1620 — oldprice убран"`.

`GeneratedFeedDTO`: `slug, format, url, offers_total, offers_written, offers_skipped, warnings, errors,
issues (первые N, полный список — в logs/feed-{slug}.log), generated_at`.

---

## 5. Правила YML Директа (что проверяет и как пишет `yandex-direct-goods`)

### Документ

1. `<?xml version="1.0" encoding="UTF-8"?>`, единственный корень `<yml_catalog date="YYYY-MM-DD hh:mm">`.
2. В `<shop>` строго по порядку: `name`, `company`, `url`, `currencies`, `categories`, `offers`, `collections`
   (`currencies` и `categories` — до `offers`, `collections` — после `offers`).
3. `<currencies>`: `<currency id="RUB" rate="1"/>`. Валюта магазина вне списка ТЗ → ошибка фида.
4. `<categories>`: `<category id="…" parentId="…">Имя</category>`. Ошибки фида: id не целое > 0 или длиннее
   18 знаков, дубль id, `parentId` на несуществующую категорию, цикл.
5. `<collections>` — только если есть каталоги; каталог без `url` или `name` → в отчёт и не пишется.
6. Ни одного валидного офера → ошибка фида, файл не заменяется.

### Атрибуты `<offer>`

| Правило | Уровень |
|---|---|
| `id` обязателен, ≤ 100 символов, уникален в фиде (второй и далее дубли — пропуск) | error |
| `id` не числовой — фильтр в Директе по id работать не будет | warning |
| `vendor` и `model` заполнены → `type="vendor.model"` | — |
| `type="vendor.model"` при пустом `vendor` или `model` невозможен — тогда офер упрощённый и нужен `name` | — |
| Нет ни `name`, ни пары `vendor`+`model` | error |
| `available` пишется всегда | — |

### Элементы `<offer>` (порядок записи фиксирован, как в примере ТЗ)

`url, price, oldprice, currencyId, categoryId, picture*, store, pickup, delivery, typePrefix, name, vendor, model,
vendorCode, description, video, sales_notes, manufacturer_warranty, country_of_origin, age, adult, downloadable,
market_category, param*, property*, collectionId*, custom_label_0..4, custom_score`.
Пустые (`null`, `""`) элементы не пишутся.

| Элемент | Правило | Уровень / действие |
|---|---|---|
| `url` | обязателен; http/https; ≤ 2048 после нормализации; кириллический домен → punycode; пробелы → `%20`; путь и query — percent‑encoding RFC 3986; `&` и прочее экранирует XMLWriter (`&amp;`); UTM фида дописывается к query | нет/невалиден/длиннее → error |
| `price` | > 0; целое → `1234`, дробное → `1234.56` (точка, без лишних нулей после округления до копеек) | 0, отрицательная, NaN → error. `null` → офер пишется без цены и валюты + warning (не попадёт в Товарную галерею) |
| `oldprice` | > 0 и строго > `price`; пишется только вместе с `price` | ≤ price или 0 → убираем, warning. Разница < 5 % → warning «скидку не покажут» |
| `currencyId` | обязателен при `price`; из списка ТЗ | не из списка → error |
| `categoryId` | ровно один; есть в `<categories>` | нет/не найден → error |
| `picture` | только http/https; не больше `max_pictures`; дубли убираем | невалидные убираем + warning; ноль картинок → warning (нужны для ЕПК и Товарной галереи) |
| `name` | обязателен для упрощённого; чистый текст; целиком ЗАГЛАВНЫМИ → warning | — |
| `typePrefix`, `vendor`, `model` | чистый текст | — |
| `description` | чистый текст (п.1) | — |
| `video` | одно; http/https; http → warning (не покажется на https‑площадках) | не URL → убираем, warning |
| `sales_notes`, `vendorCode`, `country_of_origin`, `market_category` | чистый текст | — |
| `store`, `pickup`, `delivery`, `manufacturer_warranty`, `adult`, `downloadable` | `true`/`false` | — |
| `age` | целое ≥ 0; пишем `<age unit="year">18</age>` (или `month`) | отрицательное/дробное → убираем, warning |
| `param` | `name` обязателен; для «Размер» обязателен `unit` из `RU/EU/US/INT`; для «Ширина/Глубина/Высота/Диаметр» — `unit` из `мм/см/м` | нарушение → param убираем, warning |
| `property` | `name` обязателен; не больше 10 | лишние отбрасываем, warning |
| `collectionId` | несколько; каждый есть в `<collections>` | несуществующий убираем, warning |
| `custom_label_0..4` | ≤ 175 символов; только латиница, кириллица, цифры и пробел | нарушение → label убираем, warning |
| `custom_score` | целое ≥ 0 | иначе убираем, warning |

### Экранирование (XMLWriter)

- Текст и атрибуты: `& → &amp;`, `< → &lt;`, `> → &gt;`, `" → &quot;`, `' → &apos;` (таблица ТЗ).
- Символы, запрещённые в XML 1.0 (управляющие `\x00–\x08`, `\x0B`, `\x0C`, `\x0E–\x1F`, одиночные суррогаты),
  удаляются — иначе файл не распарсится.
- Запись через `stream.write` с учётом backpressure (`drain`), чтобы большой фид не раздувал память.

---

## 6. Handler, Action, маршруты, job

```ts
// command/generate-feed-by-slug/handler.ts
/** Собирает фид по slug и атомарно кладёт в static/feeds. Без workflow: БД не меняется, откат = не переименовать tmp. */
@Injectable()
export class GenerateFeedBySlugHandler implements CommandHandler<GenerateFeedBySlugCommand, GeneratedFeedDTO> {
  constructor(
    private readonly settings: FeedSettings,        // define: список FeedConfig + dir + public_url
    private readonly formats: FeedFormatRegistry,
    private readonly source: FeedSource,
    private readonly files: AtomicFileWriter,
    private readonly logger: Logger,
    private readonly clock: Clock,
  ) {}
  // 1. config = settings.get(slug)          — нет → MedusaError NOT_FOUND "Фид foo не настроен"
  // 2. format = formats.get(config.format)
  // 3. log = logger.toFile(`feed-${slug}`)
  // 4. report = await files.write(path, (out) => format.write({ source, config, out }))
  // 5. issues → log (error/warn), итог → log.info, await log.flush()
  // 6. return GeneratedFeedDTO
}
```

- `POST /admin/feeds/:slug/generations` → `201 { feed_generation: GeneratedFeedDTO }`.
- `GET /admin/feeds` → `{ feeds: [{ slug, format, url }] }`.
- Job `feed-generate-all` (worker, раз в час; потом — ещё и по событию окончания импорта): по каждому фиду вызывает
  Handler, ошибку одного фида ловит и логирует, остальные продолжает.
- Логи: префикс `feed/generate-feed-by-slug:`; файл `logs/feed-{slug}.log`.

### Контейнер и env

```ts
// src/container/common/feed.ts
export const feedConfig = {
  source: process.env.FEED_SOURCE ?? "mock",             // mock | medusa
  dir: path.resolve(process.env.FEED_DIR || "static/feeds"),
  public_url: `${process.env.MEDUSA_FILE_URL ?? "http://localhost:9000/static"}/feeds`,
  timezone: process.env.FEED_TIMEZONE ?? "Europe/Moscow",
  feeds: [
    {
      slug: "yandex-direct",
      format: "yandex-direct-goods",
      only_available: false,
      utm: { utm_source: "yandex", utm_medium: "cpc", utm_campaign: "feed" },
      max_pictures: 5,
    },
  ],
};

export default [
  define(FeedSettings, () => new FeedSettings(feedConfig)),
  define(FeedSource, ({ get }) => get(MockFeedSource)),   // FEED_SOURCE=medusa → get(MedusaFeedSource)
  define(FeedFormatRegistry, ({ get }) => new FeedFormatRegistry([get(YandexDirectGoodsFormat)])),
  define(Clock, () => new SystemClock()),
];
```

Новые переменные — в `.env.template`: `FEED_SOURCE`, `FEED_DIR`, `FEED_TIMEZONE`, `SHOP_COMPANY`.
Строка `...feed` — в `src/container/dependencies.ts`.

---

## 7. Этапы реализации

Каждый этап закрыт, когда его тесты зелёные, `pnpm lint` и `tsc` проходят.

1. **Инфраструктура shared.** `XMLWriter`, `AtomicFileWriter`, `Clock` + unit‑тесты.
2. **Модель и контракты.** `catalog.ts`, `feed-config.ts`, `issue.ts`, `report.ts`, `FeedSource`, `FeedFormat`,
   `FeedFormatRegistry` + тесты реестра (неизвестный ключ, дубль ключа при регистрации).
3. **Чистые правила YML** (`yml/rules/*`) — по тесту на каждую ветку.
4. **`AbstractYMLFormat`**: обёртка, валюты, категории, каталоги, проход по страницам оферов, дубли id,
   подсчёт отчёта.
5. **`YandexDirectGoodsFormat`**: правила офера из п.5, порядок элементов.
6. **`MockFeedSource` и фикстуры** (п.8) + эталонный XML.
7. **Command / Query / Action / маршруты / job / контейнер / env.**
8. **Интеграционный тест** `integration-tests/http/feeds.spec.ts`.
9. **Порог покрытия**: скрипт `test:unit:coverage` с `coverageThreshold` 100 % (branches, functions, lines,
   statements) для `src/modules/feed/**` и `src/shared/service/{xml,file,clock}/**`; моки и фикстуры исключены
   из сбора.
10. Отметить пункт в `plan/backend.md`, ручная проверка файла в кабинете Директа (загрузка фида по URL).

---

## 8. Мок‑каталог (фикстуры)

Детерминированный, без случайностей — эталонный XML стабилен. Каждый офер помечен комментарием с правилом,
которое он проверяет.

**Категории:** `1 Электроника` → `2 Смартфоны`, `3 Ноутбуки`; `10 Одежда` → `11 Платья`; `20 Мебель` → `21 Диваны`.
Отдельные наборы для негативных тестов дерева: дубль id, `parentId` в никуда, цикл `30→31→30`, id `"abc"`,
id из 19 цифр.

**Каталоги:** `smartphones-sale` (полный), `sofas` (без picture и description), `broken` (без url — отбрасывается).

**Оферы (валидные):**

| id | Что проверяет |
|---|---|
| `1001` | упрощённый тип, полный набор элементов как в примере ТЗ (NOD32) |
| `1002` | `vendor.model` без name (принтер HP из ТЗ) |
| `1003` | комбинированный: name + typePrefix + vendor + model (Samsung Galaxy S22 Ultra) |
| `1004` | `available=false` (и исключается при `only_available`) |
| `1005` | `price` целое и `oldprice` со скидкой ≥ 5 % |
| `1006` | `price` дробное `1234.56`; `oldprice` со скидкой < 5 % → warning |
| `1007` | `oldprice` ≤ `price` → oldprice убран, warning |
| `1008` | URL с кириллическим доменом, пробелами, `&`, существующим query + UTM |
| `1009` | name/description со спецсимволами `& < > " '`, HTML‑тегами и управляющими символами |
| `1010` | 7 картинок (обрезка до 5), дубль картинки, `ftp://` картинка |
| `1011` | без картинок → warning |
| `1012` | `video` по http → warning |
| `1013` | params: цвет, материал, пол; размер с `unit="INT"` и `unit="RU"`; габариты в см; размер без unit и ширина в дюймах → убраны |
| `1014` | 12 properties → обрезка до 10 |
| `1015` | `age` +6 (year), 18 месяцев (month); `adult`, `downloadable` |
| `1016` | `collectionId` ×2, один несуществующий → убран |
| `1017` | `custom_label_0..4` валидные, label 176 символов, label со спецсимволами, `custom_score` 0 и −1 |
| `1018` | без `price` → пишется без цены и currencyId, warning |
| `1019` | name ЗАГЛАВНЫМИ → warning |
| `abc-12` | буквенно‑цифровой id → warning про фильтры |

**Оферы (отбрасываются):**

| id | Ошибка |
|---|---|
| `2001` | упрощённый без `name` |
| `2002` | есть `vendor`, нет `model`, нет `name` |
| `2003` | `price` = 0 |
| `2004` | категория `999`, которой нет |
| `2005` | без `url` |
| `2006` | URL длиннее 2048 после нормализации |
| `2007` | `url` с `javascript:` |
| `2008` | валюта `XXX` не из списка |
| `1001` | дубль id (второй экземпляр) |
| 101 символ | id длиннее 100 |
| `""` | пустой id |

Оферы отдаются страницами по 7 — проверяем, что дубли и счётчики работают через границу страниц.

---

## 9. Матрица тестов (ТЗ → тест)

| Требование ТЗ | Тест |
|---|---|
| Один корень `yml_catalog`, атрибут `date` формата `YYYY-MM-DD hh:mm` | `format-yml-date.unit.spec` (полночь, однозначные месяц/день, смена суток по таймзоне), эталон |
| `currencies` и `categories` до `offers`, `collections` после | `abstract-yml-format.unit.spec` — порядок дочерних `shop` |
| id уникален, ≤ 100, буквы/цифры/символы | `check-offer`: пустой, 100, 101, дубль в одной странице и через границу страниц |
| Совет: числовой id для фильтров | `check-offer`: warning на `abc-12` |
| `type="vendor.model"` ⇒ vendor+model; без type ⇒ name; комбинированный | `yandex-direct-goods-format`: 1001/1002/1003/2001/2002 |
| `available` true/false | 1004 + `only_available` |
| `categoryId` целое > 0, ≤ 18 знаков, один, существует | `check-category-tree` (все негативы), 2004 |
| `url` ≤ 2048, кириллица → punycode, RFC 3986, пробелы → `%20`, экранирование `& " ' < >` | `normalize-url.unit.spec`, `apply-utm.unit.spec`, `xml-writer.unit.spec`, 1008, 2005–2007 |
| `picture` http/https, рекомендуем 5 | 1010, 1011 |
| `description` без рекламы/HTML | `sanitize-text.unit.spec`, 1009 |
| `param` с `name`; размер с сеткой `RU/EU/US/INT`; габариты с `мм/см/м` | 1013 |
| `price` целое/дробное через точку, не 0 | `format-price.unit.spec` (целое, дробное, округление до копеек, 1e21, NaN, отрицательное), 1005/1006/1018/2003 |
| `oldprice` > price, не 0; скидка ≥ 5 % | 1005/1006/1007 |
| `currencyId` из списка, обязателен при price | `currencies` (все коды из ТЗ), 2008, 1018 |
| `video` одно, http не покажется на https | 1012 |
| `store/pickup/delivery/manufacturer_warranty/adult/downloadable` | 1001, 1015 — только `true`/`false` |
| `age` целое ≥ 0, `+` допустим | 1015 + невалидные значения |
| `collectionId` несколько, ссылается на `collections` | 1016 |
| `custom_label_0..4` ≤ 175, буквы/цифры; `custom_score` целое ≥ 0 | 1017 |
| `property` до 10 | 1014 |
| `collections`: `name` обязателен, `picture`/`description` по возможности | `abstract-yml-format`: `smartphones-sale`, `sofas`, `broken` |
| Фид — валидный XML | эталонный тест парсит результат (`fast-xml-parser`, devDependency) и сравнивает с `__fixtures__/yandex-direct-goods.expected.xml` |
| Потоковая запись | `xml-writer`: backpressure (поток с `highWaterMark: 1`), `AtomicFileWriter`: ошибка в середине — tmp удалён, старый файл цел |
| Ни одного валидного офера | Handler: `MedusaError INVALID_DATA`, старый файл не тронут |
| Неизвестный slug / формат | Handler: `NOT_FOUND`; реестр: `NOT_FOUND` |
| Отчёт | Handler: счётчики, issues в файловом логе, `flush` вызван |
| HTTP | `feeds.spec.ts`: без авторизации 401; `POST /admin/feeds/yandex-direct/generations` → 201, файл в `FEED_DIR`, парсится; неизвестный slug → 404; `GET /admin/feeds` |

Тестовые утилиты: `FixedClock` (наследник `Clock`), `InMemoryFeedSource` для точечных кейсов (без фикстур мока),
`collect(stream)` → строка.

---

## 10. Что дальше (вне этого плана)

- `MedusaFeedSource`: чтение вариантов через Query постранично, цены через `QueryContext` (регион RU),
  наличие из inventory, картинки — копия `w960` из ImageResizer (≥ 450 px по стороне, требование ТЗ),
  `feed_id` для категорий, бренд из модуля `brand`, характеристики из `attribute`.
- Настройки фидов в админке (таблица `feed`, отбор по категориям/брендам/марже, маппинг категорий) — этап 13.2.
- `YandexMarketFormat`, `GoogleMerchantFormat` (RSS 2.0 + `g:`, те же id), `VKFormat`.
- Генерация по событию окончания импорта поставщика.
