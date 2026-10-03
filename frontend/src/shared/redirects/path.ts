/**
 * Тот же вид пути, что у правил в Medusa (`backend/src/modules/redirect/service/path.ts`): без query, с ведущим
 * и без завершающего слеша, в декодированном виде. `/Каталог/` и `/%D0%9A%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3`
 * дают один ключ. Регистр не трогаем — пути регистрозависимы.
 */
export function normalizePath(pathname: string): string {
  const path = `/${decodePath(pathname.split(/[?#]/)[0]!.trim())}`.replace(/\/{2,}/g, "/");
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** `%D1%84` → `ф`; битую последовательность и закодированные `/?#%` оставляем как есть — так же делает бэкенд. */
function decodePath(path: string): string {
  return path.replace(/(?:%[0-9a-f]{2})+/gi, (sequence) => {
    const bytes = sequence.match(/%([0-9a-f]{2})/gi)!.map((byte) => parseInt(byte.slice(1), 16));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
    return decoded.includes("�") || /[/?#%]/.test(decoded) ? sequence : decoded;
  });
}
