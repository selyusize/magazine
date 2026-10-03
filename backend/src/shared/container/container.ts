import type { MedusaContainer } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

import {
  getParamTokens,
  MEDUSA_CONTAINER,
  type ClassToken,
} from "./injectable";

/** Что получает фабрика из `define`: другие зависимости и контейнер Medusa. */
export type FactoryContext = {
  get<T>(token: ClassToken<T>): T;
  container: MedusaContainer;
};

export type Definition<T> = {
  token: ClassToken<T>;
  factory: (context: FactoryContext) => T;
};

/** Как собрать класс, когда автосборки мало: значения из конфига, выбор реализации абстрактного класса. */
export function define<T>(
  token: ClassToken<T>,
  factory: (context: FactoryContext) => T,
): Definition<T> {
  return { token, factory };
}

const NOT_A_CLASS = new Set<unknown>([
  Object,
  String,
  Number,
  Boolean,
  Array,
  Function,
  Symbol,
  undefined,
]);

/** Экземпляр класса-токена: проверка вместо приведения — `define` с чужим классом ловится сразу. */
function ensureInstance<T>(value: unknown, token: ClassToken<T>): T {
  if (value instanceof token) return value;
  throw new MedusaError(
    MedusaError.Types.UNEXPECTED_STATE,
    `Контейнер: для ${token.name} получен объект другого класса — проверьте define()`,
  );
}

const isClassToken = (value: unknown): value is ClassToken<unknown> => typeof value === "function";

/**
 * Контейнер приложения: определения из `define`, остальное — автосборка классов с `@Injectable()`.
 * `from(container)` открывает область: внутри неё каждый класс создаётся один раз.
 */
export function createContainer(definitions: Definition<unknown>[]) {
  const factories = new Map(
    definitions.map((definition) => [definition.token, definition.factory]),
  );

  return {
    from(container: MedusaContainer) {
      const instances = new Map<ClassToken<unknown>, unknown>();
      const resolving: ClassToken<unknown>[] = [];

      const get = <T>(token: ClassToken<T>): T => {
        if (instances.has(token)) return ensureInstance(instances.get(token), token);

        if (resolving.includes(token)) {
          const chain = [...resolving, token]
            .map((item) => item.name)
            .join(" → ");
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            `Контейнер: циклическая зависимость ${chain}`,
          );
        }

        resolving.push(token);
        const factory = factories.get(token);
        const instance = ensureInstance(factory ? factory({ get, container }) : build(token), token);
        resolving.pop();

        instances.set(token, instance);
        return instance;
      };

      const build = <T>(token: ClassToken<T>): T => {
        const args = getParamTokens(token).map((param, index) => {
          if (param === MEDUSA_CONTAINER) return container;
          if (NOT_A_CLASS.has(param) || !isClassToken(param)) {
            throw new MedusaError(
              MedusaError.Types.UNEXPECTED_STATE,
              `Контейнер: не удалось собрать ${token.name} — параметр #${index + 1} не класс. ` +
                "Для значений из конфига опишите класс через define(), для классов уберите `import type`.",
            );
          }
          return get(param);
        });
        return ensureInstance(Reflect.construct(token, args), token);
      };

      return { get };
    },
  };
}
