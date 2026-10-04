import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

/**
 * Middleware маршрутов как класс из контейнера: дополняет запрос (магазин) или отклоняет его (чужой Origin).
 * Точка входа в `src/api/middlewares/*.ts` только берёт класс из контейнера и передаёт ошибку в `next`.
 */
export interface Middleware<TRequest extends MedusaRequest = MedusaRequest> {
  handle(
    req: TRequest,
    res: MedusaResponse,
    next: MedusaNextFunction,
  ): Promise<void>;
}
