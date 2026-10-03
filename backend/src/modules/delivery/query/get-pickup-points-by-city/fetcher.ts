import type { MedusaContainer } from "@medusajs/framework/types";
import { z } from "@medusajs/framework/zod";

import { Injectable, InjectContainer } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import {
  CDEKClient,
  type CDEKPickupPoint,
} from "@shared/service/cdek/cdek-client";
import {
  YandexDeliveryClient,
  type YandexPickupPoint,
} from "@shared/service/yandex-delivery/yandex-delivery-client";

import { DELIVERY_PROVIDERS, type DeliveryProvider, type PickupPointDTO } from "./dto";
import type { GetPickupPointsByCityQuery } from "./query";

/** Пункты меняются редко, а список по Москве — тысячи точек: держим в кэше полдня. */
const POINTS_TTL_SECONDS = 12 * 60 * 60;

/** Что лежит в кэше: тот же DTO; другой формат (старая версия кода) — загрузить заново. */
const CachedPointsSchema = z.object({
  points: z.array(
    z.object({
      id: z.string(),
      provider: z.enum(DELIVERY_PROVIDERS),
      name: z.string(),
      type: z.enum(["pickup_point", "postamat", "post_office"]),
      address: z.string(),
      city: z.string(),
      postal_code: z.string().nullable(),
      latitude: z.number(),
      longitude: z.number(),
      work_time: z.string().nullable(),
      phone: z.string().nullable(),
    }),
  ),
});

const fromCDEK = (point: CDEKPickupPoint): PickupPointDTO => ({
  id: point.code,
  provider: "cdek",
  name: point.name,
  type: point.type === "POSTAMAT" ? "postamat" : "pickup_point",
  address: point.address,
  city: point.city,
  postal_code: point.postal_code,
  latitude: point.latitude,
  longitude: point.longitude,
  work_time: point.work_time,
  phone: point.phone,
});

const fromYandex = (point: YandexPickupPoint): PickupPointDTO => ({
  id: point.id,
  provider: "yandex-delivery",
  name: point.name,
  type: point.type === "terminal" ? "postamat" : point.type,
  address: point.address,
  city: point.city,
  postal_code: point.postal_code,
  latitude: point.latitude,
  longitude: point.longitude,
  work_time: point.work_time,
  phone: point.phone,
});

/** Пункты выдачи перевозчика в городе — GET /store/delivery/points. Город не найден у перевозчика — пустой список. */
@Injectable()
export class GetPickupPointsByCityFetcher extends AbstractFetcher<
  GetPickupPointsByCityQuery,
  PickupPointDTO[]
> {
  constructor(
    @InjectContainer() container: MedusaContainer,
    private readonly cdek: CDEKClient,
    private readonly yandex: YandexDeliveryClient,
  ) {
    super(container);
  }

  async fetch(query: GetPickupPointsByCityQuery): Promise<PickupPointDTO[]> {
    const city = query.city.trim();
    const key = `delivery:points:${query.provider}:${city.toLowerCase()}`;

    const { points } = await this.cached(key, POINTS_TTL_SECONDS, CachedPointsSchema, async () => ({
      points: await this.load(query.provider, city),
    }));
    return points;
  }

  private async load(
    provider: DeliveryProvider,
    city: string,
  ): Promise<PickupPointDTO[]> {
    if (provider === "cdek") {
      const found = await this.cdek.findCity(city);
      return found
        ? (await this.cdek.listPickupPoints(found.code)).map(fromCDEK)
        : [];
    }

    const geoId = await this.yandex.findGeoId(city);
    return geoId
      ? (await this.yandex.listPickupPoints(geoId)).map(fromYandex)
      : [];
  }
}
