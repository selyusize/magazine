import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { isString, recordOf, records, text, textOrNull } from "@shared/query/narrow";

import { planNewVariants } from "../../../service/variants-plan";
import type { AddExchangeVariantsCommand } from "../command";

/** Только чтение: опции и варианты карточки, валюта магазина → план новых вариантов (`planNewVariants`). */
export const planExchangeVariantsStep = createStep(
  "plan-exchange-variants",
  async (command: AddExchangeVariantsCommand, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const [{ data: products }, { data: stores }] = await Promise.all([
      query.graph({
        entity: "product",
        fields: ["id", "options.id", "options.title", "options.values.value", "variants.title"],
        filters: { id: command.product_id },
      }),
      query.graph({
        entity: "store",
        fields: ["supported_currencies.currency_code", "supported_currencies.is_default"],
      }),
    ]);
    if (!products[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Товар ${command.product_id} не найден`);
    const product = recordOf(products[0]);
    const currencies = records(recordOf(stores[0]).supported_currencies);

    return new StepResponse(
      planNewVariants({
        offers: command.offers,
        options: records(product.options).map((option) => ({
          id: text(option.id),
          title: text(option.title),
          values: records(option.values).flatMap((value) => (isString(value.value) ? [value.value] : [])),
        })),
        variant_titles: records(product.variants).flatMap((variant) => (isString(variant.title) ? [variant.title] : [])),
        currency_code:
          textOrNull(currencies.find((currency) => currency.is_default === true)?.currency_code) ??
          textOrNull(currencies[0]?.currency_code) ??
          "rub",
        settings: command.settings,
        price_types: command.price_types,
      }),
    );
  },
);
