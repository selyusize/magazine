/** Сколько карточек изменилось и что не удалось (картинка, значение характеристики). */
export type AppliedExchangeContentDTO = {
  updated: number;
  errors: { external_id: string | null; message: string }[];
};
