import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { toSlug } from "@shared/service/slug/slug";

import {
  isString,
  numberOrNull,
  recordOf,
  recordOrNull,
  records,
  text,
  textOrNull,
} from "@shared/query/narrow";

import { ImportedProductSchema, nameKey } from "../../../service/imported-product";
import type { SupplierShop } from "../../../step/find-supplier-shop";
import { optionsKey } from "../../../service/offer-plan";
import type { ExistingVariant, OffersImportState, StagedProduct } from "../../../service/offers-import-plan";
import type { ImportExchangeOffersCommand } from "../command";

/** Предложение другого поставщика и карточка его варианта — кандидат в дубли. */
type OfferLink = { sku: string | null; barcode: string | null; product_id: string };

const toOfferLink = (value: unknown): OfferLink[] => {
  const offer = recordOf(value);
  const productId = textOrNull(recordOrNull(offer.product_variant)?.product_id);
  return productId ? [{ sku: textOrNull(offer.sku), barcode: textOrNull(offer.barcode), product_id: productId }] : [];
};

const unique = (values: (string | null | undefined)[]) => [
  ...new Set(values.filter((value): value is string => Boolean(value))),
];

/**
 * Только чтение: всё, что нужно плану пачки (`planOffersImport`) — товары поставщика, прежние связи предложений,
 * варианты карточек, дубли у других поставщиков его магазина (штрихкод, затем артикул + бренд), занятые handle,
 * валюта, канал продаж магазина поставщика и профиль доставки.
 */
export const loadExchangeOffersStateStep = createStep(
  "load-exchange-offers-state",
  async ({ command, shop }: { command: ImportExchangeOffersCommand; shop: SupplierShop }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const productExternalIds = unique(command.offers.map((offer) => offer.product_external_id));

    const [{ data: rows }, { data: offers }, { data: stores }, { data: profiles }] = await Promise.all([
      query.graph({
        entity: "exchange_product",
        fields: ["id", "external_id", "product_id", "is_owner", "is_deleted", "data"],
        filters: { supplier_id: command.supplier_id, external_id: productExternalIds },
      }),
      query.graph({
        entity: "supplier_offer",
        fields: ["external_id", "variant_id"],
        filters: { supplier_id: command.supplier_id, external_id: command.offers.map((offer) => offer.external_id) },
      }),
      query.graph({
        entity: "store",
        fields: ["supported_currencies.currency_code", "supported_currencies.is_default"],
      }),
      query.graph({ entity: "shipping_profile", fields: ["id"], filters: { type: "default" } }),
    ]);

    const staged = Object.fromEntries(
      rows.flatMap((row) => {
        const data = ImportedProductSchema.safeParse(row.data);
        if (!data.success) return [];
        const product: StagedProduct = {
          id: row.id,
          product_id: row.product_id,
          is_owner: row.is_owner,
          is_deleted: row.is_deleted,
          data: data.data,
        };
        return [[row.external_id, product]];
      }),
    );
    const unlinked = Object.values(staged).filter((row) => !row.product_id && !row.is_deleted);
    const duplicates = await findDuplicates(query, command, shop, unlinked);

    const productIds = unique([...Object.values(staged).map((row) => row.product_id), ...Object.values(duplicates)]);
    const store = stores[0];
    const currency =
      store?.supported_currencies?.find((currency) => currency?.is_default)?.currency_code ??
      store?.supported_currencies?.[0]?.currency_code ??
      "rub";

    const state: OffersImportState = {
      staged,
      offer_variants: Object.fromEntries(offers.map((offer) => [offer.external_id, offer.variant_id])),
      products: productIds.length ? await loadVariants(query, productIds, currency) : {},
      duplicates,
      taken_handles: await takenHandles(
        query,
        unlinked.filter((row) => !duplicates[row.data.external_id]).map((row) => toSlug(row.data.title) || "product"),
      ),
      currency_code: currency,
      sales_channel_id: shop.sales_channel_id,
      shipping_profile_id: profiles[0]?.id ?? null,
    };
    return new StepResponse(state);
  },
);

type Query = { graph: (config: Record<string, unknown>) => Promise<{ data: unknown[] }> };

/**
 * Карточки других поставщиков того же магазина с тем же штрихкодом, иначе — с тем же артикулом и брендом. Товары
 * других магазинов не склеиваются: у каждого магазина свои карточки.
 */
async function findDuplicates(
  query: Query,
  command: ImportExchangeOffersCommand,
  shop: SupplierShop,
  unlinked: StagedProduct[],
): Promise<Record<string, string>> {
  if (!unlinked.length) return {};
  const offersOf = (externalId: string) =>
    command.offers.filter((offer) => offer.product_external_id === externalId);
  const barcodesOf = (row: StagedProduct) =>
    unique([row.data.barcode, ...offersOf(row.data.external_id).map((offer) => offer.barcode)]);
  const skusOf = (row: StagedProduct) =>
    unique([row.data.sku, ...offersOf(row.data.external_id).map((offer) => offer.sku)]);

  const barcodes = unique(unlinked.flatMap(barcodesOf));
  const skus = unique(unlinked.filter((row) => row.data.brand).flatMap(skusOf));
  if (!barcodes.length && !skus.length) return {};

  const { data: neighbours } = await query.graph({
    entity: "supplier",
    fields: ["id"],
    filters: { shop_id: shop.shop_id, id: { $ne: command.supplier_id } },
  });
  const others = unique(records(neighbours).map((supplier) => textOrNull(supplier.id)));
  if (!others.length) return {};

  const [{ data: byBarcode }, { data: bySku }] = await Promise.all([
    barcodes.length
      ? query.graph({
          entity: "supplier_offer",
          fields: ["barcode", "product_variant.product_id"],
          filters: { supplier_id: others, barcode: barcodes },
        })
      : { data: [] },
    skus.length
      ? query.graph({
          entity: "supplier_offer",
          fields: ["sku", "product_variant.product_id"],
          filters: { supplier_id: others, sku: skus },
        })
      : { data: [] },
  ]);
  const productByBarcode = new Map(
    byBarcode.flatMap(toOfferLink).flatMap((offer) => (offer.barcode ? [[offer.barcode, offer.product_id] as const] : [])),
  );
  const skuCandidates = bySku.flatMap(toOfferLink);
  const { data: brands } = skuCandidates.length
    ? await query.graph({
        entity: "product",
        fields: ["id", "brand.name"],
        filters: { id: unique(skuCandidates.map((offer) => offer.product_id)) },
      })
    : { data: [] };
  const brandOf = new Map(
    records(brands).map((product) => {
      const name = textOrNull(recordOrNull(product.brand)?.name);
      return [text(product.id), name ? nameKey(name) : null] as const;
    }),
  );

  const duplicates: Record<string, string> = {};
  for (const row of unlinked) {
    const byCode = barcodesOf(row)
      .map((barcode) => productByBarcode.get(barcode))
      .find(Boolean);
    const brand = row.data.brand ? nameKey(row.data.brand) : null;
    const byArticle = brand
      ? skuCandidates.find(
          (offer) => offer.sku !== null && skusOf(row).includes(offer.sku) && brandOf.get(offer.product_id) === brand,
        )?.product_id
      : undefined;
    const productId = byCode ?? byArticle;
    if (productId) duplicates[row.data.external_id] = productId;
  }
  return duplicates;
}

/** Варианты карточек: ключ опций, штрихкоды предложений всех поставщиков, цена в валюте магазина. */
async function loadVariants(
  query: Query,
  productIds: string[],
  currency: string,
): Promise<Record<string, { variants: ExistingVariant[] }>> {
  const { data } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "product_id",
      "options.value",
      "options.option.title",
      "prices.amount",
      "prices.currency_code",
      "supplier_offers.barcode",
    ],
    filters: { product_id: productIds },
  });
  const products: Record<string, { variants: ExistingVariant[] }> = {};
  for (const variant of records(data)) {
    const options = Object.fromEntries(
      records(variant.options).flatMap((value) => {
        const title = textOrNull(recordOrNull(value.option)?.title);
        return title ? [[title, text(value.value)]] : [];
      }),
    );
    const price = records(variant.prices).find((price) => price.currency_code === currency)?.amount;
    (products[text(variant.product_id)] ??= { variants: [] }).variants.push({
      id: text(variant.id),
      options_key: optionsKey(options),
      barcodes: unique(records(variant.supplier_offers).map((offer) => textOrNull(offer.barcode))),
      price: numberOrNull(price),
    });
  }
  return products;
}

/** Handle товаров, начинающиеся с данных slug: из них план выберет свободные. */
async function takenHandles(query: Query, bases: string[]): Promise<string[]> {
  const prefixes = unique(bases);
  if (!prefixes.length) return [];
  const { data } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { $or: prefixes.map((base) => ({ handle: { $like: `${base}%` } })) },
    withDeleted: true,
  });
  return records(data).flatMap((product) => (isString(product.handle) ? [product.handle] : []));
}
