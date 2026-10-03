"use client";

import { useQuery } from "@tanstack/react-query";

import { listProducts, toCardProps, useRecentlyViewed } from "@entities/product";
import { ProductShelfView } from "../ui/product-shelf-view";

export type RecentlyViewedShelfProps = {
  /** Открытый товар: запоминается и не показывается в подборке */
  handle: string;
  title: string;
  limit: number;
  divided?: boolean;
  className?: string;
};

/**
 * «Вы недавно смотрели»: handle из браузера → свежие карточки (цены, фото) с сервера.
 * Пока список не загружен или пуст — блока нет: он личный, поисковикам не нужен, скелетон под футером ни к чему.
 */
export function RecentlyViewedShelf({ handle, title, limit, divided, className }: RecentlyViewedShelfProps) {
  // С запасом: часть товаров могла уйти с витрины
  const handles = useRecentlyViewed(handle)?.slice(0, limit * 2) ?? [];
  const { data } = useQuery({
    queryKey: ["recently-viewed", handles],
    queryFn: () => listProducts({ handle: handles, limit: handles.length }),
    enabled: handles.length > 0,
    staleTime: 60_000,
  });
  const items = data?.items.slice(0, limit) ?? [];

  if (!items.length) return null;

  return <ProductShelfView items={items.map(toCardProps)} title={title} layout="centered" divided={divided} className={className} />;
}
