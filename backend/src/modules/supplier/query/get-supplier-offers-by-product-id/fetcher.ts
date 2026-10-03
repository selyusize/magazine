import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { Injectable } from "@shared/container";

import { dateOrNull, numberOr, numberOrNull, recordOf, recordOrNull, text, textOrNull } from "@shared/query/narrow";

import type { ProductSupplierOfferDTO } from "./dto";
import type { GetSupplierOffersByProductIdQuery } from "./query";

const toProductSupplierOfferDTO = (value: unknown, variantTitles: Map<string, string>): ProductSupplierOfferDTO => {
  const offer = recordOf(value);
  const supplier = recordOrNull(offer.supplier);
  const variantId = text(offer.variant_id);
  return {
    id: text(offer.id),
    supplier_id: text(offer.supplier_id),
    supplier_name: textOrNull(supplier?.name) ?? "—",
    supplier_is_active: supplier?.is_active === true,
    variant_id: variantId,
    variant_title: variantTitles.get(variantId) ?? variantId,
    external_id: text(offer.external_id),
    sku: textOrNull(offer.sku),
    barcode: textOrNull(offer.barcode),
    purchase_price: numberOrNull(offer.purchase_price),
    quantity: numberOr(offer.quantity),
    synced_at: dateOrNull(offer.synced_at),
  };
};

/** Предложения всех вариантов товара — блок «Поставщики» в карточке товара. Нет предложений — пустой список. */
@Injectable()
export class GetSupplierOffersByProductIdFetcher extends AbstractFetcher<
  GetSupplierOffersByProductIdQuery,
  ProductSupplierOfferDTO[]
> {
  async fetch(
    query: GetSupplierOffersByProductIdQuery,
  ): Promise<ProductSupplierOfferDTO[]> {
    const { data: variants } = await this.graph({
      entity: "product_variant",
      fields: ["id", "title"],
      filters: { product_id: query.product_id },
    });
    if (!variants.length) return [];

    const { data: offers } = await this.graph({
      entity: "supplier_offer",
      fields: [
        "id",
        "supplier_id",
        "supplier.name",
        "supplier.is_active",
        "variant_id",
        "external_id",
        "sku",
        "barcode",
        "purchase_price",
        "quantity",
        "synced_at",
      ],
      filters: { variant_id: variants.map((variant) => variant.id) },
      pagination: { order: { created_at: "ASC" } },
    });
    const titles = new Map<string, string>(
      variants.map((variant) => [variant.id, variant.title ?? variant.id]),
    );
    return offers.map((offer) =>
      toProductSupplierOfferDTO(offer, titles),
    );
  }
}
