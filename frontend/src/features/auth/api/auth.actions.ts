"use server";

import { forgetCart, transferCart } from "@entities/cart";
import { getCustomer } from "@entities/customer";
import {
  postActorTypeAuthProvider,
  postActorTypeAuthProviderRegister,
  postCustomers,
  type StoreCustomer,
} from "@shared/api";
import { ActionFailure, runAction, unwrap, type ActionResult } from "@shared/lib/action-result";
import { removeAuthToken, setAuthToken } from "@shared/session";

import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "../model/schemas";

/** Провайдер Medusa для входа по email + паролю. Другие (Google и т.п.) — отдельный flow с redirect. */
const PROVIDER = "emailpass";

async function authenticate({ email, password }: LoginInput): Promise<string> {
  const result = await postActorTypeAuthProvider(PROVIDER, { email, password });
  if ("location" in result) {
    throw new ActionFailure({ status: 400, message: "Redirect-based auth is not supported here" });
  }
  return result.token;
}

/**
 * Вход:
 * 1. Medusa проверяет email/пароль и выдаёт JWT;
 * 2. JWT → httpOnly-cookie;
 * 3. гостевая корзина привязывается к покупателю;
 * 4. возвращается покупатель.
 */
export async function login(credentials: LoginInput): Promise<ActionResult<StoreCustomer>> {
  return runAction(async () => {
    // Server Action — публичный эндпоинт: вход проверяется той же схемой, что и форма
    await setAuthToken(await authenticate(loginSchema.parse(credentials)));
    unwrap(await transferCart());
    const customer = await getCustomer();
    if (!customer) throw new ActionFailure({ status: 401, message: "Customer not found" });
    return customer;
  });
}

/**
 * Регистрация:
 * 1. Medusa создаёт auth identity и выдаёт регистрационный токен;
 * 2. этим токеном создаётся покупатель (имя, телефон, metadata — что нужно магазину);
 * 3. обычный вход.
 */
export async function register(input: RegisterInput): Promise<ActionResult<StoreCustomer>> {
  const created = await runAction(async () => {
    const { email, password, ...profile } = registerSchema.parse(input);
    const { token } = await postActorTypeAuthProviderRegister(PROVIDER, { email, password });
    await postCustomers({ ...profile, email }, {}, { headers: { Authorization: `Bearer ${token}` } });
  });
  if (!created.ok) return created;
  return login({ email: input.email, password: input.password });
}

/** Выход: забываем JWT и корзину (она осталась за покупателем и вернётся после входа). */
export async function logout(): Promise<ActionResult<null>> {
  return runAction(async () => {
    await removeAuthToken();
    unwrap(await forgetCart());
    return null;
  });
}
