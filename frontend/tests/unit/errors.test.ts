import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ApiError } from "@shared/api/http";
import { ActionFailure } from "@shared/lib/action-result";
import { errorMessages, getErrorMessage, getFieldErrors } from "@shared/lib/errors";

const apiError = (status: number, body: unknown) => new ApiError(status, body, new Response(null, { status }));

describe("getErrorMessage: любая ошибка → текст для покупателя (единое место)", () => {
  it("известные тексты Medusa переводятся — откуда бы ни пришла ошибка", () => {
    const message = "Invalid email or password";
    expect(getErrorMessage(new ActionFailure({ status: 401, message }))).toBe(errorMessages.invalidCredentials);
    expect(getErrorMessage(apiError(401, { type: "unauthorized", message }))).toBe(errorMessages.invalidCredentials);
    expect(getErrorMessage({ status: 401, message })).toBe(errorMessages.invalidCredentials);
    expect(getErrorMessage(new ActionFailure({ status: 401, message: "Identity with email already exists" }))).toBe(
      errorMessages.emailTaken,
    );
  });

  it("незнакомый текст — по статусу", () => {
    expect(getErrorMessage(new ActionFailure({ status: 401, message: "jwt expired" }))).toBe(errorMessages.unauthorized);
    expect(getErrorMessage(new ActionFailure({ status: 404, message: "Product x not found" }))).toBe(
      errorMessages.notFound,
    );
    expect(getErrorMessage(new ActionFailure({ status: 429, message: "slow down" }))).toBe(errorMessages.tooManyRequests);
  });

  it("технические подробности наружу не попадают", () => {
    expect(getErrorMessage(new ActionFailure({ status: 500, message: "connect ECONNREFUSED 10.0.0.1" }))).toBe(
      errorMessages.default,
    );
    expect(getErrorMessage(apiError(400, { type: "invalid_data", message: "Invalid request: Field 'x'" }))).toBe(
      errorMessages.default,
    );
    expect(getErrorMessage(new Error("network"))).toBe(errorMessages.default);
    expect(getErrorMessage("???")).toBe(errorMessages.default);
  });

  it("ошибка валидации (zod на сервере) показывается своим текстом", () => {
    const zodError = z.object({ email: z.email({ error: errorMessages.email }) }).safeParse({ email: "x" }).error;
    expect(getErrorMessage(zodError)).toBe(errorMessages.email);
    expect(getErrorMessage(new ActionFailure({ status: 400, type: "validation", message: "Минимум 8 символов" }))).toBe(
      "Минимум 8 символов",
    );
  });
});

describe("getFieldErrors: ошибки zod → подсветка полей", () => {
  it("первое сообщение для каждого поля", () => {
    const schema = z.object({
      email: z.email({ error: errorMessages.email }),
      password: z.string().min(8, { error: errorMessages.passwordTooShort(8) }),
    });
    const { error } = schema.safeParse({ email: "x", password: "1" });
    expect(getFieldErrors(error!)).toEqual({ email: errorMessages.email, password: "Минимум 8 символов" });
  });
});
