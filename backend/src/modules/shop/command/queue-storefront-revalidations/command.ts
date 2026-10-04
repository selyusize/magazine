/** Теги витрин по магазинам: из события изменения (реестр инвалидации) или «обновить витрину» из админки. */
export type QueueStorefrontRevalidationsCommand = {
  batches: { shop_id: string; tags: string[] }[];
};
