// ВРЕМЕННО: превью виджета без бэкенда. Удалить после проверки.
import { CollectionBanners, lookbookBannersMock } from "@widgets/collection-banners";
import { ProductShelf } from "@widgets/product-shelf";
import { SocialFeed } from "@widgets/social-feed";
import { TextBlock } from "@widgets/text-block";

export default function Preview() {
  return (
    <>
      <CollectionBanners />
      <ProductShelf />
      <CollectionBanners title={lookbookBannersMock.title} titleHidden items={lookbookBannersMock.items} />
      <TextBlock />
      <SocialFeed />
    </>
  );
}
