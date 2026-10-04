/** Сущность Medusa без канала продаж (категория, коллекция) по id — в магазине со slug `shop_slug`. */
export type FindShopEntityByIdQuery = {
  entity: string;
  id: string;
  shop_slug: string;
};
