import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/** HTTP-обработчик маршрута: разбирает запрос, вызывает Handler/Fetcher, отдаёт ответ. */
export interface Action<TRequest extends MedusaRequest = MedusaRequest> {
  handle(req: TRequest, res: MedusaResponse): Promise<void>;
}
