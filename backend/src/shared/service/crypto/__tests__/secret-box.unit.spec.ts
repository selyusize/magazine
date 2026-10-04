import { generateSecret, SecretBox } from "../secret-box";

describe("SecretBox", () => {
  const box = new SecretBox("test-key");

  it("расшифровывает своё", () => {
    const sealed = box.encrypt("секрет витрины");
    expect(sealed).toMatch(/^v1:/);
    expect(sealed).not.toContain("секрет");
    expect(box.decrypt(sealed)).toBe("секрет витрины");
  });

  it("каждое шифрование — свой IV", () => {
    expect(box.encrypt("x")).not.toBe(box.encrypt("x"));
  });

  it("чужой ключ, испорченная запись, другой формат — null", () => {
    const sealed = box.encrypt("x");
    expect(new SecretBox("other-key").decrypt(sealed)).toBeNull();
    expect(box.decrypt(`${sealed.slice(0, -2)}AA`)).toBeNull();
    expect(box.decrypt("plain-text")).toBeNull();
    expect(box.decrypt("")).toBeNull();
  });

  it("пустой ключ — ошибка при создании", () => {
    expect(() => new SecretBox("")).toThrow("SHOP_SECRETS_KEY");
  });
});

describe("generateSecret", () => {
  it("32 случайных байта в base64url", () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateSecret()).not.toBe(secret);
  });
});
