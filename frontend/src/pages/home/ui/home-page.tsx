import { connection } from "next/server";

import { CollectionBanners, lookbookBannersMock } from "@widgets/collection-banners";
import { HeroSlider } from "@widgets/hero-slider";
import { ProductShelf } from "@widgets/product-shelf";
import { SocialFeed } from "@widgets/social-feed";
import { TextBlock } from "@widgets/text-block";
import { getProducts } from "@shared/api";

export async function HomePage() {
  // Рендер на каждый запрос: при сборке образа бэкенд недоступен.
  // Позже заменим на "use cache" + cacheTag вместе с включением cacheComponents.
  await connection();

  return (
    <>
      <HeroSlider autoplay={4000} />
      <CollectionBanners />
      <ProductShelf />
      <CollectionBanners title={lookbookBannersMock.title} titleHidden items={lookbookBannersMock.items} />
      <TextBlock />
      <SocialFeed />
    </>
  );
}
