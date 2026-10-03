import { CDEKClient } from "@shared/service/cdek/cdek-client";
import type { CalculationContext } from "@shared/service/delivery/carrier-fulfillment";
import { fakeLogger } from "../../../../integration-tests/fakes";

import { CDEKFulfillmentService } from "../service/cdek-fulfillment";

const context = (overrides: Partial<CalculationContext> = {}): CalculationContext => ({
    from_location: {
      name: "Отгрузка",
      address: { city: "Москва", address_1: "Ленинградский проспект, 27" },
    },
    shipping_address: {
      city: "Санкт-Петербург",
      address_1: "Невский проспект, 1",
      address_2: "кв. 5",
    },
    items: [
      {
        quantity: 2,
        unit_price: 1000,
        variant: { weight: 300, length: null, width: null, height: null },
      },
      { quantity: 1, unit_price: 500, variant: { weight: null } },
    ],
    ...overrides,
  });

describe("CDEKFulfillmentService", () => {
  const logger = fakeLogger();
  let service: CDEKFulfillmentService;
  let findCity: jest.SpiedFunction<CDEKClient["findCity"]>;
  let calculateTariff: jest.SpiedFunction<CDEKClient["calculateTariff"]>;

  beforeEach(() => {
    findCity = jest
      .spyOn(CDEKClient.prototype, "findCity")
      .mockImplementation(async (name) => ({
        code: name === "Москва" ? 44 : 137,
        name,
      }));
    calculateTariff = jest
      .spyOn(CDEKClient.prototype, "calculateTariff")
      .mockResolvedValue({ price: 412.3, period_min: 2, period_max: 4 });

    service = new CDEKFulfillmentService(
      { logger },
      {
        base_url: "https://api.edu.cdek.ru",
        client_id: "id",
        client_secret: "secret",
        tariffs: { pickup: 136, door: 137 },
        parcel: { item_weight: 500, box_side: 20 },
      },
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it("предлагает ПВЗ и курьера", async () => {
    expect(await service.getFulfillmentOptions()).toEqual([
      {
        id: "cdek-pickup",
        name: "СДЭК — пункт выдачи",
        pickup: true,
        is_return: false,
      },
      {
        id: "cdek-door",
        name: "СДЭК — курьер",
        pickup: false,
        is_return: false,
      },
    ]);
    expect(await service.validateOption({ id: "cdek-door" })).toBe(true);
    expect(await service.validateOption({ id: "post" })).toBe(false);
  });

  it("до ПВЗ — тариф склад–склад от города склада, цена в целых рублях с НДС", async () => {
    const price = await service.calculatePrice(
      { id: "cdek-pickup" },
      {},
      context(),
    );

    expect(price).toEqual({
      calculated_amount: 413,
      is_calculated_price_tax_inclusive: true,
    });
    expect(calculateTariff).toHaveBeenCalledWith({
      tariff_code: 136,
      from_city_code: 44,
      to_city_code: 137,
      to_address: undefined,
      parcel: { weight: 1100, length: 20, width: 20, height: 20 },
    });
  });

  it("курьером — тариф склад–дверь с улицей и домом", async () => {
    await service.calculatePrice({ id: "cdek-door" }, {}, context());

    expect(calculateTariff).toHaveBeenCalledWith(
      expect.objectContaining({
        tariff_code: 137,
        to_address: "Невский проспект, 1, кв. 5",
      }),
    );
  });

  it("код города запрашивает у СДЭК один раз", async () => {
    await service.calculatePrice({ id: "cdek-pickup" }, {}, context());
    await service.calculatePrice({ id: "cdek-door" }, {}, context());

    expect(findCity).toHaveBeenCalledTimes(2);
  });

  it("объясняет, чего не хватает для расчёта", async () => {
    await expect(
      service.calculatePrice(
        { id: "cdek-pickup" },
        {},
        context({ shipping_address: null }),
      ),
    ).rejects.toThrow("Укажите город доставки");
    await expect(
      service.calculatePrice(
        { id: "cdek-door" },
        {},
        context({ shipping_address: { city: "Казань" } }),
      ),
    ).rejects.toThrow("улицу и дом");
    await expect(
      service.calculatePrice(
        { id: "cdek-pickup" },
        {},
        context({ from_location: { name: "Без адреса" } }),
      ),
    ).rejects.toThrow("у склада отгрузки «Без адреса» не указан город");

    findCity
      .mockResolvedValueOnce({ code: 44, name: "Москва" })
      .mockResolvedValueOnce(null);
    await expect(
      service.calculatePrice(
        { id: "cdek-pickup" },
        {},
        context({ shipping_address: { city: "Атлантида" } }),
      ),
    ).rejects.toThrow("СДЭК не доставляет в «Атлантида»");
  });

  it("при выборе ПВЗ требует пункт, у курьера — ничего лишнего не хранит", async () => {
    await expect(
      service.validateFulfillmentData({ id: "cdek-pickup" }, {}),
    ).rejects.toThrow("выберите пункт выдачи");
    await expect(
      service.validateFulfillmentData(
        { id: "cdek-pickup" },
        { pickup_point_id: " MOS4 ", extra: 1 },
      ),
    ).resolves.toEqual({ pickup_point_id: "MOS4" });
    await expect(
      service.validateFulfillmentData(
        { id: "cdek-door" },
        { pickup_point_id: "MOS4" },
      ),
    ).resolves.toEqual({});
  });

  it("не запускается без ключей", () => {
    expect(() =>
      CDEKFulfillmentService.validateOptions({
        base_url: "https://api.cdek.ru",
      }),
    ).toThrow("CDEK_CLIENT_ID");
  });
});
