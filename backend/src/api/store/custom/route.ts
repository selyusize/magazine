import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * Пример своего store-роута. JSDoc-блок `@oas` попадает в openapi/store.oas.json
 * (`pnpm openapi:generate`), а из него — в клиент фронта (Orval).
 *
 * @oas [get] /store/custom
 * operationId: GetCustom
 * summary: Пример кастомного роута
 * tags:
 *   - Custom
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required:
 *             - message
 *           properties:
 *             message:
 *               type: string
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ message: "ok" });
}
