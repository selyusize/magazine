import type {
  CalculateShippingOptionPriceDTO,
  Logger,
} from "@medusajs/framework/types";

import { YandexDeliveryClient } from "@shared/service/yandex-delivery/yandex-delivery-client";

import { YandexDeliveryFulfillmentService } from "../service/yandex-delivery-fulfillment";

type Context = CalculateShippingOptionPriceDTO["context"];

const context = (overrides: Partial<Record<string, unknown>> = {}): Context =>
  ({
    id: "cart_1",
    from_location: {
      id: "sloc_1",
      name: "Отгрузка",
      address: { city: "Москва", address_1: "Ленинградский проспект, 27" },
      metadata: null,
    },
    shipping_address: {
      city: "Москва",
      address_1: "Ленинградский проспект, 37к9",
    },
    items: [
      {
        quantity: 2,
        unit_price: 1500,
        variant: { weight: 400, length: 30, width: 20, height: 5 },
      },
    ],
    ...overrides,
  }) as unknown as Context;

describe("YandexDeliveryFulfillmentService", () => {
  const logger = { warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  let service: YandexDeliveryFulfillmentService;
  let calculateTariff: jest.SpiedFunction<
    YandexDeliveryClient["calculateTariff"]
  >;

  beforeEach(() => {
    calculateTariff = jest
      .spyOn(YandexDeliveryClient.prototype, "calculateTariff")
      .mockResolvedValue({ price: 212.28, days: 2 });
    service = new YandexDeliveryFulfillmentService(
      { logger },
      {
        base_url: "https://b2b.taxi.tst.yandex.net",
        token: "y2",
        parcel: { item_weight: 500, box_side: 20 },
      },
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("до ПВЗ — тариф self_pickup до выбранной станции, отправитель — адрес склада", async () => {
    const price = await service.calculatePrice(
      { id: "yandex-pickup" },
      { pickup_point_id: "0194" },
      context(),
    );

    expect(price).toEqual({
      calculated_amount: 213,
      is_calculated_price_tax_inclusive: true,
    });
    expect(calculateTariff).toHaveBeenCalledWith({
      source: { address: "Москва, Ленинградский проспект, 27" },
      destination: { platform_station_id: "0194" },
      tariff: "self_pickup",
      parcel: { weight: 800, length: 30, width: 20, height: 10 },
      assessed_price: 3000,
    });
  });

  it("курьером — тариф time_interval до адреса покупателя", async () => {
    await service.calculatePrice({ id: "yandex-courier" }, {}, context());

    expect(calculateTariff).toHaveBeenCalledWith(
      expect.objectContaining({
        tariff: "time_interval",
        destination: { address: "Москва, Ленинградский проспект, 37к9" },
      }),
    );
  });

  it("берёт склад Яндекса из metadata склада отгрузки", async () => {
    const from_location = {
      name: "Отгрузка",
      address: null,
      metadata: { yandex_station_id: "fbed3aa1" },
    };
    await service.calculatePrice(
      { id: "yandex-courier" },
      {},
      context({ from_location }),
    );

    expect(calculateTariff).toHaveBeenCalledWith(
      expect.objectContaining({ source: { platform_station_id: "fbed3aa1" } }),
    );
  });

  it("без пункта выдачи цену до ПВЗ не считает", async () => {
    await expect(
      service.calculatePrice({ id: "yandex-pickup" }, {}, context()),
    ).rejects.toThrow("выберите пункт выдачи");
    expect(calculateTariff).not.toHaveBeenCalled();
  });

  it("не запускается без токена", () => {
    expect(() =>
      YandexDeliveryFulfillmentService.validateOptions({
        base_url: "https://x",
      }),
    ).toThrow("YANDEX_DELIVERY_TOKEN");
  });
});
