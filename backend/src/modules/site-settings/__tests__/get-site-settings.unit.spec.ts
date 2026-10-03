import { createMedusaContainer } from "@medusajs/framework/utils";

import { GetSiteSettingsFetcher } from "../query/get-site-settings/fetcher";

describe("site-settings", () => {
  const fetcher = new GetSiteSettingsFetcher(createMedusaContainer());

  it("отдаёт реквизиты в формате, который ждут schema.org и подвал", async () => {
    const settings = await fetcher.fetch({});

    expect(settings.url).toBe(`https://${settings.domain}`);
    expect(settings.legal.inn).toMatch(/^(\d{10}|\d{12})$/);
    expect(settings.legal.ogrn).toMatch(/^(\d{13}|\d{15})$/);
    // КПП есть только у юрлица (ИНН из 10 цифр)
    expect(settings.legal.kpp === null).toBe(settings.legal.inn.length === 12);
    expect(settings.contacts.phone).toMatch(/^\+7\d{10}$/);
    expect(settings.contacts.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
    expect(settings.address.country_code).toBe("RU");
    settings.social_links.forEach((link) =>
      expect(link.url).toMatch(/^https:\/\//),
    );
  });
});
