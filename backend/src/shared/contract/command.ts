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
