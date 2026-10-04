import { parseCorsOrigins } from "@medusajs/framework/utils";

/** Разрешённые источники: список из env (строки и `/regexp/`, как в Medusa) плюс origin витрин из таблицы `shop`. */
export type AllowedOrigins = {
  static: (string | RegExp)[];
  storefronts: string[];
};

/** `STORE_CORS` / `AUTH_CORS` → список Medusa: через запятую, `/…/` — регулярное выражение. */
export const parseOrigins = (value: string): (string | RegExp)[] =>
  parseCorsOrigins(
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .join(","),
  ).map((origin) =>
    typeof origin === "string" ? origin.replace(/\/+$/, "") : origin,
  );

/** Origin витрины магазина: из адреса витрины и из домена (https). Некорректный адрес — пропускается. */
export function storefrontOrigins(shop: {
  domain: string;
  storefront_url: string;
}): string[] {
  const origins = new Set([`https://${shop.domain}`]);
  if (URL.canParse(shop.storefront_url))
    origins.add(new URL(shop.storefront_url).origin);
  return [...origins];
}

export function isAllowedOrigin(
  origin: string,
  allowed: AllowedOrigins,
): boolean {
  const normalized = origin.replace(/\/+$/, "");
  return (
    allowed.storefronts.includes(normalized) ||
    allowed.static.some((rule) =>
      typeof rule === "string" ? rule === normalized : rule.test(normalized),
    )
  );
}
