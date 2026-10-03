import type { SocialNetwork, SocialPost } from "./types";

const profile = "https://instagram.com/";

/** Мок до подключения ленты (API соцсети или ручной список в CMS). */
export const socialFeedMock = {
  title: "Мы в Instagram",
  network: { label: "Instagram", icon: "instagram" } satisfies SocialNetwork,
  items: [
    {
      id: "post-1",
      href: profile,
      image: { src: "/images/social/post-1.png", alt: "Девушка в белом костюме отражается в круглом зеркале на фоне неба" },
    },
    {
      id: "post-2",
      href: profile,
      image: { src: "/images/social/post-2.png", alt: "Солнцезащитные очки и шёлковая блуза цвета шампань" },
    },
    {
      id: "post-3",
      href: profile,
      image: { src: "/images/social/post-3.jpg", alt: "Девушка в белом сарафане на пуговицах у витрины" },
    },
    {
      id: "post-4",
      href: profile,
      image: { src: "/images/social/post-4.png", alt: "Девушка в серых брюках и топе у кирпичной стены" },
    },
    {
      id: "post-5",
      href: profile,
      image: { src: "/images/social/post-5.png", alt: "Девушка в голубой рубашке поверх белой футболки" },
    },
  ] satisfies SocialPost[],
};
