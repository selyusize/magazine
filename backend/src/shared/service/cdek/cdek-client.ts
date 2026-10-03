import type { Logger } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";

import { oneOfOrNull } from "../../query/narrow";
import type { Parcel } from "../delivery/parcel";
import { errorMessage } from "../error/error-message";

export type CDEKOptions = {
  /** `https://api.cdek.ru` — рабочий контур, `https://api.edu.cdek.ru` — тестовый. */
  base_url: string;
  client_id: string;
  client_secret: string;
};

export type CDEKCity = {
  code: number;
  name: string;
};

export type CDEKTariff = {
  /** ₽ с НДС */
  price: number;
  period_min: number;
  period_max: number;
};

export type CDEKPickupPoint = {
  code: string;
  name: string;
  type: "PVZ" | "POSTAMAT";
  address: string;
  city: string;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  work_time: string | null;
  phone: string | null;
};

const PICKUP_POINT_TYPES = ["PVZ", "POSTAMAT"] as const;

/** Ответы API, которые читает клиент: всё лишнее отбрасывается, не то — понятная ошибка, а не падение дальше. */
const TokenSchema = z.object({ access_token: z.string().optional(), expires_in: z.number().optional() });
const CitiesSchema = z.array(z.object({ code: z.number(), full_name: z.string() }));
const TariffSchema = z.object({ total_sum: z.number(), period_min: z.number(), period_max: z.number() });
const PickupPointSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.string(),
  work_time: z.string().optional(),
  phones: z.array(z.object({ number: z.string() })).optional(),
  location: z.object({
    city: z.string(),
    postal_code: z.string().optional(),
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
});
const ErrorsSchema = z.object({ errors: z.array(z.object({ message: z.string() })).optional() });

/** Запас до истечения токена: не отправлять запрос с токеном, который умрёт по дороге. */
const TOKEN_MARGIN_MS = 60_000;

/**
 * Клиент API СДЭК v2: города, тарифы, пункты выдачи. Токен OAuth живёт час и хранится в экземпляре —
 * провайдер доставки держит клиент всё время работы процесса, поэтому токен запрашивается раз в час.
 */
export class CDEKClient {
  private token: { value: string; expires_at: number } | null = null;

  constructor(
    private readonly options: CDEKOptions,
    private readonly logger: Logger,
  ) {}

  /** Город по названию (`Москва`) — код города нужен калькулятору и списку ПВЗ. */
  async findCity(name: string): Promise<CDEKCity | null> {
    const cities = await this.request("GET", "/v2/location/suggest/cities", CitiesSchema, {
      query: { name: name.trim(), country_code: "RU" },
    });
    const normalized = name.trim().toLowerCase();
    const city =
      cities.find((item) =>
        item.full_name.toLowerCase().startsWith(`${normalized},`),
      ) ??
      cities[0] ??
      null;
    return city && { code: city.code, name: city.full_name.split(",")[0] };
  }

  async calculateTariff(input: {
    tariff_code: number;
    from_city_code: number;
    to_city_code: number;
    /** Для доставки до двери — улица и дом, без города. */
    to_address?: string;
    parcel: Parcel;
  }): Promise<CDEKTariff> {
    const result = await this.request("POST", "/v2/calculator/tariff", TariffSchema, {
      body: {
        tariff_code: input.tariff_code,
        from_location: { code: input.from_city_code },
        to_location: {
          code: input.to_city_code,
          ...(input.to_address ? { address: input.to_address } : {}),
        },
        packages: [
          {
            weight: Math.ceil(input.parcel.weight),
            length: Math.ceil(input.parcel.length),
            width: Math.ceil(input.parcel.width),
            height: Math.ceil(input.parcel.height),
          },
        ],
      },
    });
    return {
      price: result.total_sum,
      period_min: result.period_min,
      period_max: result.period_max,
    };
  }

  async listPickupPoints(cityCode: number): Promise<CDEKPickupPoint[]> {
    const points = await this.request("GET", "/v2/deliverypoints", z.array(PickupPointSchema), {
      query: { city_code: String(cityCode), is_handout: "true" },
    });
    return points.flatMap(toPickupPoint);
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expires_at > Date.now())
      return this.token.value;

    const url = new URL("/v2/oauth/token", this.options.base_url);
    url.search = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.options.client_id,
      client_secret: this.options.client_secret,
    }).toString();

    const response = await this.send(url, { method: "POST" });
    const parsed = TokenSchema.safeParse(await response.json().catch(() => null));
    const body = parsed.success ? parsed.data : {};
    if (!response.ok || !body.access_token) {
      this.logger.error(
        `delivery/cdek: не удалось получить токен, HTTP ${response.status}`,
      );
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "СДЭК: не удалось авторизоваться, проверьте ключи",
      );
    }

    this.token = {
      value: body.access_token,
      expires_at:
        Date.now() + (body.expires_in ?? 3600) * 1000 - TOKEN_MARGIN_MS,
    };
    return this.token.value;
  }

  private async request<S extends z.ZodType>(
    method: "GET" | "POST",
    path: string,
    schema: S,
    { query, body }: { query?: Record<string, string>; body?: unknown },
  ): Promise<z.infer<S>> {
    const url = new URL(path, this.options.base_url);
    if (query) url.search = new URLSearchParams(query).toString();

    const response = await this.send(url, {
      method,
      headers: {
        authorization: `Bearer ${await this.accessToken()}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload: unknown = await response.json().catch(() => null);
    const envelope = ErrorsSchema.safeParse(payload);
    const errors = envelope.success ? envelope.data.errors : undefined;
    if (!response.ok || errors?.length) {
      const message =
        errors?.map((error) => error.message).join("; ") ||
        `HTTP ${response.status}`;
      this.logger.warn(`delivery/cdek: ${method} ${path} — ${message}`);
      throw new MedusaError(
        response.status >= 500
          ? MedusaError.Types.UNEXPECTED_STATE
          : MedusaError.Types.INVALID_DATA,
        `СДЭК: ${message}`,
      );
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`delivery/cdek: ${method} ${path} — неожиданный ответ: ${parsed.error.message}`);
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "СДЭК: неожиданный ответ API");
    }
    return parsed.data;
  }

  /** Сетевые ошибки (DNS, таймаут) — тоже MedusaError: витрина покажет «доставка недоступна», а не 500 без текста. */
  private async send(url: URL, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
    } catch (error) {
      this.logger.error(
        `delivery/cdek: ${url.pathname} недоступен: ${errorMessage(error)}`,
      );
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "СДЭК временно недоступен",
      );
    }
  }
}

/** Пункт выдачи СДЭК; не ПВЗ и не постамат (склад, офис) — пусто. */
const toPickupPoint = (point: z.infer<typeof PickupPointSchema>): CDEKPickupPoint[] => {
  const type = oneOfOrNull(point.type, PICKUP_POINT_TYPES);
  if (!type) return [];
  return [
    {
      code: point.code,
      name: point.name,
      type,
      address: point.location.address,
      city: point.location.city,
      postal_code: point.location.postal_code || null,
      latitude: point.location.latitude,
      longitude: point.location.longitude,
      work_time: point.work_time || null,
      phone: point.phones?.[0]?.number ?? null,
    },
  ];
};
