import {
  isAllowedOrigin,
  parseOrigins,
  storefrontOrigins,
} from "../allowed-origins";

describe("parseOrigins", () => {
  it("список через запятую и /regexp/ — как STORE_CORS у Medusa", () => {
    const [plain, regexp] = parseOrigins(
      "http://localhost:3000/, /\\.vercel\\.app$/",
    );
    expect(plain).toBe("http://localhost:3000");
    expect(regexp).toBeInstanceOf(RegExp);
  });

  it("пустая строка — пустой список", () => {
    expect(parseOrigins("")).toEqual([]);
  });
});

describe("storefrontOrigins", () => {
  it("домен по https и origin адреса витрины", () => {
    expect(
      storefrontOrigins({
        domain: "beta.ru",
        storefront_url: "https://www.beta.ru/catalog",
      }),
    ).toEqual(["https://beta.ru", "https://www.beta.ru"]);
  });

  it("dev: адрес витрины http с портом", () => {
    expect(
      storefrontOrigins({
        domain: "localhost:3000",
        storefront_url: "http://localhost:3000",
      }),
    ).toEqual(["https://localhost:3000", "http://localhost:3000"]);
  });

  it("некорректный адрес витрины — только домен", () => {
    expect(
      storefrontOrigins({ domain: "beta.ru", storefront_url: "beta" }),
    ).toEqual(["https://beta.ru"]);
  });
});

describe("isAllowedOrigin", () => {
  const allowed = {
    static: ["http://localhost:3000", /\.preview\.local$/],
    storefronts: ["https://alpha.ru"],
  };

  it.each([
    "https://alpha.ru",
    "https://alpha.ru/",
    "http://localhost:3000",
    "https://pr-1.preview.local",
  ])("пускает %s", (origin) => {
    expect(isAllowedOrigin(origin, allowed)).toBe(true);
  });

  it.each([
    "https://evil.ru",
    "http://alpha.ru",
    "https://alpha.ru.evil.ru",
    "http://localhost:3001",
  ])("не пускает %s", (origin) => {
    expect(isAllowedOrigin(origin, allowed)).toBe(false);
  });
});
