import "reflect-metadata";

/** Конструктор класса, в том числе абстрактного: ключ для контейнера. */
export type ClassToken<T> = abstract new (...args: never[]) => T;

/** Токен параметра конструктора, которому нужен контейнер Medusa. */
export const MEDUSA_CONTAINER = Symbol("medusa-container");

const PARAM_TOKENS = Symbol("param-tokens");

type ParamToken = ClassToken<unknown> | typeof MEDUSA_CONTAINER;

/**
 * Класс, который контейнер собирает сам по типам параметров конструктора.
 * Зависимости импортируются как значения: после `import type` тип стирается и собрать класс нельзя.
 */
export function Injectable(): ClassDecorator {
  return () => undefined;
}

/** Параметр конструктора получает контейнер Medusa (`MedusaContainer` — интерфейс, по типу его не найти). */
export function InjectContainer(): ParameterDecorator {
  return (target, _propertyKey, index) => {
    const tokens: Record<number, ParamToken> = { ...Reflect.getMetadata(PARAM_TOKENS, target) };
    tokens[index] = MEDUSA_CONTAINER;
    Reflect.defineMetadata(PARAM_TOKENS, tokens, target);
  };
}

/** Что передать в каждый параметр конструктора: явный токен или тип из метаданных TypeScript. */
export function getParamTokens(target: ClassToken<unknown>): unknown[] {
  const types: unknown[] = Reflect.getMetadata("design:paramtypes", target) ?? [];
  const tokens: Record<number, ParamToken> = Reflect.getMetadata(PARAM_TOKENS, target) ?? {};
  return types.map((type, index) => tokens[index] ?? type);
}
