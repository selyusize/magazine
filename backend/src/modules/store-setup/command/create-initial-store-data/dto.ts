export type InitialStoreDataDTO = {
  store_id: string;
  region_id: string;
  sales_channel_id: string;
  /** Токен publishable-ключа — его витрина передаёт в заголовке `x-publishable-api-key`. */
  publishable_api_key: string;
  stock_location_id: string;
  shipping_option_ids: string[];
};
