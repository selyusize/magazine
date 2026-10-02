/**
 * Регистрация, вход и выход покупателя. JWT живёт только в httpOnly-cookie.
 */
import { describe, expect, it } from "vitest";

import { addLineItem, getCart } from "@entities/cart";
import { getCustomer, updateCustomer } from "@entities/customer";
import { login, logout, register } from "@features/auth";
import { SESSION_COOKIE } from "@shared/session";
import { getJwtExpiry } from "@shared/session/jwt";

import { cookieJar } from "../helpers/cookie-jar";
import { anyVariantId, uniqueEmail } from "../helpers/medusa";

const PASSWORD = "secret-password-123";

async function registered(profile: { firstName?: string } = {}) {
  const email = uniqueEmail();
  const result = await register({ email, password: PASSWORD, ...profile });
  if (!result.ok) throw new Error(result.error.message);
  return { email, customer: result.data };
}

describe("Регистрация", () => {
  it("создаёт покупателя с профилем и сразу авторизует его", async () => {
    const email = uniqueEmail();
    const result = await register({ email, password: PASSWORD, firstName: "Иван", phone: "+79990000000" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({ email, firstName: "Иван", phone: "+79990000000" });
    await expect(getCustomer()).resolves.toMatchObject({ id: result.data.id });
  });

  it("JWT кладётся в httpOnly-cookie, которая живёт столько же, сколько токен", async () => {
    await registered();

    const cookie = cookieJar.get(SESSION_COOKIE.token);
    expect(cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });

    const expiresAt = getJwtExpiry(cookie!.value)!;
    const expectedMaxAge = Math.floor((expiresAt - Date.now()) / 1000);
    expect(Math.abs((cookie!.options.maxAge as number) - expectedMaxAge)).toBeLessThanOrEqual(2);
  });

  it("гостевая корзина переходит к покупателю после регистрации", async () => {
    const guestCart = await addLineItem({ variantId: await anyVariantId(), quantity: 1 });
    expect(guestCart.ok).toBe(true);
    if (!guestCart.ok) return;
    expect(guestCart.data.customerId).toBeFalsy();

    const { customer } = await registered();

    const cart = await getCart();
    expect(cart?.id).toBe(guestCart.data.id);
    expect(cart?.customerId).toBe(customer.id);
    expect(cart?.items).toHaveLength(1);
  });

  it("повторная регистрация на тот же email → ошибка, cookie не создаются", async () => {
    const { email } = await registered();
    cookieJar.clear();

    const result = await register({ email, password: "another-password" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(401);
    expect(cookieJar.get(SESSION_COOKIE.token)).toBeUndefined();
  });
});

describe("Вход и выход", () => {
  it("вход по email и паролю возвращает покупателя и ставит cookie с JWT", async () => {
    const { email, customer } = await registered();
    cookieJar.clear();

    const result = await login({ email, password: PASSWORD });
    expect(result).toMatchObject({ ok: true, data: { id: customer.id, email } });
    expect(cookieJar.value(SESSION_COOKIE.token)).toBeTruthy();
  });

  it("неверный пароль → 401 unauthorized, cookie не создаётся", async () => {
    const { email } = await registered();
    cookieJar.clear();

    const result = await login({ email, password: "wrong-password" });
    expect(result).toEqual({
      ok: false,
      error: { status: 401, type: "unauthorized", message: "Invalid email or password" },
    });
    expect(cookieJar.get(SESSION_COOKIE.token)).toBeUndefined();
  });

  it("выход удаляет JWT и id корзины; покупатель становится гостем", async () => {
    await registered();
    await addLineItem({ variantId: await anyVariantId(), quantity: 1 });

    await expect(logout()).resolves.toEqual({ ok: true, data: null });
    expect(cookieJar.get(SESSION_COOKIE.token)).toBeUndefined();
    expect(cookieJar.get(SESSION_COOKIE.cartId)).toBeUndefined();
    await expect(getCustomer()).resolves.toBeNull();
    await expect(getCart()).resolves.toBeNull();
  });

  it("гость: getCustomer → null", async () => {
    await expect(getCustomer()).resolves.toBeNull();
  });

  it("поддельный токен в cookie: getCustomer → null, без исключения", async () => {
    cookieJar.set(SESSION_COOKIE.token, "forged.jwt.token");
    await expect(getCustomer()).resolves.toBeNull();
  });
});

describe("Профиль покупателя", () => {
  it("updateCustomer меняет данные текущего покупателя", async () => {
    await registered({ firstName: "Иван" });

    const result = await updateCustomer({ firstName: "Пётр" });
    expect(result).toMatchObject({ ok: true, data: { firstName: "Пётр" } });
    await expect(getCustomer()).resolves.toMatchObject({ firstName: "Пётр" });
  });

  it("updateCustomer без входа → 401", async () => {
    const result = await updateCustomer({ firstName: "Пётр" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(401);
  });
});

describe("Серверная валидация Server Actions (zod)", () => {
  it("вход с некорректным email — 400 validation, до запроса в Medusa", async () => {
    const result = await login({ email: "not-an-email", password: "x" });
    expect(result).toMatchObject({ ok: false, error: { status: 400, type: "validation" } });
    expect(cookieJar.get(SESSION_COOKIE.token)).toBeUndefined();
  });

  it("регистрация с коротким паролем — 400 validation, покупатель не создаётся", async () => {
    const email = uniqueEmail();
    const result = await register({ email, password: "123" });
    expect(result).toMatchObject({ ok: false, error: { status: 400, type: "validation", message: "Минимум 8 символов" } });

    const retry = await register({ email, password: PASSWORD });
    expect(retry.ok).toBe(true);
  });
});
