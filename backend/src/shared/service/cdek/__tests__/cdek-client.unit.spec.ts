import type { Logger } from "@medusajs/framework/types";

import { CDEKClient } from "../cdek-client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("CDEKClient", () => {
  const logger = { warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let client: CDEKClient;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, "fetch");
    client = new CDEKClient(
      {
        base_url: "https://api.edu.cdek.ru",
        client_id: "id",
        client_secret: "secret",
      },
      logger,
    );
  });

  afterEach(() => fetchMock.mockRestore());

  const token = () => json({ access_token: "t1", expires_in: 3600 });
  const calledURL = (index: number) =>
    new URL(String(fetchMock.mock.calls[index][0]));

  it("получает токен один раз и подставляет его в запросы", async () => {
    fetchMock
      .mockResolvedValueOnce(token())
      .mockResolvedValueOnce(json([{ code: 44, full_name: "Москва, Россия" }]))
      .mockResolvedValueOnce(json([{ code: 44, full_name: "Москва, Россия" }]));

    await client.findCity("Москва");
    await client.findCity("Москва");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(calledURL(0).pathname).toBe("/v2/oauth/token");
    expect(calledURL(0).searchParams.get("client_id")).toBe("id");
    expect(
      (fetchMock.mock.calls[1][1]?.headers as Record<string, string>)
        .authorization,
    ).toBe("Bearer t1");
  });

  it("выбирает город, название которого совпадает, а не первый из подсказок", async () => {
    fetchMock.mockResolvedValueOnce(token()).mockResolvedValueOnce(
      json([
        { code: 469, full_name: "Московский, Московская область, Россия" },
        { code: 44, full_name: "Москва, Россия" },
      ]),
    );

    await expect(client.findCity(" москва ")).resolves.toEqual({
      code: 44,
      name: "Москва",
    });
    expect(calledURL(1).searchParams.get("name")).toBe("москва");
  });

  it("считает тариф: коды городов, адрес до двери, посылка в граммах и сантиметрах", async () => {
    fetchMock
      .mockResolvedValueOnce(token())
      .mockResolvedValueOnce(
        json({ total_sum: 412.5, period_min: 2, period_max: 4 }),
      );

    const tariff = await client.calculateTariff({
      tariff_code: 137,
      from_city_code: 44,
      to_city_code: 137,
      to_address: "Невский проспект, 1",
      parcel: { weight: 1200.4, length: 30, width: 20, height: 10.2 },
    });

    expect(tariff).toEqual({ price: 412.5, period_min: 2, period_max: 4 });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      tariff_code: 137,
      from_location: { code: 44 },
      to_location: { code: 137, address: "Невский проспект, 1" },
      packages: [{ weight: 1201, length: 30, width: 20, height: 11 }],
    });
  });

  it("ошибку СДЭК превращает в MedusaError с текстом СДЭК", async () => {
    fetchMock
      .mockResolvedValueOnce(token())
      .mockResolvedValueOnce(
        json({ errors: [{ code: "v2_x", message: "Город не найден" }] }, 400),
      );

    await expect(
      client.calculateTariff({
        tariff_code: 136,
        from_city_code: 44,
        to_city_code: 1,
        parcel: { weight: 1, length: 1, width: 1, height: 1 },
      }),
    ).rejects.toMatchObject({
      type: "invalid_data",
      message: "СДЭК: Город не найден",
    });
  });

  it("недоступный СДЭК — понятная ошибка вместо падения", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(client.findCity("Москва")).rejects.toThrow(
      "СДЭК временно недоступен",
    );
  });

  it("неверные ключи — ошибка авторизации", async () => {
    fetchMock.mockResolvedValueOnce(json({ error: "invalid_client" }, 401));
    await expect(client.findCity("Москва")).rejects.toThrow(
      "не удалось авторизоваться",
    );
  });

  it("отдаёт только ПВЗ и постаматы в своём формате", async () => {
    const location = {
      city: "Москва",
      postal_code: "117437",
      address: "ул. Островитянова, 11",
      latitude: 55.6,
      longitude: 37.5,
    };
    fetchMock.mockResolvedValueOnce(token()).mockResolvedValueOnce(
      json([
        {
          code: "MOS4",
          name: "MOS4, Москва",
          type: "PVZ",
          work_time: "Пн-Пт 10:00-20:00",
          phones: [{ number: "+7926" }],
          location,
        },
        { code: "MOS9", name: "Склад", type: "WAREHOUSE", location },
      ]),
    );

    const points = await client.listPickupPoints(44);

    expect(calledURL(1).searchParams.get("city_code")).toBe("44");
    expect(points).toEqual([
      {
        code: "MOS4",
        name: "MOS4, Москва",
        type: "PVZ",
        address: "ул. Островитянова, 11",
        city: "Москва",
        postal_code: "117437",
        latitude: 55.6,
        longitude: 37.5,
        work_time: "Пн-Пт 10:00-20:00",
        phone: "+7926",
      },
    ]);
  });
});
