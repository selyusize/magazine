/**
 * Хранилище cookie вместо `next/headers` в интеграционных тестах.
 * Server Actions пишут и читают cookie так же, как в Next (одно хранилище = один посетитель),
 * а тесты проверяют, что и с какими опциями было записано.
 */
type StoredCookie = { value: string; options: Record<string, unknown> };

const jar = new Map<string, StoredCookie>();

export const cookieJar = {
  get: (name: string) => jar.get(name),
  value: (name: string) => jar.get(name)?.value,
  set: (name: string, value: string, options: Record<string, unknown> = {}) => {
    jar.set(name, { value, options });
  },
  clear: () => jar.clear(),
};

/** Реализация `cookies()` из `next/headers` поверх cookieJar. */
export async function cookies() {
  return {
    get: (name: string) => {
      const cookie = jar.get(name);
      return cookie ? { name, value: cookie.value } : undefined;
    },
    getAll: () => [...jar].map(([name, { value }]) => ({ name, value })),
    has: (name: string) => jar.has(name),
    set: (name: string, value: string, options: Record<string, unknown> = {}) => {
      jar.set(name, { value, options });
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  };
}
