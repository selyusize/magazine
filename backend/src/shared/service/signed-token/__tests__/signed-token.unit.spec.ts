import { SignedToken } from "../signed-token";

describe("SignedToken", () => {
  const tokens = new SignedToken({ secret: "secret" });

  it("подписывает и проверяет данные", () => {
    expect(tokens.verify(tokens.sign("sup_1", 60))).toBe("sup_1");
  });

  it("чужая подпись, подмена данных и истёкший срок — null", () => {
    const token = tokens.sign("sup_1", 60, 0);
    const [, expires, signature] = token.split(".");

    expect(new SignedToken({ secret: "other" }).verify(tokens.sign("sup_1", 60))).toBeNull();
    expect(tokens.verify(`${Buffer.from("sup_2").toString("base64url")}.${expires}.${signature}`, 0)).toBeNull();
    expect(tokens.verify(token, 61_000)).toBeNull();
    expect(tokens.verify("garbage")).toBeNull();
  });
});
