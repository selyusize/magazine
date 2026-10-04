/** Запуск job: «сейчас» — ISO-строкой, от него считаются просроченные пачки. */
export type RequeueStaleStorefrontRevalidationsCommand = {
  now: string;
};
