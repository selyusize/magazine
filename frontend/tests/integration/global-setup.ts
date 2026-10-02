/** Интеграционные тесты идут против живой Medusa — проверяем, что она доступна и настроена. */
export default async function setup() {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

  const health = await fetch(`${apiUrl}/health`).catch(() => null);
  if (!health?.ok) {
    throw new Error(`Medusa недоступна на ${apiUrl}. Запустите \`make dev-up\` или используйте \`make test\`.`);
  }
  if (!process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    throw new Error("Нет NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY в frontend/.env.local — выполните `make dev-install`.");
  }
}
