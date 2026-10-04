import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { EXCHANGE_MODULE } from "../../../index";
import type { ExchangeModuleService } from "../../../service/exchange-module-service";
import type { MapExchangePropertyToAttributeCommand } from "../command";
import type { MappedExchangePropertyDTO } from "../dto";

/**
 * Характеристика свойства — только из магазина поставщика (чужая — 400); товары получат значения на следующем
 * импорте (хэш изменится). Откат — прежняя.
 */
export const setExchangePropertyAttributeStep = createStep(
  "set-exchange-property-attribute",
  async (command: MapExchangePropertyToAttributeCommand, { container }) => {
    const exchange = container.resolve<ExchangeModuleService>(EXCHANGE_MODULE);
    const [property] = await exchange.listExchangeProperties({ id: command.id });
    if (!property) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Свойство поставщика ${command.id} не найдено`);
    if (command.attribute_id) {
      const query = container.resolve(ContainerRegistrationKeys.QUERY);
      const [{ data: attributes }, { data: suppliers }] = await Promise.all([
        query.graph({ entity: "attribute", fields: ["id", "shop_id"], filters: { id: command.attribute_id } }),
        query.graph({ entity: "supplier", fields: ["id", "shop_id"], filters: { id: property.supplier_id } }),
      ]);
      if (!attributes.length)
        throw new MedusaError(MedusaError.Types.NOT_FOUND, `Характеристика ${command.attribute_id} не найдена`);
      if (attributes[0].shop_id !== suppliers[0]?.shop_id)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Характеристика ${command.attribute_id} из другого магазина — выберите характеристику магазина поставщика`,
        );
    }
    await exchange.updateExchangeProperties({ id: property.id, attribute_id: command.attribute_id });
    const dto: MappedExchangePropertyDTO = { id: property.id, attribute_id: command.attribute_id };
    return new StepResponse(dto, { id: property.id, attribute_id: property.attribute_id ?? null });
  },
  async (previous, { container }) => {
    if (!previous) return;
    await container.resolve<ExchangeModuleService>(EXCHANGE_MODULE).updateExchangeProperties(previous);
  },
);
