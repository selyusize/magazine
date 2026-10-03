import { errorMessage, toError } from "../error-message";

describe("errorMessage", () => {
  it("Error — его текст, остальное — строкой", () => {
    expect(errorMessage(new Error("сбой"))).toBe("сбой");
    expect(errorMessage("строка")).toBe("строка");
    expect(toError(42)).toEqual(new Error("42"));
  });
});
