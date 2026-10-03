/** Сколько вариантов добавлено и какие предложения добавить не удалось. */
export type AddedExchangeVariantsDTO = {
  created: number;
  errors: { external_id: string; message: string }[];
};
