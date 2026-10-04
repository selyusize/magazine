import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createUserAccountWorkflow } from "@medusajs/medusa/core-flows";

import { Container } from "../../../src/container";
import type { CreateShopCommand } from "../../../src/modules/shop/command/create-shop/command";
import type { CreatedShopDTO } from "../../../src/modules/shop/command/create-shop/dto";
import { CreateShopHandler } from "../../../src/modules/shop/command/create-shop/handler";

type API = {
  post: (
    url: string,
    body?: unknown,
    config?: unknown,
  ) => Promise<{ data: { token: string } }>;
};

let shopCounter = 0;
let adminCounter = 0;

/**
 * Магазин для Store API: ключ без магазина Store API не пускает (403), поэтому — через `create-shop`, как кнопка в
 * админке. Slug уникален в пределах прогона файла.
 */
export async function createTestShop(
  container: MedusaContainer,
  data: Partial<CreateShopCommand> = {},
): Promise<CreatedShopDTO> {
  shopCounter += 1;
  const slug = data.slug ?? `test-${shopCounter}-${Date.now().toString(36)}`;
  return Container.from(container)
    .get(CreateShopHandler)
    .handle({
      slug,
      name: `Тест ${slug}`,
      domain: `${slug}.test.local`,
      storefront_url: `https://${slug}.test.local`,
      settings: {},
      ...data,
    });
}

/**
 * Корень дерева нового магазина: категория без родителя или под ничьей категорией — 400 (хук `categoriesCreated`),
 * поэтому тестовые категории создаются под ним.
 */
export async function testCategoryRoot(container: MedusaContainer): Promise<string> {
  return (await createTestShop(container)).root_category_id;
}

/** Канал нового магазина для `sales_channels` товара: товар без ровно одного канала магазина — 400 (хук). */
export async function testSalesChannels(
  container: MedusaContainer,
): Promise<{ id: string }[]> {
  return [{ id: (await createTestShop(container)).sales_channel_id ?? "" }];
}

/** Заголовок с publishable-ключом нового магазина для Store API. */
export async function storeHeaders(
  container: MedusaContainer,
): Promise<Record<string, string>> {
  const shop = await createTestShop(container);
  return { "x-publishable-api-key": shop.publishable_api_key ?? "" };
}

/** Админ через обычный вход по email/паролю — заголовок с его JWT для Admin API. */
export async function adminHeaders(
  api: API,
  container: MedusaContainer,
): Promise<Record<string, string>> {
  // Счётчик — два админа в одну миллисекунду (`Promise.all`) получили бы один email
  adminCounter += 1;
  const email = `admin-${adminCounter}-${Date.now()}@test.local`;
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

/**
 * Админ в новом магазине: JWT + `x-shop-id`. Разделы магазина (поставщики, бренды, характеристики, импорт) без
 * заголовка отвечают 400, чужие сущности — 404.
 */
export async function adminShopHeaders(
  api: API,
  container: MedusaContainer,
): Promise<{ headers: Record<string, string>; shop: CreatedShopDTO }> {
  const [headers, shop] = await Promise.all([
    adminHeaders(api, container),
    createTestShop(container),
  ]);
  return { headers: { ...headers, "x-shop-id": shop.id }, shop };
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

/** Один магазин целиком: ключ витрины, админ с его `x-shop-id`, корень дерева и канал для товаров. */
export type TestShopContext = {
  shop: CreatedShopDTO;
  store: Record<string, string>;
  admin: Record<string, string>;
  root_category_id: string;
  sales_channels: { id: string }[];
};

/**
 * Магазин для сценариев «сущность → её адрес → редирект»: пути и редиректы у каждого магазина свои, поэтому сущности
 * создаются и читаются в одном магазине.
 */
export async function testShopContext(api: API, container: MedusaContainer): Promise<TestShopContext> {
  const { headers, shop } = await adminShopHeaders(api, container);
  return {
    shop,
    store: { "x-publishable-api-key": shop.publishable_api_key ?? "" },
    admin: headers,
    root_category_id: shop.root_category_id,
    sales_channels: [{ id: shop.sales_channel_id ?? "" }],
  };
}
