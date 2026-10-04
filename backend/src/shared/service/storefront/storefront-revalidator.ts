import type { Logger } from "@medusajs/framework/types";

/** Путь вебхука на витрине магазина — контракт `docs/storefront.md`. */
export const REVALIDATE_PATH = "/api/revalidate";

/** Заголовок с секретом магазина. */
export const REVALIDATE_SECRET_HEADER = "x-revalidate-secret";

export type StorefrontRevalidatorOptions = {
  /** Сколько ждать ответа витрины, мс. */
  timeout_ms: number;
  /** Кому можно слать вебхук (хост без порта); пусто — всем. Тесты — только loopback: в сеть не ходят. */
  allowed_hosts: string[];
};

export type RevalidationRequest = {
  storefront_url: string;
  secret: string;
  tags: string[];
};

/**
 * Итог одной отправки — в журнал; `status` — HTTP-код ответа витрины, `null` — ответа не было; `retryable: false` —
 * повтор не поможет.
 */
export type RevalidationResult =
  | { ok: true; status: number }
  | { ok: false; status: number | null; error: string; retryable: boolean };

type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

/** URL вебхука: `https://olisa.ru` → `https://olisa.ru/api/revalidate` (путь витрины, если он есть, сохраняется). */
export const revalidateURL = (storefrontURL: string): string =>
  `${storefrontURL.replace(/\/+$/, "")}${REVALIDATE_PATH}`;

/**
 * Вебхук ревалидации витрины: POST `{ tags }` с секретом магазина. Ошибку не бросает, а возвращает — журнал
 * отправок и повтор решает команда `send-storefront-revalidation`.
 */
export class StorefrontRevalidator {
  constructor(
    private readonly options: StorefrontRevalidatorOptions,
    private readonly logger: Pick<Logger, "warn">,
    private readonly fetchFn: FetchFn = fetch,
  ) {}

  async revalidate(request: RevalidationRequest): Promise<RevalidationResult> {
    const url = revalidateURL(request.storefront_url);
    const host = URL.canParse(url) ? new URL(url).hostname : "";
    if (this.options.allowed_hosts.length && !this.options.allowed_hosts.includes(host)) {
      return { ok: false, status: null, error: `хост «${host}» не в STOREFRONT_REVALIDATE_HOSTS`, retryable: false };
    }
    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", [REVALIDATE_SECRET_HEADER]: request.secret },
        body: JSON.stringify({ tags: request.tags }),
        signal: AbortSignal.timeout(this.options.timeout_ms),
      });
      if (response.ok) return { ok: true, status: response.status };

      const error = `витрина ответила ${response.status}`;
      this.logger.warn(`shop/send-storefront-revalidation: ${url} — ${error}`);
      return { ok: false, status: response.status, error, retryable: true };
    } catch (cause) {
      const error = `витрина недоступна: ${cause instanceof Error ? cause.message : String(cause)}`;
      this.logger.warn(`shop/send-storefront-revalidation: ${url} — ${error}`);
      return { ok: false, status: null, error, retryable: true };
    }
  }
}
