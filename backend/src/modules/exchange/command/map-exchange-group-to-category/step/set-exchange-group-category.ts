import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { EXCHANGE_MODULE } from "../../../index";
import type { ExchangeModuleService } from "../../../service/exchange-module-service";
import type { MapExchangeGroupToCategoryCommand } from "../command";
import type { MappedExchangeGroupDTO } from "../dto";

/**
 * Категория группы. Категория — часть данных товара (`ImportedProduct.category_id`): хэш товаров группы изменится,
 * и следующий импорт перенесёт их. Откат возвращает прежнюю категорию.
 */
export const setExchangeGroupCategoryStep = createStep(
  "set-exchange-group-category",
  async (command: MapExchangeGroupToCategoryCommand, { container }) => {
    const exchange = container.resolve<ExchangeModuleService>(EXCHANGE_MODULE);
    const [group] = await exchange.listExchangeGroups({ id: command.id });
    if (!group) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Группа поставщика ${command.id} не найдена`);
    if (command.category_id) {
      const query = container.resolve(ContainerRegistrationKeys.QUERY);
      const { data } = await query.graph({
        entity: "product_category",
        fields: ["id"],
        filters: { id: command.category_id },
      });
      if (!data.length) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Категория ${command.category_id} не найдена`);
    }
    await exchange.updateExchangeGroups({ id: group.id, category_id: command.category_id });
    const dto: MappedExchangeGroupDTO = { id: group.id, category_id: command.category_id };
    return new StepResponse(dto, { id: group.id, category_id: group.category_id ?? null });
  },
  async (previous, { container }) => {
    if (!previous) return;
    await container.resolve<ExchangeModuleService>(EXCHANGE_MODULE).updateExchangeGroups(previous);
  },
);
