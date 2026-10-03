import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createUserAccountWorkflow,
} from "@medusajs/medusa/core-flows";

type API = {
  post: (
    url: string,
    body?: unknown,
    config?: unknown,
  ) => Promise<{ data: { token: string } }>;
};

/** Заголовок с publishable-ключом для Store API. */
export async function storeHeaders(
  container: MedusaContainer,
): Promise<Record<string, string>> {
  const {
    result: [apiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [{ title: "Test", type: "publishable", created_by: "" }],
    },
  });
  return { "x-publishable-api-key": apiKey.token };
}

/** Админ через обычный вход по email/паролю — заголовок с его JWT для Admin API. */
export async function adminHeaders(
  api: API,
  container: MedusaContainer,
): Promise<Record<string, string>> {
  const email = `admin-${Date.now()}@test.local`;
  const password = "secret-password";

  await api.post("/auth/user/emailpass/register", { email, password });
  const [identity] = await container
    .resolve(Modules.AUTH)
    .listAuthIdentities({ provider_identities: { entity_id: email } } as never);
  await createUserAccountWorkflow(container).run({
    input: { authIdentityId: identity.id, userData: { email } },
  });

  const { data } = await api.post("/auth/user/emailpass", { email, password });
  return { authorization: `Bearer ${data.token}` };
}

/** Подписчики работают асинхронно — ждём, пока условие выполнится. */
export async function waitFor<T>(
  check: () => Promise<T | null | undefined | false>,
  timeoutMs = 10_000,
): Promise<T> {
  const started = Date.now();
  for (;;) {
    const result = await check();
    if (result) return result;
    if (Date.now() - started > timeoutMs)
      throw new Error("waitFor: условие не выполнилось вовремя");
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
