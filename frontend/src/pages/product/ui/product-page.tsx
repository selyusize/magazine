import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@widgets/breadcrumbs";
import { Highlights, highlightsMock } from "@widgets/highlights";
import { Lookbook, lookbookMock } from "@widgets/lookbook";
import { ProductDetails } from "@widgets/product-details";
import { ProductOverview } from "@widgets/product-overview";
import { ProductReviews } from "@widgets/product-reviews";
import { ProductShelf, RecentlyViewedShelf } from "@widgets/product-shelf";
import { getProductByHandle, listRelatedProducts, productHighlights, productJsonLd, productLookbook, type ProductDetail } from "@entities/product";
import { listProductReviews, reviewsJsonLd } from "@entities/review";
import { env, routes, siteConfig, type ProductPageConfig } from "@shared/config";
import { Container } from "@shared/ui/container";
import { JsonLd } from "@shared/ui/json-ld";

import { pageNumberSchema, productParamsSchema, reviewsHref } from "../model/params";
import { minPrice, productSeo } from "../model/seo";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Товар из URL. Неизвестный или снятый с публикации — 404 */
async function loadProduct(params: ProductPageProps["params"]): Promise<ProductDetail> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();
  return product;
}

/**
 * Страница отзывов из адреса (`?reviews=2`). Номер за пределами — последняя страница, а не пустой список:
 * отзывы — часть страницы товара, 404 из-за них не нужен
 */
async function loadReviews(productId: string, config: NonNullable<ProductPageConfig["reviews"]>, param: unknown) {
  const fetchPage = (page: number) => listProductReviews({ productId, limit: config.pageSize, offset: (page - 1) * config.pageSize });
  const requested = pageNumberSchema.parse(param);
  const first = await fetchPage(requested);
  const totalPages = Math.max(1, Math.ceil(first.summary.count / config.pageSize));
  const page = Math.min(requested, totalPages);
  return { ...(page === requested ? first : await fetchPage(page)), page, totalPages };
}

/**
 * Каноническая — страница без `?variant=`: варианты не плодят дубли в индексе.
 * Open Graph — фото и цена для превью ссылки в мессенджерах и соцсетях.
 */
export async function generateProductMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await loadProduct(params);
  const { title, description } = productSeo(product);
  const price = minPrice(product);

  return {
    title,
    description,
    alternates: { canonical: product.href },
    openGraph: {
      type: "website",
      url: product.href,
      title,
      description,
      siteName: siteConfig.name,
      images: product.images.slice(0, 4).map((image) => ({ url: image.src, alt: image.alt })),
    },
    ...(price && {
      other: { "product:price:amount": String(price.amount), "product:price:currency": price.currencyCode.toUpperCase() },
    }),
  };
}

/**
 * Страница товара (Figma: Product detail). Всё — на сервере: название, цена выбранного варианта, фото с alt,
 * характеристики и тексты блоков в HTML; разметка Product/ProductGroup и BreadcrumbList для расширенного сниппета.
 */
export async function ProductPage({ params, searchParams }: ProductPageProps) {
  const [product, query, requestHeaders] = await Promise.all([loadProduct(params), searchParams, headers()]);
  const { variant } = productParamsSchema.parse(query);
  const config = siteConfig.product;
  const { description } = productSeo(product);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  const { highlights, lookbook } = config.content;
  const reviewsConfig = config.reviews;
  const { related, recentlyViewed } = config;
  const [reviews, relatedItems] = await Promise.all([
    reviewsConfig && loadReviews(product.id, reviewsConfig, query[reviewsConfig.pageParam]),
    related ? listRelatedProducts({ product, metadataKey: related.metadataKey, limit: related.limit }) : [],
  ]);
  // ВРЕМЕННО: у товара нет своего контента в metadata — блоки из макета. Убрать вместе с моками виджетов
  const highlightItems = highlights ? productHighlights(product, highlights.metadataKey) : [];
  const lookbookData = lookbook ? (productLookbook(product, lookbook.metadataKey) ?? lookbookMock) : undefined;

  return (
    <>
      <Container className="pt-5">
        <Breadcrumbs
          items={[{ name: siteConfig.catalog.title, href: routes.catalog }, ...product.categories, { name: product.title, href: product.href }]}
        />
      </Container>
      <Container className="pt-6 pb-14 lg:pt-8 lg:pb-16">
        <ProductOverview
          product={product}
          initialVariantId={variant}
          config={config}
          details={<ProductDetails product={product} config={config} />}
        />
      </Container>
      {highlights ? <Highlights title={highlights.title} items={highlightItems.length ? highlightItems : highlightsMock} /> : null}
      {lookbook && lookbookData ? (
        <Lookbook
          {...lookbookData}
          // Без видимого заголовка у секции всё равно есть h2 — для структуры страницы
          hiddenTitle={product.title}
          columns={lookbook.columns}
          aspectRatio={config.gallery.aspectRatio}
        />
      ) : null}
      {reviews && reviewsConfig ? (
        <ProductReviews
          reviews={reviews}
          page={reviews.page}
          totalPages={reviews.totalPages}
          href={(page) => reviewsHref(product.href, reviewsConfig.pageParam, page)}
          config={reviewsConfig}
        />
      ) : null}
      {related ? <ProductShelf title={related.title} items={relatedItems} layout="centered" /> : null}
      {recentlyViewed ? (
        <RecentlyViewedShelf
          handle={product.handle}
          title={recentlyViewed.title}
          limit={recentlyViewed.limit}
          // Черта — только между двумя подборками
          divided={Boolean(related && relatedItems.length)}
        />
      ) : null}
      <JsonLd
        data={{
          ...productJsonLd(product, { siteUrl: env.siteUrl, brand: config.brand ?? siteConfig.name, options: config.options, description }),
          // Звёзды в сниппете: средняя оценка и отзывы, которые видны на странице
          ...(reviews && reviewsJsonLd(reviews.summary, reviews.items)),
        }}
        nonce={nonce}
      />
    </>
  );
}
