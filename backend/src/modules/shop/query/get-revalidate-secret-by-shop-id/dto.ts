/** Что нужно фронту магазина для вебхука: адрес и секрет (`REVALIDATE_SECRET`, в Ansible — vault). */
export type RevalidateSecretDTO = {
  revalidate_url: string;
  /** `null` — запись не расшифровывается (сменился `SHOP_SECRETS_KEY`): секрет нужно перевыпустить. */
  revalidate_secret: string | null;
};
