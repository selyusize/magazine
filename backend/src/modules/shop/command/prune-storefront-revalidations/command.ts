/** Запуск job: «сейчас» — ISO-строкой, от него считается срок хранения журнала. */
export type PruneStorefrontRevalidationsCommand = {
  now: string;
};
