import type { Logger } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

import type { Parcel } from "../delivery/parcel";

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

type Schedule = {
  restrictions: {
    days: number[];
    time_from: { hours: number; minutes: number };
    time_to: { hours: number; minutes: number };
  }[];
};

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
    const { variants } = await this.request<{
      variants: { geo_id: number; address: string }[];
    }>("/api/b2b/platform/location/detect", { location: city.trim() });
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
    const result = await this.request<{
      pricing_total: string;
      delivery_days: number;
    }>("/api/b2b/platform/pricing-calculator", {
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
    const { points } = await this.request<{ points: RawPickupPoint[] }>(
      "/api/b2b/platform/pickup-points/list",
      {
        geo_id: geoId,
        payment_method: "already_paid",
      },
    );
    return points.map(toPickupPoint);
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
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
        `delivery/yandex: ${path} недоступен: ${(error as Error).message}`,
      );
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Яндекс Доставка временно недоступна",
      );
    }

    const payload = (await response.json().catch(() => null)) as
      (T & { code?: string; message?: string }) | null;
    if (!response.ok || !payload) {
      const message = payload?.message || `HTTP ${response.status}`;
      this.logger.warn(
        `delivery/yandex: ${path} — ${payload?.code ?? ""} ${message}`,
      );
      throw new MedusaError(
        response.status >= 500 || response.status === 401
          ? MedusaError.Types.UNEXPECTED_STATE
          : MedusaError.Types.INVALID_DATA,
        payload?.code === "no_delivery_options"
          ? "Яндекс Доставка не возит по этому адресу"
          : `Яндекс Доставка: ${message}`,
      );
    }
    return payload;
  }
}

type RawPickupPoint = {
  id: string;
  name: string;
  type: string;
  position: { latitude: number; longitude: number };
  address: { locality: string; full_address: string; postal_code?: string };
  contact?: { phone?: string };
  schedule?: Schedule;
};

const toPickupPoint = (point: RawPickupPoint): YandexPickupPoint => ({
  id: point.id,
  name: point.name,
  type: point.type as YandexPickupPoint["type"],
  address: point.address.full_address,
  city: point.address.locality,
  postal_code: point.address.postal_code || null,
  latitude: point.position.latitude,
  longitude: point.position.longitude,
  work_time: formatSchedule(point.schedule),
  phone: point.contact?.phone || null,
});
