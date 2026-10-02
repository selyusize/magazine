import { z } from "zod";

import { ApiError } from "@shared/api/http";

/**
 * Единый формат ответа Server Actions, которые меняют данные.
 * Ошибки возвращаются значением, а не исключением: в проде Next скрывает
 * сообщения исключений из Server Actions, а статус и текст ошибки Medusa нужны UI.
 */
export type ActionError = {
  status: number;
  message: string;
  /** Тип ошибки Medusa (not_found, invalid_data, unauthorized, …) или `validation` — входные данные не прошли zod */
  type?: string;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function toActionError(error: unknown): ActionError {
  if (error instanceof ApiError) {
    const body = (error.body ?? {}) as { message?: string; type?: string };
    return { status: error.status, message: body.message ?? error.message, type: body.type };
  }
  if (error instanceof ActionFailure) return error.error;
  if (error instanceof z.ZodError) {
    return { status: 400, type: "validation", message: error.issues[0]?.message ?? "Invalid input" };
  }
  return { status: 500, message: error instanceof Error ? error.message : "Unknown error" };
}

/** Выполнить шаг action и завернуть результат/ошибку в ActionResult. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

/** Ошибка action на клиенте — её получает `onError` / `error` в TanStack Query. */
export class ActionFailure extends Error {
  constructor(public readonly error: ActionError) {
    super(error.message);
    this.name = "ActionFailure";
  }
}

/** Для mutationFn: вернуть данные или бросить ActionFailure. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new ActionFailure(result.error);
  return result.data;
}
