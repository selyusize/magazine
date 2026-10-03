/**
 * Содержимое карточки, которое пишет импорт и которое можно править в админке. Handle импорт задаёт только при
 * создании (смена адреса — это 301, а не обновление каталога), SEO — этап 6.
 */
export type ProductContent = {
  title: string;
  description: string | null;
  /** URL картинок по порядку; первая — обложка. */
  images: string[];
  category_id: string | null;
  brand_id: string | null;
};

export const CONTENT_FIELDS = ["title", "description", "images", "category_id", "brand_id"] as const satisfies readonly (keyof ProductContent)[];

export type ContentField = (typeof CONTENT_FIELDS)[number];

export type ContentPlan = {
  /** Что записать в карточку. */
  changes: Partial<ProductContent>;
  /** Новый снимок «что импорт записал»: прежний + записанное сейчас. */
  imported: Partial<ProductContent>;
  /** Поля под ручным управлением — импорт их не трогает. */
  manual_fields: ContentField[];
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Трёхстороннее сравнение: выгрузка (`next`), карточка сейчас (`current`), что импорт записал в прошлый раз
 * (`imported`).
 *
 * - поле в `manual_fields` — не трогаем;
 * - карточка отличается от снимка — поле правили в админке: переводим под ручное управление и не трогаем;
 * - иначе пишем значение из выгрузки, если оно отличается от карточки.
 *
 * Поле без снимка (карточку создали до этой логики или склеили) считается импортным: первая запись его задаёт.
 * Пустое значение из выгрузки (нет описания, нет картинок) заполненное поле не затирает.
 */
export function planContent(input: {
  next: ProductContent;
  current: ProductContent;
  imported: Partial<ProductContent>;
  manual_fields: ContentField[];
}): ContentPlan {
  const manual = new Set(input.manual_fields);
  const changes: Partial<ProductContent> = {};
  const imported: Partial<ProductContent> = { ...input.imported };

  for (const field of CONTENT_FIELDS) {
    if (manual.has(field)) continue;
    if (field in input.imported && !same(input.current[field], input.imported[field])) {
      manual.add(field);
      continue;
    }
    const next = input.next[field];
    if (isEmpty(next) && !isEmpty(input.current[field])) continue;
    if (!same(next, input.current[field])) Object.assign(changes, { [field]: next });
    Object.assign(imported, { [field]: next });
  }

  return {
    changes,
    imported,
    manual_fields: CONTENT_FIELDS.filter((field) => manual.has(field)),
  };
}

const isEmpty = (value: unknown) => value === null || value === "" || (Array.isArray(value) && value.length === 0);
