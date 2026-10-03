import type { Logger } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";

import { oneOfOrNull } from "../../query/narrow";
import type { Parcel } from "../delivery/parcel";
import { errorMessage } from "../error/error-message";

export type YandexDeliveryOptions = {
  /** `https://b2b-authproxy.taxi.yandex.net` — рабочий контур, `https://b2b.taxi.tst.yandex.net` — тестовый. */
  base_url: string;
  token: string;
};

/** Откуда или куда: склад/ПВЗ Яндекса по id или адрес одной строкой. */
export type YandexDeliveryPoint =
  { platform_station_id: string } | { address: string };

export type YandexDeliveryTariff = {
  /** ₽ с НДС */
  price: number;
  days: number;
};

export type YandexPickupPoint = {
  id: string;
  name: string;
  type: "pickup_point" | "terminal" | "post_office";
  address: string;
  city: string;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  work_time: string | null;
  phone: string | null;
};

const PICKUP_POINT_TYPES = ["pickup_point", "terminal", "post_office"] as const;

const TimeSchema = z.object({ hours: z.number(), minutes: z.number() });
const ScheduleSchema = z.object({
  restrictions: z.array(z.object({ days: z.array(z.number()), time_from: TimeSchema, time_to: TimeSchema })),
});
type Schedule = z.infer<typeof ScheduleSchema>;

/** Ответы API, которые читает клиент: всё лишнее отбрасывается, не то — понятная ошибка. */
const DetectSchema = z.object({ variants: z.array(z.object({ geo_id: z.number(), address: z.string() })) });
const PricingSchema = z.object({ pricing_total: z.string(), delivery_days: z.number() });
const PickupPointSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  position: z.object({ latitude: z.number(), longitude: z.number() }),
  address: z.object({ locality: z.string(), full_address: z.string(), postal_code: z.string().optional() }),
  contact: z.object({ phone: z.string().optional() }).optional(),
  schedule: ScheduleSchema.optional(),
});
const PointsSchema = z.object({ points: z.array(PickupPointSchema) });
const ErrorSchema = z.object({ code: z.string().optional(), message: z.string().optional() });

const DAY_NAMES = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const pad = (value: number): string => String(value).padStart(2, "0");

/** Расписание ПВЗ из API → «Пн–Пт 10:00–20:00, Сб–Вс 10:00–18:00»; круглосуточно — «Пн–Вс круглосуточно». */
export function formatSchedule(schedule: Schedule | undefined): string | null {
  if (!schedule?.restrictions?.length) return null;

  const byDay = new Map<number, string>();
  for (const { days, time_from, time_to } of schedule.restrictions) {
    const allDay =
      time_from.hours === 0 &&
      time_from.minutes === 0 &&
      time_to.hours === 23 &&
      time_to.minutes === 59;
    const time = allDay
      ? "круглосуточно"
      : `${pad(time_from.hours)}:${pad(time_from.minutes)}–${pad(time_to.hours)}:${pad(time_to.minutes)}`;
    days.forEach((day) => byDay.set(day, time));
  }

  const groups: { from: number; to: number; time: string }[] = [];
  for (let day = 1; day <= 7; day++) {
    const time = byDay.get(day);
    if (!time) continue;
    const last = groups.at(-1);
    if (last && last.to === day - 1 && last.time === time) last.to = day;
    else groups.push({ from: day, to: day, time });
  }

  return groups
    .map(
      ({ from, to, time }) =>
        `${from === to ? DAY_NAMES[from] : `${DAY_NAMES[from]}–${DAY_NAMES[to]}`} ${time}`,
    )
    .join(", ");
}

/** «212.28 RUB» → 212.28 */
function parseRubles(value: string): number {
  const [amount, currency] = value.trim().split(/\s+/);
  const price = Number(amount);
  if (!Number.isFinite(price) || (currency && currency !== "RUB")) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Яндекс Доставка: непонятная цена «${value}»`,
    );
  }
  return price;
}

/** Клиент API Яндекс Доставки (платформа «в другой день»): регионы, тарифы, пункты выдачи. */
export class YandexDeliveryClient {
  constructor(
    private readonly options: YandexDeliveryOptions,
    private readonly logger: Logger,
  ) {}

  /** geo_id региона по названию города — нужен списку ПВЗ. */
  async findGeoId(city: string): Promise<number | null> {
    const { variants } = await this.request("/api/b2b/platform/location/detect", DetectSchema, {
      location: city.trim(),
    });
    return variants[0]?.geo_id ?? null;
  }

  async calculateTariff(input: {
    source: YandexDeliveryPoint;
    destination: YandexDeliveryPoint;
    tariff: "time_interval" | "self_pickup";
    parcel: Parcel;
    /** Объявленная ценность, ₽. */
    assessed_price: number;
  }): Promise<YandexDeliveryTariff> {
    const result = await this.request("/api/b2b/platform/pricing-calculator", PricingSchema, {
      source: input.source,
      destination: input.destination,
      tariff: input.tariff,
      total_weight: Math.ceil(input.parcel.weight),
      // Ценность — в копейках
      total_assessed_price: Math.round(input.assessed_price * 100),
      client_price: 0,
      payment_method: "already_paid",
      places: [
        {
          physical_dims: {
            weight_gross: Math.ceil(input.parcel.weight),
            dx: Math.ceil(input.parcel.length),
            dy: Math.ceil(input.parcel.width),
            dz: Math.ceil(input.parcel.height),
          },
        },
      ],
    });
    return {
      price: parseRubles(result.pricing_total),
      days: result.delivery_days,
    };
  }

  async listPickupPoints(geoId: number): Promise<YandexPickupPoint[]> {
    const { points } = await this.request("/api/b2b/platform/pickup-points/list", PointsSchema, {
      geo_id: geoId,
      payment_method: "already_paid",
    });
    return points.flatMap(toPickupPoint);
  }

  private async request<S extends z.ZodType>(path: string, schema: S, body: unknown): Promise<z.infer<S>> {
    const url = new URL(path, this.options.base_url);
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.options.token}`,
          "content-type": "application/json",
          "accept-language": "ru",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      this.logger.error(
        `delivery/yandex: ${path} недоступен: ${errorMessage(error)}`,
      );
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Яндекс Доставка временно недоступна",
      );
    }

    const payload: unknown = await response.json().catch(() => null);
    const parsed = schema.safeParse(payload);
    if (!response.ok || !parsed.success) {
      const envelope = ErrorSchema.safeParse(payload);
      const error = envelope.success ? envelope.data : {};
      const message = error.message || (response.ok ? "неожиданный ответ API" : `HTTP ${response.status}`);
      this.logger.warn(`delivery/yandex: ${path} — ${error.code ?? ""} ${message}`);
      throw new MedusaError(
        response.ok || response.status >= 500 || response.status === 401
          ? MedusaError.Types.UNEXPECTED_STATE
          : MedusaError.Types.INVALID_DATA,
        error.code === "no_delivery_options"
          ? "Яндекс Доставка не возит по этому адресу"
          : `Яндекс Доставка: ${message}`,
      );
    }
    return parsed.data;
  }
}

/** Пункт выдачи Яндекса; неизвестный тип точки — пусто. */
const toPickupPoint = (point: z.infer<typeof PickupPointSchema>): YandexPickupPoint[] => {
  const type = oneOfOrNull(point.type, PICKUP_POINT_TYPES);
  if (!type) return [];
  return [
    {
      id: point.id,
      name: point.name,
      type,
      address: point.address.full_address,
      city: point.address.locality,
      postal_code: point.address.postal_code || null,
      latitude: point.position.latitude,
      longitude: point.position.longitude,
      work_time: formatSchedule(point.schedule),
      phone: point.contact?.phone || null,
    },
  ];
};
