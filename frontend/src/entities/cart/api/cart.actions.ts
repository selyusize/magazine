"use server";

import {
  ApiError,
  deleteCartsIdLineItemsLineId,
  getCartsId,
  postCarts,
  postCartsId,
  postCartsIdCustomer,
  postCartsIdLineItems,
  postCartsIdLineItemsLineId,
  type PostCartsIdBody,
  type StoreCart,
} from "@shared/api";
import { ActionFailure, runAction, type ActionResult } from "@shared/lib/action-result";
import { authHeaders, getCartId, removeCartId, setCartId } from "@shared/session";

import { CART_FIELDS } from "../config/fields";

// Все функции работают с корзиной текущего посетителя: id берётся из httpOnly-cookie,
// JWT (если покупатель вошёл) — тоже из cookie. Клиент id корзины не видит и не передаёт.

async function requestInit(): Promise<RequestInit> {
  return { headers: await authHeaders(), cache: "no-store" };
}

async function fetchCart(cartId: string, fields = CART_FIELDS): Promise<StoreCart | null> {
  try {
    const { cart } = await getCartsId(cartId, { fields }, await requestInit());
    return cart;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** id активной корзины; если её нет, она не найдена или уже оформлена — создаёт новую. */
async function ensureCartId(): Promise<string> {
  const cartId = await getCartId();
  if (cartId) {
    const cart = await fetchCart(cartId, "id,completed_at");
    if (cart && !cart.completedAt) return cart.id;
  }
  // Без region_id Medusa берёт регион магазина по умолчанию; сменить — updateCart({ region_id })
  const { cart } = await postCarts({}, { fields: "id" }, await requestInit());
  await setCartId(cart.id);
  return cart.id;
}

const cartNotFound = () => new ActionFailure({ status: 404, type: "not_found", message: "Cart not found" });

async function requireCartId(): Promise<string> {
  const cartId = await getCartId();
  if (!cartId) throw cartNotFound();
  return cartId;
}

/** Текущая корзина или null (корзины ещё нет / не найдена / уже оформлена). */
export async function getCart(): Promise<StoreCart | null> {
  const cartId = await getCartId();
  if (!cartId) return null;
  const cart = await fetchCart(cartId);
  return cart && !cart.completedAt ? cart : null;
}

export async function addLineItem(input: {
  variantId: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}): Promise<ActionResult<StoreCart>> {
  return runAction(async () => {
    const cartId = await ensureCartId();
    const { cart } = await postCartsIdLineItems(
      cartId,
      { variantId: input.variantId, quantity: input.quantity, metadata: input.metadata },
      { fields: CART_FIELDS },
      await requestInit(),
    );
    return cart;
  });
}

export async function updateLineItem(input: {
  lineId: string;
  quantity: number;
}): Promise<ActionResult<StoreCart>> {
  return runAction(async () => {
    const { cart } = await postCartsIdLineItemsLineId(
      await requireCartId(),
      input.lineId,
      { quantity: input.quantity },
      { fields: CART_FIELDS },
      await requestInit(),
    );
    return cart;
  });
}

export async function removeLineItem(lineId: string): Promise<ActionResult<StoreCart>> {
  return runAction(async () => {
    const cartId = await requireCartId();
    await deleteCartsIdLineItemsLineId(cartId, lineId, {}, await requestInit());
    const cart = await fetchCart(cartId);
    if (!cart) throw cartNotFound();
    return cart;
  });
}

/** Email, адреса, регион, канал продаж, metadata корзины. */
export async function updateCart(data: PostCartsIdBody): Promise<ActionResult<StoreCart>> {
  return runAction(async () => {
    const { cart } = await postCartsId(
      await ensureCartId(),
      data,
      { fields: CART_FIELDS },
      await requestInit(),
    );
    return cart;
  });
}

/**
 * Привязать гостевую корзину к вошедшему покупателю (вызывается после логина).
 * Если корзину привязать нельзя (например, она чужая) — забываем её.
 */
export async function transferCart(): Promise<ActionResult<StoreCart | null>> {
  return runAction(async () => {
    const cartId = await getCartId();
    if (!cartId) return null;
    try {
      const { cart } = await postCartsIdCustomer(cartId, {}, { fields: CART_FIELDS }, await requestInit());
      return cart;
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        await removeCartId();
        return null;
      }
      throw error;
    }
  });
}

/** Забыть корзину (после выхода или оформления заказа). Сама корзина в Medusa остаётся. */
export async function forgetCart(): Promise<ActionResult<null>> {
  return runAction(async () => {
    await removeCartId();
    return null;
  });
}
