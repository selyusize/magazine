import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { Injectable } from "@shared/container";

import type { ProductSupplierOfferDTO } from "./dto";
import type { GetSupplierOffersByProductIdQuery } from "./query";

type OfferRow = {
  id: string;
  supplier_id: string;
  supplier: { name: string; is_active: boolean } | null;
  variant_id: string;
  external_id: string;
  sku: string | null;
  barcode: string | null;
  purchase_price: number | string | null;
  quantity: number;
  synced_at: string | Date | null;
};

const toProductSupplierOfferDTO = (
  offer: OfferRow,
  variantTitles: Map<string, string>,
): ProductSupplierOfferDTO => ({
  id: offer.id,
  supplier_id: offer.supplier_id,
  supplier_name: offer.supplier?.name ?? "—",
  supplier_is_active: offer.supplier?.is_active ?? false,
  variant_id: offer.variant_id,
  variant_title: variantTitles.get(offer.variant_id) ?? offer.variant_id,
  external_id: offer.external_id,
  sku: offer.sku ?? null,
  barcode: offer.barcode ?? null,
  purchase_price:
    offer.purchase_price === null ? null : Number(offer.purchase_price),
  quantity: Number(offer.quantity),
  synced_at: offer.synced_at ? new Date(offer.synced_at) : null,
});

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
    return (offers as OfferRow[]).map((offer) =>
      toProductSupplierOfferDTO(offer, titles),
    );
  }
}
