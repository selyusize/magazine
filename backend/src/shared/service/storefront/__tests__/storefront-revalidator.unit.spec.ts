import { REVALIDATE_SECRET_HEADER, revalidateURL, StorefrontRevalidator } from "../storefront-revalidator";

const logger = { warn: jest.fn() };

function revalidator(respond: () => Promise<Response>, allowed_hosts: string[] = []) {
  const calls: { url: string; init: RequestInit }[] = [];
  const instance = new StorefrontRevalidator({ timeout_ms: 1000, allowed_hosts }, logger, async (url, init) => {
    calls.push({ url, init });
    return respond();
  });
  return { instance, calls };
}

describe("revalidateURL", () => {
  it.each([
    ["https://olisa.ru", "https://olisa.ru/api/revalidate"],
    ["https://olisa.ru/", "https://olisa.ru/api/revalidate"],
    ["http://localhost:3000", "http://localhost:3000/api/revalidate"],
  ])("%s → %s", (url, expected) => {
    expect(revalidateURL(url)).toBe(expected);
  });
});

describe("StorefrontRevalidator", () => {
  const request = { storefront_url: "https://olisa.ru", secret: "s3cret", tags: ["products"] };

  it("POST тегов с секретом магазина", async () => {
    const { instance, calls } = revalidator(async () => new Response("{}", { status: 200 }));
    await expect(instance.revalidate(request)).resolves.toEqual({ ok: true, status: 200 });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://olisa.ru/api/revalidate");
    expect(calls[0].init.method).toBe("POST");
    expect(new Headers(calls[0].init.headers).get(REVALIDATE_SECRET_HEADER)).toBe("s3cret");
    expect(calls[0].init.body).toBe(JSON.stringify({ tags: ["products"] }));
  });

  it("не 2xx — неудача с кодом, без исключения", async () => {
    const { instance } = revalidator(async () => new Response("no", { status: 401 }));
    await expect(instance.revalidate(request)).resolves.toEqual({
      ok: false,
      status: 401,
      error: "витрина ответила 401",
      retryable: true,
    });
  });

  it("сеть недоступна — неудача без кода", async () => {
    const { instance } = revalidator(async () => {
      throw new Error("ECONNREFUSED");
    });
    await expect(instance.revalidate(request)).resolves.toEqual({
      ok: false,
      status: null,
      error: "витрина недоступна: ECONNREFUSED",
      retryable: true,
    });
  });

  it("хост не из списка разрешённых — без запроса и без повторов", async () => {
    const { instance, calls } = revalidator(async () => new Response("{}"), ["127.0.0.1"]);
    await expect(instance.revalidate(request)).resolves.toEqual({
      ok: false,
      status: null,
      error: "хост «olisa.ru» не в STOREFRONT_REVALIDATE_HOSTS",
      retryable: false,
    });
    expect(calls).toHaveLength(0);
    await revalidator(async () => new Response("{}"), ["127.0.0.1"]).instance.revalidate({
      ...request,
      storefront_url: "http://127.0.0.1:4000",
    });
  });
});
