import { setDefaultLanguage } from "../default-language";

describe("setDefaultLanguage", () => {
  let storage: Map<string, string>;

  const stubBrowser = ({ cookie = "", storageThrows = false } = {}) => {
    storage = new Map();
    Object.assign(globalThis, {
      document: { cookie },
      localStorage: {
        getItem: (key: string) => {
          if (storageThrows) throw new Error("SecurityError");
          return storage.get(key) ?? null;
        },
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
  };

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  it("ставит русский, если админ язык не выбирал", () => {
    stubBrowser();
    setDefaultLanguage("ru");
    expect(storage.get("lng")).toBe("ru");
  });

  it("не трогает выбор из профиля — ни в localStorage, ни в cookie", () => {
    stubBrowser();
    storage.set("lng", "en");
    setDefaultLanguage("ru");
    expect(storage.get("lng")).toBe("en");

    stubBrowser({ cookie: "theme=dark; lng=de" });
    setDefaultLanguage("ru");
    expect(storage.has("lng")).toBe(false);
  });

  it("не падает, когда localStorage закрыт", () => {
    stubBrowser({ storageThrows: true });
    expect(() => setDefaultLanguage("ru")).not.toThrow();
  });
});
