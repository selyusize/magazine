import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema, safeRedirect, signupFormSchema } from "@features/auth";
import { routes } from "@shared/config";
import { errorMessages, getFieldErrors } from "@shared/lib/errors";

describe("safeRedirect: куда вернуть после входа", () => {
  it("относительный путь сайта — разрешён", () => {
    expect(safeRedirect("/cart")).toBe("/cart");
    expect(safeRedirect("/catalog/frames?sort=price")).toBe("/catalog/frames?sort=price");
    expect(safeRedirect(["/checkout", "/other"])).toBe("/checkout");
  });

  it("без параметра — в личный кабинет", () => {
    expect(safeRedirect(undefined)).toBe(routes.account);
    expect(safeRedirect("")).toBe(routes.account);
  });

  it("внешние адреса отклоняются (защита от открытого редиректа)", () => {
    for (const next of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil.com"]) {
      expect(safeRedirect(next)).toBe(routes.account);
    }
  });
});

describe("Схемы zod форм входа и регистрации", () => {
  it("вход: корректные данные проходят", () => {
    expect(loginSchema.safeParse({ email: "a@b.ru", password: "x" }).success).toBe(true);
  });

  it("вход: пустой пароль и неверный email — тексты из общего словаря", () => {
    const { error } = loginSchema.safeParse({ email: "nope", password: "" });
    expect(getFieldErrors(error!)).toEqual({ email: errorMessages.email, password: errorMessages.required });
  });

  it("регистрация (форма): короткий пароль и несовпадение подтверждения", () => {
    const short = signupFormSchema.safeParse({ email: "a@b.ru", password: "123", confirmPassword: "123" });
    expect(getFieldErrors(short.error!)).toEqual({ password: errorMessages.passwordTooShort(8) });

    const mismatch = signupFormSchema.safeParse({ email: "a@b.ru", password: "secret-123", confirmPassword: "x" });
    expect(getFieldErrors(mismatch.error!)).toEqual({ confirmPassword: errorMessages.passwordsMismatch });
  });

  it("регистрация (сервер): профиль необязателен, лишние поля отбрасываются", () => {
    const parsed = registerSchema.parse({ email: "a@b.ru", password: "secret-123", firstName: "Иван", role: "admin" });
    expect(parsed).toEqual({ email: "a@b.ru", password: "secret-123", firstName: "Иван" });
  });
});
