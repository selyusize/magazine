import type { ReactNode } from "react";

import { SocialFeedView } from "../ui/social-feed-view";
import { socialFeedMock } from "./social-feed.mock";
import type { SocialNetwork, SocialPost } from "./types";

export type SocialFeedProps = {
  items?: SocialPost[];
  /** Заголовок секции. `null` — без заголовка */
  title?: ReactNode;
  network?: SocialNetwork;
};

/**
 * Связка: публикации (пока мок) + «тупое» представление из ui.
 * На десктопе все фото в ряд (до 6), на мобильных — первые три.
 *
 * @example Лента Telegram-канала (иконку telegram сначала добавить в shared/config/icons)
 * <SocialFeed title="Наш Telegram" network={{ label: "Telegram", icon: "telegram" }} items={posts} />
 */
export function SocialFeed({
  items = socialFeedMock.items,
  title = socialFeedMock.title,
  network = socialFeedMock.network,
}: SocialFeedProps) {
  const posts = items.slice(0, 6);
  if (posts.length === 0) return null;
  return <SocialFeedView items={posts} title={title} network={network} />;
}
