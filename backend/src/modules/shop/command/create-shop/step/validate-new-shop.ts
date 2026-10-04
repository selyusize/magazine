import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { SHOP_MODULE } from "../../../index";
import type { ShopModuleService } from "../../../service/shop-module-service";
import type { CreateShopCommand } from "../command";

/**
 * Только чтение: slug и домен свободны. Проверка до создания канала и ключа — чтобы занятый адрес давал
 * понятную 400, а не откат после ошибки уникального индекса.
 */
export const validateNewShopStep = createStep(
  "validate-new-shop",
  async (command: CreateShopCommand, { container }) => {
    const shops = container.resolve<ShopModuleService>(SHOP_MODULE);
    const [taken] = await shops.listShops(
      { $or: [{ slug: command.slug }, { domain: command.domain }] },
      { select: ["slug", "domain"], take: 1 },
    );

    if (taken?.slug === command.slug)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Slug магазина «${command.slug}» уже занят`,
      );
    if (taken)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Домен «${command.domain}» уже занят другим магазином`,
      );

    return new StepResponse(command);
  },
);
