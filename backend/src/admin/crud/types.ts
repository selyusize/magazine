/** Строка CRUD-ресурса, как её отдаёт Admin API (`src/shared/crud` на бэкенде). */
export type CRUDRow = { id: string } & Record<string, unknown>;

export const isCRUDRow = (value: unknown): value is CRUDRow =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string";

/** Поле формы: что рисовать и как превратить значение в тело запроса. */
export type CRUDField =
  | {
      name: string;
      type: "text";
      required?: boolean;
      nullable?: boolean;
      placeholder?: string;
      /** Задаётся только при создании (slug магазина): в форме изменения поле заблокировано и не отправляется. */
      createOnly?: boolean;
    }
  | { name: string; type: "textarea"; nullable?: boolean; rows?: number }
  /** Целое число; пусто — поле не отправляется (значение по умолчанию на бэкенде). */
  | { name: string; type: "number"; default?: number; min?: number }
  | { name: string; type: "boolean"; default?: boolean }
  | {
      name: string;
      type: "select";
      options: readonly string[];
      default: string;
    }
  | { name: string; type: "category"; required?: boolean }
  /** Объект JSON в textarea (фильтры посадочной), пусто — `{}`. */
  | { name: string; type: "json" }
  /** Только показ в форме изменения (publishable-ключ магазина): не отправляется, в форме создания скрыто. */
  | { name: string; type: "readonly" };

/** Колонка таблицы; `key` — поле строки, через точку для вложенных (`category.name`). */
export type CRUDColumn = {
  key: string;
  kind?: "text" | "mono" | "boolean" | "badge";
};

/**
 * Описание раздела админки для CRUD-фабрики: одна страница со списком, поиском, формой в шторке и удалением.
 * Тексты — в `i18n/json/*.json` под ключом `i18n` (`brands.title`, `brands.fields.name`…), общие — под `crud`.
 */
export type CRUDResource = {
  /** Admin API: `/admin/brands`. */
  path: string;
  /** Ключи ответа: `{ brand }`, `{ brands, count }`. */
  response: { one: string; many: string };
  /** Префикс ключей перевода. */
  i18n: string;
  /** Поле с названием — в подтверждении удаления. */
  title: string;
  columns: CRUDColumn[];
  fields: CRUDField[];
  /** `false` — записи не удаляются (магазины выключают): в таблице нет пункта «Удалить». */
  canDelete?: boolean;
  /** Адрес страницы на витрине — колонка «Адрес на витрине». */
  storefrontPath?: (row: CRUDRow) => string | null;
};

/**
 * Настройки-синглтон (реквизиты сети): одна форма без списка. GET `path` → `{ [response]: {...} }`, POST `path` —
 * только изменённые поля. Тексты — `{i18n}.title|description|fields|hints`.
 */
export type SettingsResource = {
  path: string;
  response: string;
  i18n: string;
  fields: CRUDField[];
};
