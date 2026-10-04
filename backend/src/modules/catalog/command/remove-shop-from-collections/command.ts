/** Связи «коллекция → магазин», которые нужно снять: откат хука `collectionsCreated`. */
export type RemoveShopFromCollectionsCommand = {
  links: { collection_id: string; shop_id: string }[];
};
