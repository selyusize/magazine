"use server";

import {
  ApiError,
  getCustomersMe,
  postCustomersMe,
  type StoreCustomer,
  type StoreUpdateCustomer,
} from "@shared/api";
import { runAction, type ActionResult } from "@shared/lib/action-result";
import { authHeaders, getAuthToken } from "@shared/session";

import { CUSTOMER_FIELDS } from "../config/fields";

/** Текущий покупатель или null (гость / токен истёк). */
export async function getCustomer(): Promise<StoreCustomer | null> {
  if (!(await getAuthToken())) return null;
  try {
    const { customer } = await getCustomersMe(
      { fields: CUSTOMER_FIELDS },
      { headers: await authHeaders(), cache: "no-store" },
    );
    return customer;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function updateCustomer(data: StoreUpdateCustomer): Promise<ActionResult<StoreCustomer>> {
  return runAction(async () => {
    const { customer } = await postCustomersMe(
      data,
      { fields: CUSTOMER_FIELDS },
      { headers: await authHeaders(), cache: "no-store" },
    );
    return customer;
  });
}
