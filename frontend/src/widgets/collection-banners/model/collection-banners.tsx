import type { ReactNode } from "react";

import { CollectionBannersView, type CollectionBannersColumns } from "../ui/collection-banners-view";
import { collectionBannersMock } from "./banners.mock";
import type { CollectionBanner } from "./types";

export type CollectionBannersProps = {
  items?: CollectionBanner[];
  /** Заголовок секции. `null` — без заголовка */
  title?: ReactNode;
  /** Заголовок есть в HTML (h2 для SEO), но не виден — для секций без подписи в макете */
  titleHidden?: boolean;
  /** Колонок на десктопе. По умолчанию — по числу карточек (2–4) */
  columns?: CollectionBannersColumns;
};

/**
 * Связка: данные (пока мок) + «тупое» представление из ui.
 *
 * @example Две большие карточки без заголовка (вторая секция макета)
 * <CollectionBanners title="Образы сезона" titleHidden items={[smartChic, readyToGo]} />
 */
export function CollectionBanners({
  items = collectionBannersMock.items,
  title = collectionBannersMock.title,
  titleHidden,
  columns = Math.min(Math.max(items.length, 2), 4) as CollectionBannersColumns,
}: CollectionBannersProps) {
  if (items.length === 0) return null;
  return <CollectionBannersView items={items} title={title} titleHidden={titleHidden} columns={columns} />;
}
