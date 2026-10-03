import { MedusaError } from "@medusajs/framework/utils";

/** Без чего товар не публикуется: пустая или неполная карточка вредит SEO и не продаётся. */
export const PUBLISH_REQUIREMENTS = [
  "title",
  "handle",
  "main_category",
  "image",
  "price",
  "offer",
] as const;

export type PublishRequirement = (typeof PUBLISH_REQUIREMENTS)[number];

const LABELS: Record<PublishRequirement, string> = {
  title: "название",
  handle: "адрес (handle)",
  main_category: "основная категория",
  image: "изображение",
  price: "цена",
  offer: "предложение поставщика",
};

/** Что есть у товара — собирает фетчер `find-publish-problems-by-product-ids`. */
export type PublishCandidate = {
  title: string | null;
  handle: string | null;
  has_main_category: boolean;
  has_image: boolean;
  has_price: boolean;
  has_offer: boolean;
};

/** Каких обязательных полей не хватает для публикации. */
export function findMissingRequirements(
  candidate: PublishCandidate,
): PublishRequirement[] {
  const present: Record<PublishRequirement, boolean> = {
    title: !!candidate.title?.trim(),
    handle: !!candidate.handle?.trim(),
    main_category: candidate.has_main_category,
    image: candidate.has_image,
    price: candidate.has_price,
    offer: candidate.has_offer,
  };
  return PUBLISH_REQUIREMENTS.filter((requirement) => !present[requirement]);
}

/** Ошибка публикации с перечнем товаров и недостающего — 400 в админке. */
export function publishError(
  problems: readonly {
    title: string;
    missing: readonly PublishRequirement[];
  }[],
): MedusaError {
  const lines = problems.map(
    (problem) =>
      `«${problem.title}» — нет: ${problem.missing.map((m) => LABELS[m]).join(", ")}`,
  );
  return new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `Товар нельзя опубликовать: ${lines.join("; ")}. Сохраните его черновиком и заполните недостающее.`,
  );
}
