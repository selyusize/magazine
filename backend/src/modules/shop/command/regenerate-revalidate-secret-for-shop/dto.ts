/** Новый секрет — показывается один раз в ответе и потом по запросу админки. */
export type RegeneratedRevalidateSecretDTO = {
  revalidate_url: string;
  revalidate_secret: string;
};
