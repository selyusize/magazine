import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetRevalidateSecretByShopIdAction } from "@domain/shop/action/get-revalidate-secret-by-shop-id/action";
import { RegenerateRevalidateSecretForShopAction } from "@domain/shop/action/regenerate-revalidate-secret-for-shop/action";

/** Адрес вебхука витрины и секрет текущего магазина (`x-shop-id`) — для env фронта и vault Ansible. */
export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetRevalidateSecretByShopIdAction).handle(req, res);

/** Перевыпуск секрета. */
export const POST = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(RegenerateRevalidateSecretForShopAction).handle(req, res);
