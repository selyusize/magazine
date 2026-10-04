import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { CreateShopHandler } from "../../command/create-shop/handler";
import type { CreateShopBody } from "../../crud/schema";

/** POST /admin/shops — создание магазина вместе с каналом продаж, ключом и корневой категорией. */
@Injectable()
export class CreateShopAction implements Action<
  AuthenticatedMedusaRequest<CreateShopBody>
> {
  constructor(private readonly handler: CreateShopHandler) {}

  async handle(
    req: AuthenticatedMedusaRequest<CreateShopBody>,
    res: MedusaResponse,
  ): Promise<void> {
    const { settings, ...body } = req.validatedBody;
    const shop = await this.handler.handle({
      ...body,
      settings: settings ?? {},
    });
    res.status(201).json({ shop });
  }
}
