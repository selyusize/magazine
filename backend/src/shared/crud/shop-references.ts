import { MedusaError } from "@medusajs/framework/utils";

import { foreignShopError } from "../shop/catalog-shop";
import { shopIdAt } from "../shop/shop-ownership";
import type { CRUDShopReference } from "./definition";

/** Ссылка тела на сущность магазина, которую надо проверить: поле задано строкой. */
export type ShopReferenceCheck = { reference: CRUDShopReference; id: string };

/** Ссылки, которые есть в теле: незаданное поле (изменение без него) не проверяется. */
export const shopReferenceChecks = (
  references: CRUDShopReference[],
  data: Record<string, unknown>,
): ShopReferenceCheck[] =>
  references.flatMap((reference) => {
    const id = data[reference.field];
    return typeof id === "string" && id ? [{ reference, id }] : [];
  });

/**
 * Что не так со ссылкой: сущности нет — 400 «не найдено», она из другого магазина (или ничья) — 400
 * `foreignShopError`. `row` — строка Query с `reference.shop_field` или `undefined`. `null` — всё в порядке.
 */
export function shopReferenceError(
  { reference, id }: ShopReferenceCheck,
  row: unknown,
  shopId: string,
): MedusaError | null {
  if (row === undefined)
    return new MedusaError(MedusaError.Types.INVALID_DATA, `Не найдено: ${reference.label.toLowerCase()} ${id}`);
  return shopIdAt(row, reference.shop_field) === shopId ? null : foreignShopError(`${reference.label} ${id}`);
}
