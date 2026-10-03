import { asValue } from "@medusajs/framework/awilix";
import type { MedusaContainer } from "@medusajs/framework/types";
import { createMedusaContainer, Modules } from "@medusajs/framework/utils";

import { CDEKClient } from "@shared/service/cdek/cdek-client";
import { YandexDeliveryClient } from "@shared/service/yandex-delivery/yandex-delivery-client";

import { fakeLogger } from "../../../../integration-tests/fakes";
import { GetPickupPointsByCityFetcher } from "../query/get-pickup-points-by-city/fetcher";

const logger = fakeLogger();
const cdekPoint = {
  code: "MOS4",
  name: "MOS4, Москва",
  type: "POSTAMAT" as const,
  address: "ул. Островитянова, 11",
  city: "Москва",
  postal_code: "117437",
  latitude: 55.6,
  longitude: 37.5,
  work_time: null,
  phone: null,
};

describe("GetPickupPointsByCityFetcher", () => {
  const cdek = new CDEKClient(
    { base_url: "x", client_id: "x", client_secret: "x" },
    logger,
  );
  const yandex = new YandexDeliveryClient(
    { base_url: "x", token: "x" },
    logger,
  );

  /** Контейнер Medusa с модулем кэша (Map) или без него. */
  const container = (cache?: Map<string, object>): MedusaContainer => {
    const medusa = createMedusaContainer();
    if (cache)
      medusa.register(
        Modules.CACHING,
        asValue({
          get: async ({ key }: { key: string }) => cache.get(key) ?? null,
          set: async ({ key, data }: { key: string; data: object }) => void cache.set(key, data),
        }),
      );
    return medusa;
  };

  afterEach(() => jest.restoreAllMocks());

  it("СДЭК: ищет код города и приводит пункты к общему формату", async () => {
    jest
      .spyOn(cdek, "findCity")
      .mockResolvedValue({ code: 44, name: "Москва" });
    const list = jest
      .spyOn(cdek, "listPickupPoints")
      .mockResolvedValue([cdekPoint]);

    const points = await new GetPickupPointsByCityFetcher(
      container(),
      cdek,
      yandex,
    ).fetch({
      provider: "cdek",
      city: " Москва ",
    });

    expect(list).toHaveBeenCalledWith(44);
    expect(points).toEqual([
      expect.objectContaining({
        id: "MOS4",
        provider: "cdek",
        type: "postamat",
        address: "ул. Островитянова, 11",
      }),
    ]);
  });

  it("Яндекс: ищет geo_id, неизвестный город — пустой список", async () => {
    jest.spyOn(yandex, "findGeoId").mockResolvedValue(null);
    const list = jest.spyOn(yandex, "listPickupPoints");

    const points = await new GetPickupPointsByCityFetcher(
      container(),
      cdek,
      yandex,
    ).fetch({
      provider: "yandex-delivery",
      city: "Атлантида",
    });

    expect(points).toEqual([]);
    expect(list).not.toHaveBeenCalled();
  });

  it("кладёт список в кэш и второй раз не ходит к перевозчику", async () => {
    const cache = new Map<string, object>();
    jest
      .spyOn(cdek, "findCity")
      .mockResolvedValue({ code: 44, name: "Москва" });
    const list = jest
      .spyOn(cdek, "listPickupPoints")
      .mockResolvedValue([cdekPoint]);
    const fetcher = new GetPickupPointsByCityFetcher(
      container(cache),
      cdek,
      yandex,
    );

    const first = await fetcher.fetch({ provider: "cdek", city: "Москва" });
    const second = await fetcher.fetch({ provider: "cdek", city: "москва" });

    expect(second).toEqual(first);
    expect(list).toHaveBeenCalledTimes(1);
    expect([...cache.keys()]).toEqual(["delivery:points:cdek:москва"]);
  });
});
