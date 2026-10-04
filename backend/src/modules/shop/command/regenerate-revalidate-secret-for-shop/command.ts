/** Новый случайный секрет вебхука ревалидации магазина (утёк или сменился ключ шифрования). */
export type RegenerateRevalidateSecretForShopCommand = {
  shop_id: string;
};
