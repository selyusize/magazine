import { z } from "zod";

import { ApiError } from "@shared/api/http";

import { ActionFailure, toActionError, type ActionError } from "./action-result";

/**
 * Единственное место, где живут тексты ошибок и правила их показа.
 * Фичи не пишут свои сообщения: схемы zod берут тексты отсюда, UI получает готовую строку от getErrorMessage.
 */
export const errorMessages = {
  default: "Не удалось выполнить запрос. Попробуйте ещё раз",
  unauthorized: "Войдите в аккаунт, чтобы продолжить",
  invalidCredentials: "Неверный email или пароль",
  emailTaken: "Этот email уже зарегистрирован. Войдите или восстановите пароль",
  tooManyRequests: "Слишком много попыток. Попробуйте позже",
  notFound: "Не найдено",
  cartNotFound: "Корзина не найдена",
  required: "Обязательное поле",
  email: "Введите корректный email",
  passwordTooShort: (min: number) => `Минимум ${min} символов`,
  passwordsMismatch: "Пароли не совпадают",
} as const;

/** Тексты ошибок Medusa → сообщение покупателю. */
const byBackendMessage: Record<string, string> = {
  "Invalid email or password": errorMessages.invalidCredentials,
  "Identity with email already exists": errorMessages.emailTaken,
  "Cart not found": errorMessages.cartNotFound,
};

const byStatus: Record<number, string> = {
  401: errorMessages.unauthorized,
  404: errorMessages.notFound,
  429: errorMessages.tooManyRequests,
};

function normalize(error: unknown): ActionError {
  if (error instanceof ActionFailure) return error.error;
  if (error instanceof ApiError || error instanceof z.ZodError || error instanceof Error) return toActionError(error);
  if (typeof error === "object" && error !== null && "status" in error && "message" in error) {
    return error as ActionError;
  }
  return toActionError(error);
}

/** Любая ошибка (Medusa, Server Action, валидация, сеть) → текст для покупателя. */
export function getErrorMessage(error: unknown): string {
  const { status, message, type } = normalize(error);
  // Ошибки валидации уже содержат текст из errorMessages / локали zod
  if (type === "validation") return message;
  return byBackendMessage[message] ?? byStatus[status] ?? errorMessages.default;
}

/** Ошибки zod → { поле: первое сообщение } для подсветки полей формы. */
export function getFieldErrors<T>(error: z.ZodError<T>): Partial<Record<keyof T & string, string>> {
  const { fieldErrors } = z.flattenError(error);
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [field, (messages as string[] | undefined)?.[0]]),
  ) as Partial<Record<keyof T & string, string>>;
}
