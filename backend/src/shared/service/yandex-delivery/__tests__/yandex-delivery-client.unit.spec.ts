import { fakeLogger } from "../../../../../integration-tests/fakes";

import {
  formatSchedule,
  YandexDeliveryClient,
} from "../yandex-delivery-client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const time = (hours: number, minutes = 0) => ({ hours, minutes });

describe("YandexDeliveryClient", () => {
  const logger = fakeLogger();
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  const client = new YandexDeliveryClient(
    { base_url: "https://b2b.taxi.tst.yandex.net", token: "y2_test" },
    logger,
  );

  beforeEach(() => {
    fetchMock = jest.spyOn(global, "fetch");
  });

  afterEach(() => fetchMock.mockRestore());

  const sentBody = (index = 0) =>
    JSON.parse(String(fetchMock.mock.calls[index][1]?.body));

  it("находит geo_id города", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ variants: [{ geo_id: 213, address: "Москва" }] }),
    );

    await expect(client.findGeoId("Москва")).resolves.toBe(213);
    expect(sentBody()).toEqual({ location: "Москва" });
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).get("authorization"),
    ).toBe("Bearer y2_test");
  });

  it("считает тариф: ценность в копейках, цена из строки «N RUB»", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ pricing_total: "212.28 RUB", delivery_days: 2 }),
    );

    const tariff = await client.calculateTariff({
      source: { address: "Москва, Ленинградский проспект, 27" },
      destination: { platform_station_id: "01946f4f" },
      tariff: "self_pickup",
      parcel: { weight: 1200, length: 30, width: 20, height: 10 },
      assessed_price: 4999.9,
    });

    expect(tariff).toEqual({ price: 212.28, days: 2 });
    expect(sentBody()).toMatchObject({
      tariff: "self_pickup",
      total_weight: 1200,
      total_assessed_price: 499990,
      places: [
        { physical_dims: { weight_gross: 1200, dx: 30, dy: 20, dz: 10 } },
      ],
    });
  });

  it("«нет вариантов доставки» — понятный текст для покупателя", async () => {
    fetchMock.mockResolvedValueOnce(
      json(
        { code: "no_delivery_options", message: "No delivery options" },
        400,
      ),
    );

    await expect(
      client.calculateTariff({
        source: { address: "a" },
        destination: { address: "b" },
        tariff: "time_interval",
        parcel: { weight: 1, length: 1, width: 1, height: 1 },
        assessed_price: 1,
      }),
    ).rejects.toMatchObject({
      type: "invalid_data",
      message: "Яндекс Доставка не возит по этому адресу",
    });
  });

  it("недоступный сервис — понятная ошибка", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(client.findGeoId("Москва")).rejects.toThrow(
      "временно недоступна",
    );
  });

  it("приводит ПВЗ к своему формату", async () => {
    fetchMock.mockResolvedValueOnce(
      json({
        points: [
          {
            id: "0193",
            name: "ГиперПВЗ-2",
            type: "pickup_point",
            position: { latitude: 55.74, longitude: 37.85 },
            address: {
              locality: "Москва",
              full_address: "Москва Новокосинская 17 к6",
              postal_code: "111673",
            },
            contact: { phone: "+74951570020" },
            schedule: {
              restrictions: [
                {
                  days: [1, 2, 3, 4, 5, 6, 7],
                  time_from: time(0),
                  time_to: time(23, 59),
                },
              ],
            },
          },
        ],
      }),
    );

    await expect(client.listPickupPoints(213)).resolves.toEqual([
      {
        id: "0193",
        name: "ГиперПВЗ-2",
        type: "pickup_point",
        address: "Москва Новокосинская 17 к6",
        city: "Москва",
        postal_code: "111673",
        latitude: 55.74,
        longitude: 37.85,
        work_time: "Пн–Вс круглосуточно",
        phone: "+74951570020",
      },
    ]);
  });
});

describe("formatSchedule", () => {
  it("группирует подряд идущие дни с одинаковым временем", () => {
    const restrictions = [
      { days: [1, 2, 3, 4, 5], time_from: time(10), time_to: time(20) },
      { days: [6], time_from: time(10), time_to: time(18) },
    ];
    expect(formatSchedule({ restrictions })).toBe(
      "Пн–Пт 10:00–20:00, Сб 10:00–18:00",
    );
  });

  it("пустое расписание — null", () => {
    expect(formatSchedule(undefined)).toBeNull();
    expect(formatSchedule({ restrictions: [] })).toBeNull();
  });
});
