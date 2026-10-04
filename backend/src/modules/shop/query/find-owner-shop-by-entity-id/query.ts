/** Сущность по id и путь к её магазину (`shop_id`, `supplier.shop_id`). */
export type FindOwnerShopByEntityIdQuery = {
  entity: string;
  id: string;
  shop_field: string;
};
