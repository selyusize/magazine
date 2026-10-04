import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetNetworkSettingsAction } from "@domain/shop/action/get-network-settings/action";
import { UpdateNetworkSettingsAction } from "@domain/shop/action/update-network-settings/action";
import type { UpdateNetworkSettingsBody } from "@domain/shop/action/update-network-settings/schema";

/** Реквизиты сети — одни на все магазины, заголовок магазина не нужен. */
export const GET = (req: MedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetNetworkSettingsAction).handle(req, res);

export const POST = (
  req: AuthenticatedMedusaRequest<UpdateNetworkSettingsBody>,
  res: MedusaResponse,
) =>
  Container.from(req.scope).get(UpdateNetworkSettingsAction).handle(req, res);
