import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/http";
import { ActionFailure, runAction, toActionError, unwrap } from "@shared/lib/action-result";

const apiError = (status: number, body: unknown) => new ApiError(status, body, new Response(null, { status }));

describe("ActionResult: единый формат ответа Server Actions", () => {
  it("успех → { ok: true, data }", async () => {
    await expect(runAction(async () => 42)).resolves.toEqual({ ok: true, data: 42 });
  });

  it("ошибка Medusa → статус, текст и тип из тела ответа", async () => {
    const result = await runAction(async () => {
      throw apiError(401, { type: "unauthorized", message: "Invalid email or password" });
    });
    expect(result).toEqual({
      ok: false,
      error: { status: 401, type: "unauthorized", message: "Invalid email or password" },
    });
  });

  it("ActionFailure (своя ошибка) передаётся как есть", () => {
    const error = { status: 404, type: "not_found", message: "Cart not found" };
    expect(toActionError(new ActionFailure(error))).toEqual(error);
  });

  it("любая другая ошибка → 500 с текстом", () => {
    expect(toActionError(new Error("boom"))).toEqual({ status: 500, message: "boom" });
    expect(toActionError("???")).toEqual({ status: 500, message: "Unknown error" });
  });

  it("unwrap: данные при успехе, ActionFailure при ошибке (для TanStack Query)", () => {
    expect(unwrap({ ok: true, data: "cart" })).toBe("cart");
    const failure = (() => {
      try {
        unwrap({ ok: false, error: { status: 404, message: "Cart not found" } });
      } catch (error) {
        return error;
      }
    })();
    expect(failure).toBeInstanceOf(ActionFailure);
    expect((failure as ActionFailure).error.status).toBe(404);
  });
});
