import { SLUG_MAX_LENGTH, toSlug } from "@shared/service/slug/slug";
import { toStoredHandle } from "@shared/shop/shop-handle";

import type { CMLOffer, CMLPriceType } from "./commerceml/types";
import type { ExchangeSettings } from "./exchange-settings";
import type { ImportedProduct } from "./imported-product";
import { offerPrices, optionsKey, shapeProduct } from "./offer-plan";

/** Товар поставщика из `exchange_product`. */
export type StagedProduct = {
  id: string;
  product_id: string | null;
  is_owner: boolean;
  is_deleted: boolean;
  data: ImportedProduct;
};

/** Вариант карточки: ключ опций (`optionsKey`), штрихкоды его предложений и текущая цена в валюте магазина. */
export type ExistingVariant = { id: string; options_key: string; barcodes: string[]; price: number | null };

/** Что известно перед планированием пачки — собирает шаг `load-exchange-offers-state`. */
export type OffersImportState = {
  /** По `external_id` товара. */
  staged: Record<string, StagedProduct>;
  /** Уже существующие предложения поставщика: `external_id` предложения → вариант. */
  offer_variants: Record<string, string>;
  /** Карточки, к которым относятся предложения (свои и найденные дубли). */
  products: Record<string, { variants: ExistingVariant[] }>;
  /** Несвязанный товар поставщика → чужая карточка с тем же штрихкодом или артикулом + брендом. */
  duplicates: Record<string, string>;
  /** Занятые в магазине handle витрины (без префикса), начинающиеся так же, как slug новых товаров. */
  taken_handles: string[];
  currency_code: string;
  /** Магазин поставщика: handle новой карточки — `{магазин}ː{slug}`. */
  shop_slug: string;
  sales_channel_id: string | null;
  shipping_profile_id: string | null;
};

export type VariantRef = { variant_id: string } | { product_external_id: string; title: string };

export type PlannedOffer = {
  external_id: string;
  variant: VariantRef;
  sku: string | null;
  barcode: string | null;
  purchase_price: number | null;
  quantity: number | null;
};

export type ProductToCreate = {
  external_id: string;
  product: {
    title: string;
    handle: string;
    status: "draft";
    options: { title: string; values: string[] }[];
    variants: {
      title: string;
      options: Record<string, string>;
      manage_inventory: true;
      prices: { amount: number; currency_code: string }[];
    }[];
    sales_channels?: { id: string }[];
    shipping_profile_id?: string;
    weight?: number;
  };
};

export type OffersImportPlan = {
  create: ProductToCreate[];
  /** Связать товар поставщика с карточкой: новой (по `external_id` из `create`) или найденным дублем. */
  links: { row_id: string; external_id: string; product_id: string | null; is_owner: boolean }[];
  offers: PlannedOffer[];
  /** Розничная цена вариантов карточек поставщика-владельца. */
  prices: { variant_id: string; amount: number }[];
  /** Новые варианты у существующей карточки владельца — отдельной командой `add-exchange-variants`. */
  deferred: { product_id: string; external_id: string; offers: CMLOffer[] }[];
  errors: { external_id: string; message: string }[];
};

type Settings = Pick<ExchangeSettings, "purchase_price_type" | "retail_price_type" | "markup_percent">;

/**
 * План пачки предложений, без чтения и записи. Для каждого товара поставщика:
 *
 * - нет в `import.xml` — ошибка по каждому предложению;
 * - помечен удалённым — существующим предложениям остаток 0;
 * - уже есть карточка — предложение к варианту (по прежней связи или опциям); владелец обновляет розничную цену,
 *   новый вариант у карточки владельца — в `deferred`;
 * - карточки нет, но есть дубль у другого поставщика (штрихкод, артикул + бренд) — предложения к его вариантам;
 * - иначе — новая карточка-черновик с опциями и вариантами (handle — свободный в магазине slug названия с
 *   префиксом магазина).
 */
export function planOffersImport(input: {
  offers: CMLOffer[];
  settings: Settings;
  price_types: CMLPriceType[];
  state: OffersImportState;
}): OffersImportPlan {
  const { state } = input;
  const plan: OffersImportPlan = { create: [], links: [], offers: [], prices: [], deferred: [], errors: [] };
  const handles = new Set(state.taken_handles);
  const prices = new Map<string, number>();

  for (const [externalId, offers] of groupByProduct(input.offers)) {
    const staged = state.staged[externalId];
    if (!staged) {
      for (const offer of offers)
        plan.errors.push({ external_id: offer.external_id, message: "товара нет в каталоге поставщика (import.xml)" });
      continue;
    }

    const shape = shapeProduct(offers);
    const toOffer = (offer: CMLOffer, variant: VariantRef, quantity = offer.quantity): PlannedOffer => ({
      external_id: offer.external_id,
      variant,
      sku: offer.sku ?? staged.data.sku,
      barcode: offer.barcode ?? (offers.length === 1 ? staged.data.barcode : null),
      purchase_price: offerPrices(offer, input.settings, input.price_types).purchase,
      quantity: offer.deleted ? 0 : quantity,
    });

    if (staged.is_deleted) {
      for (const offer of offers) {
        const variantId = state.offer_variants[offer.external_id];
        if (variantId) plan.offers.push(toOffer(offer, { variant_id: variantId }, 0));
      }
      continue;
    }

    const productId = staged.product_id ?? state.duplicates[externalId] ?? null;
    if (!productId) {
      // Удалённые у поставщика предложения новой карточке вариантов не дают
      const live = offers.filter((offer) => !offer.deleted);
      if (!live.length) continue;
      const liveShape = shapeProduct(live);
      const handle = uniqueHandle(staged.data.title, handles);
      plan.create.push({
        external_id: externalId,
        product: {
          title: staged.data.title,
          handle: toStoredHandle({ shop: state.shop_slug, handle }),
          status: "draft",
          options: liveShape.options,
          variants: live.map((offer) => {
            const variant = liveShape.variants.get(offer.external_id)!;
            const retail = offerPrices(offer, input.settings, input.price_types).retail;
            return {
              title: variant.title,
              options: variant.options,
              manage_inventory: true,
              prices: retail === null ? [] : [{ amount: retail, currency_code: state.currency_code }],
            };
          }),
          ...(state.sales_channel_id ? { sales_channels: [{ id: state.sales_channel_id }] } : {}),
          ...(state.shipping_profile_id ? { shipping_profile_id: state.shipping_profile_id } : {}),
          ...(staged.data.weight ? { weight: staged.data.weight } : {}),
        },
      });
      plan.links.push({ row_id: staged.id, external_id: externalId, product_id: null, is_owner: true });
      for (const offer of live)
        plan.offers.push(
          toOffer(offer, { product_external_id: externalId, title: liveShape.variants.get(offer.external_id)!.title }),
        );
      continue;
    }

    const isOwner = staged.product_id ? staged.is_owner : false;
    if (!staged.product_id) plan.links.push({ row_id: staged.id, external_id: externalId, product_id: productId, is_owner: false });

    const variants = state.products[productId]?.variants ?? [];
    const missing: CMLOffer[] = [];
    for (const offer of offers) {
      const key = optionsKey(shape.variants.get(offer.external_id)!.options);
      const variant =
        variants.find((candidate) => candidate.id === state.offer_variants[offer.external_id]) ??
        (offer.barcode ? variants.find((candidate) => candidate.barcodes.includes(offer.barcode!)) : undefined) ??
        variants.find((candidate) => candidate.options_key === key) ??
        (!isOwner && variants.length === 1 && offers.length === 1 ? variants[0] : undefined);

      if (!variant) {
        if (isOwner) missing.push(offer);
        else plan.errors.push({ external_id: offer.external_id, message: "в общей карточке нет такого варианта" });
        continue;
      }
      plan.offers.push(toOffer(offer, { variant_id: variant.id }));
      const retail = offerPrices(offer, input.settings, input.price_types).retail;
      if (isOwner && retail !== null && retail !== variant.price && !prices.has(variant.id)) prices.set(variant.id, retail);
    }
    if (missing.length) plan.deferred.push({ product_id: productId, external_id: externalId, offers: missing });
  }

  plan.prices = [...prices].map(([variant_id, amount]) => ({ variant_id, amount }));
  return plan;
}

function groupByProduct(offers: CMLOffer[]): Map<string, CMLOffer[]> {
  const groups = new Map<string, CMLOffer[]>();
  for (const offer of offers) groups.set(offer.product_external_id, [...(groups.get(offer.product_external_id) ?? []), offer]);
  return groups;
}

/** Slug названия, свободный среди `taken` (занятые в БД и уже выданные в этой пачке); выданный добавляется в `taken`. */
export function uniqueHandle(title: string, taken: Set<string>): string {
  const base = toSlug(title) || "product";
  for (let index = 1; ; index++) {
    const suffix = index === 1 ? "" : `-${index}`;
    const candidate = base.slice(0, SLUG_MAX_LENGTH - suffix.length).replace(/-+$/, "") + suffix;
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }
}
