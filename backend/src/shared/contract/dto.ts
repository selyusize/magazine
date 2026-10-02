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
