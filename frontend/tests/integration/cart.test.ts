/**
 * Корзина гостя. id корзины живёт только в httpOnly-cookie, клиент его не передаёт.
 */
import { describe, expect, it } from "vitest";

import { addLineItem, forgetCart, getCart, removeLineItem, updateCart, updateLineItem } from "@entities/cart";
import { SESSION_COOKIE } from "@shared/session";

import { cookieJar } from "../helpers/cookie-jar";
import { anyVariantId, uniqueEmail, variantIds } from "../helpers/medusa";

const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function cartWithItem() {
  const result = await addLineItem({ variantId: await anyVariantId(), quantity: 1 });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

describe("Корзина гостя", () => {
  it("у нового посетителя корзины нет, cookie не создаётся", async () => {
    await expect(getCart()).resolves.toBeNull();
    expect(cookieJar.get(SESSION_COOKIE.cartId)).toBeUndefined();
  });

  it("первое добавление товара создаёт корзину и кладёт её id в httpOnly-cookie", async () => {
    const variantId = await anyVariantId();
    const result = await addLineItem({ variantId, quantity: 2 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items?.[0]).toMatchObject({ variantId: variantId, quantity: 2 });

    const cookie = cookieJar.get(SESSION_COOKIE.cartId);
    expect(cookie?.value).toBe(result.data.id);
    expect(cookie?.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: CART_COOKIE_MAX_AGE,
    });
  });

  it("следующие добавления идут в ту же корзину", async () => {
    const [first, second] = await variantIds(2);
    const a = await addLineItem({ variantId: first!, quantity: 1 });
    const b = await addLineItem({ variantId: second!, quantity: 1 });

    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(b.data.id).toBe(a.data.id);
    expect(b.data.items).toHaveLength(2);
  });

  it("getCart возвращает текущую корзину по cookie", async () => {
    const created = await cartWithItem();
    const cart = await getCart();
    expect(cart?.id).toBe(created.id);
    expect(cart?.items).toHaveLength(1);
  });

  it("изменение количества позиции", async () => {
    const cart = await cartWithItem();
    const lineId = cart.items![0]!.id;

    const result = await updateLineItem({ lineId, quantity: 5 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.items?.[0]?.quantity).toBe(5);
  });

  it("удаление позиции возвращает обновлённую корзину", async () => {
    const cart = await cartWithItem();

    const result = await removeLineItem(cart.items![0]!.id);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe(cart.id);
      expect(result.data.items).toHaveLength(0);
    }
  });

  it("updateCart меняет данные корзины (email покупателя)", async () => {
    await cartWithItem();
    const email = uniqueEmail("guest");

    const result = await updateCart({ email });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBe(email);
  });

  it("битый id в cookie: getCart → null, добавление создаёт новую корзину", async () => {
    cookieJar.set(SESSION_COOKIE.cartId, "cart_does_not_exist");

    await expect(getCart()).resolves.toBeNull();

    const result = await addLineItem({ variantId: await anyVariantId(), quantity: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.id).not.toBe("cart_does_not_exist");
    expect(cookieJar.value(SESSION_COOKIE.cartId)).toBe(result.data.id);
  });

  it("изменение позиции без корзины → ошибка 404 в ActionResult, без исключения", async () => {
    const result = await updateLineItem({ lineId: "line_x", quantity: 1 });
    expect(result).toEqual({
      ok: false,
      error: { status: 404, type: "not_found", message: "Cart not found" },
    });
  });

  it("ошибка Medusa (несуществующий вариант) приходит статусом и текстом", async () => {
    const result = await addLineItem({ variantId: "variant_does_not_exist", quantity: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBeGreaterThanOrEqual(400);
      expect(result.error.status).toBeLessThan(500);
      expect(result.error.message).toBeTruthy();
    }
  });

  it("forgetCart удаляет cookie, корзина больше не видна", async () => {
    await cartWithItem();

    await expect(forgetCart()).resolves.toEqual({ ok: true, data: null });
    expect(cookieJar.get(SESSION_COOKIE.cartId)).toBeUndefined();
    await expect(getCart()).resolves.toBeNull();
  });
});

describe("Маппер имён на живой Medusa", () => {
  it("адрес (address_1, countryCode, firstName) проходит туда и обратно без потерь", async () => {
    await cartWithItem();
    const result = await updateCart({
      shippingAddress: {
        firstName: "Иван",
        lastName: "Петров",
        address_1: "ул. Ленина, 1",
        address_2: "кв. 5",
        city: "Москва",
        postalCode: "101000",
        countryCode: "ru",
        phone: "+79990000000",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.shippingAddress).toMatchObject({
      firstName: "Иван",
      lastName: "Петров",
      address_1: "ул. Ленина, 1",
      address_2: "кв. 5",
      postalCode: "101000",
      countryCode: "ru",
    });
  });

  it("ключи metadata сохраняются как есть (данные конкретного магазина)", async () => {
    const result = await addLineItem({
      variantId: await anyVariantId(),
      quantity: 1,
      metadata: { lens_type: "progressive", engravingText: "Для мамы" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items?.[0]?.metadata).toEqual({ lens_type: "progressive", engravingText: "Для мамы" });
    }
  });
});
