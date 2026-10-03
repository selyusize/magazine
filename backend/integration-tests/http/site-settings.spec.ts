import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { storeHeaders } from "./helpers/auth";

jest.setTimeout(60 * 1000);

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("GET /store/site-settings", () => {
      let headers: Record<string, string>;

      beforeEach(async () => {
        headers = await storeHeaders(getContainer());
      });

      it("отдаёт реквизиты и контакты магазина", async () => {
        const response = await api.get("/store/site-settings", { headers });

        expect(response.status).toEqual(200);
        expect(response.data.site_settings).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            url: expect.stringMatching(/^https:\/\//),
            legal: expect.objectContaining({
              inn: expect.stringMatching(/^\d{10}(\d{2})?$/),
              ogrn: expect.stringMatching(/^\d{13}(\d{2})?$/),
            }),
            contacts: expect.objectContaining({
              phone: expect.any(String),
              email: expect.any(String),
            }),
            address: expect.objectContaining({ country_code: "RU" }),
            social_links: expect.any(Array),
          }),
        );
      });

      it("без publishable-ключа отвечает 400", async () => {
        const response = await api
          .get("/store/site-settings")
          .catch((error) => error.response);

        expect(response.status).toEqual(400);
      });
    });
  },
});
