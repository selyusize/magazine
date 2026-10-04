"use server";

import { cacheTags, getProducts, getRegions, postSearch } from "@shared/api";
import { env } from "@shared/config";

import { PRODUCT_CARD_FIELDS, PRODUCT_DETAIL_FIELDS, PRODUCT_PRICE_FIELDS } from "../config/fields";
import { fromStoreProduct } from "../model/from-store-product";
import { productRelatedHandles } from "../model/content";
import { fromStoreProductDetail } from "../model/from-store-product-detail";
import { toProductFacets, toSearchOrder, type ProductFacets, type SearchFacetRequest } from "../model/search";
import type { ProductCardData, ProductDetail } from "../model/types";

export type ProductListParams = {
  /** Полнотекстовый поиск Medusa по названию, описанию, артикулу */
  q?: string;
  /** Товары по handle — в том же порядке, что в массиве */
  handle?: string[];
  limit: number;
  offset?: number;
  /** Несколько id — товары из любой из категорий (категория вместе с подкатегориями) */
  categoryId?: string | string[];
  collectionId?: string;
  /** Сортировка Medusa: `-created_at`, `title`. Минус — по убыванию */
  order?: string;
};

export type ProductList = { items: ProductCardData[]; count: number };

type PriceRegion = { id: string; currencyCode: string };

/** Регион для цен: из MEDUSA_REGION_ID или первый регион магазина (кеш на час). */
async function getRegion(): Promise<PriceRegion | undefined> {
  const { regions } = await getRegions(
    { id: env.regionId || undefined, fields: "id,currency_code", limit: 1 },
    { next: { revalidate: 3600, tags: [cacheTags.regions] } },
  );
  return regions[0];
}

async function getRegionId(): Promise<string | undefined> {
  return env.regionId || (await getRegion())?.id;
}

/** Валюта цен витрины: `rub`. Нужна, чтобы выбрать ценовые поля поискового индекса */
export async function getStoreCurrency(): Promise<string | undefined> {
  return (await getRegion())?.currencyCode;
}

/**
 * Список товаров для карточек: каталог, подборки, поиск. Работает на сервере (RSC) и как Server Action с клиента.
 * Поиск по `q` — встроенный в Medusa (по базе). Подключите поисковый движок (Meilisearch, Algolia) —
 * поменяйте только эту функцию: страница поиска и панель под хедером получают тот же ProductList.
 */
export async function listProducts({ q, handle, limit, offset = 0, categoryId, collectionId, order }: ProductListParams): Promise<ProductList> {
  const regionId = await getRegionId();
  const { products, count } = await getProducts(
    {
      q: q || undefined,
      handle: handle?.length ? handle : undefined,
      limit,
      offset,
      categoryId,
      collectionId: collectionId ? [collectionId] : undefined,
      order: order || undefined,
      regionId,
      fields: regionId ? `${PRODUCT_CARD_FIELDS},${PRODUCT_PRICE_FIELDS}` : PRODUCT_CARD_FIELDS,
    },
    { next: { revalidate: 60, tags: [cacheTags.products] } },
  );

  // Medusa отдаёт товары в своём порядке, а подборка по handle — в заданном
  const ordered = handle?.length ? [...products].sort((a, b) => handle.indexOf(a.handle) - handle.indexOf(b.handle)) : products;
  return { items: ordered.map(fromStoreProduct), count };
}

export type ProductSearchParams = {
  /** Условия по полям индекса, через «И»: `{ option_values: { $in: ["Size:S"] } }` */
  filters?: Record<string, unknown>[];
  /** Сортировка из конфига: `-created_at`, `title` */
  order?: string;
  /** Какие фасеты посчитать: `"option_values"`, `{ field: "min_price_rub", type: "stats" }` */
  facets?: SearchFacetRequest[];
  limit: number;
  offset?: number;
};

export type ProductSearchResult = ProductList & { facets: ProductFacets };

/**
 * Выдача с фильтрами через поисковый индекс Medusa (/store/search): условия, сортировка и счётчики значений для
 * фильтров одним запросом. Индекс отдаёт id, карточки с ценами региона — тем же запросом, что listProducts.
 * Фасет считается без условия на своё же поле: выбрав «S», видно и остальные размеры.
 */
export async function searchProducts({ filters = [], order, facets, limit, offset = 0 }: ProductSearchParams): Promise<ProductSearchResult> {
  const { results } = await postSearch(
    {
      queries: [
        {
          entity: "product",
          fields: ["id"],
          filters: filters.length ? { $and: filters } : undefined,
          pagination: { take: limit, skip: offset, order: toSearchOrder(order) },
          searchOptions: { facets, disjunctiveFacets: true, count: "exact" },
        },
      ],
    },
    undefined,
    { next: { revalidate: 60, tags: [cacheTags.products] } },
  );
  const result = results[0];
  const ids = result?.hits.map((hit) => hit.id) ?? [];
  const count = result?.metadata.count ?? 0;

  const regionId = ids.length ? await getRegionId() : undefined;
  const { products } = ids.length
    ? await getProducts(
        {
          id: ids,
          limit: ids.length,
          regionId,
          fields: regionId ? `${PRODUCT_CARD_FIELDS},${PRODUCT_PRICE_FIELDS}` : PRODUCT_CARD_FIELDS,
        },
        { next: { revalidate: 60, tags: [cacheTags.products] } },
      )
    : { products: [] };
  // Store API не держит порядок id — возвращаем порядок индекса
  const byId = new Map(products.map((product) => [product.id, fromStoreProduct(product)]));

  return {
    items: ids.flatMap((id) => byId.get(id) ?? []),
    count,
    facets: toProductFacets(result?.facets),
  };
}

/**
 * Товар для его страницы по handle из URL (/products/[handle]): опции, варианты с ценами региона и остатками,
 * категории для крошек. Нет такого (или не опубликован) — null: страница отдаёт 404.
 * generateMetadata и страница вызывают её с одинаковыми аргументами — Next делает один запрос.
 */
export async function getProductByHandle(handle: string): Promise<ProductDetail | null> {
  const regionId = await getRegionId();
  const { products } = await getProducts(
    {
      handle,
      limit: 1,
      regionId,
      fields: regionId ? `${PRODUCT_DETAIL_FIELDS},${PRODUCT_PRICE_FIELDS}` : PRODUCT_DETAIL_FIELDS,
    },
    { next: { revalidate: 60, tags: [cacheTags.products, cacheTags.product(handle)] } },
  );
  return products[0] ? fromStoreProductDetail(products[0]) : null;
}

export type RelatedProductsParams = {
  product: Pick<ProductDetail, "id" | "categoryIds" | "metadata">;
  /** Ключ metadata со списком handle: `["ponte-pant", "hoop-earrings"]` или `"ponte-pant, hoop-earrings"` */
  metadataKey: string;
  limit: number;
};

/**
 * «Носите с»: товары, которые выбрал менеджер в metadata товара. Не выбрал — товары из тех же категорий.
 * Сам товар в подборку не попадает.
 */
export async function listRelatedProducts({ product, metadataKey, limit }: RelatedProductsParams): Promise<ProductCardData[]> {
  const handles = productRelatedHandles(product, metadataKey);
  const { items } = handles.length
    ? await listProducts({ handle: handles, limit })
    : product.categoryIds.length
      ? await listProducts({ categoryId: product.categoryIds, limit: limit + 1 })
      : { items: [] };
  return items.filter((item) => item.id !== product.id).slice(0, limit);
}
