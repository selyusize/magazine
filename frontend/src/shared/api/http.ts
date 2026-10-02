import { env } from "@shared/config";

import { camelToSnake, camelizeKeys, snakeizeKeys } from "./case";

export class ApiError<TBody = unknown> extends Error {
  constructor(
    public readonly status: number,
    public readonly body: TBody,
    public readonly response: Response,
  ) {
    super(`API ${response.url} responded with ${status}`);
    this.name = "ApiError";
  }
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return camelizeKeys(await response.json());
  if (contentType.startsWith("text/")) return response.text();
  return response.blob();
}

/** `?regionId=…&createdAt[$gt]=…` → `?region_id=…&created_at[$gt]=…` (значения не трогаем). */
function toBackendUrl(url: string): string {
  const [path, query] = url.split("?", 2);
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(query)) params.append(camelToSnake(key), value);
  return `${path}?${params}`;
}

/** Тело запроса Orval — JSON-строка в camelCase; бэкенду нужен snake_case. FormData и пр. — как есть. */
function toBackendBody(body: RequestInit["body"], headers: Headers): RequestInit["body"] {
  if (typeof body !== "string" || !headers.get("Content-Type")?.includes("application/json")) return body;
  return JSON.stringify(snakeizeKeys(JSON.parse(body)));
}

/**
 * Mutator для Orval: через него идут все сгенерированные запросы.
 * Поля: бэкенд snake_case ↔ фронт camelCase (правило — ./case.ts, им же сгенерированы типы).
 * В `options` можно передать и Next-специфичные поля, например `next: { tags, revalidate }`.
 */
export async function http<T>(url: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = typeof window === "undefined" ? env.serverApiUrl : env.publicApiUrl;

  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("x-publishable-api-key")) {
    headers.set("x-publishable-api-key", env.publishableKey);
  }

  const response = await fetch(`${baseUrl}${toBackendUrl(url)}`, {
    credentials: "include",
    ...options,
    headers,
    body: toBackendBody(options.body, headers),
  });

  const body = await parseBody(response);
  if (!response.ok) throw new ApiError(response.status, body, response);
  return body as T;
}

export type ErrorType<TBody> = ApiError<TBody>;
export type BodyType<TBody> = TBody;
