/** Поля товара для карточки в списках: без описаний, опций и прочего — ответ Medusa в разы меньше. */
export const PRODUCT_CARD_FIELDS = "id,title,handle,thumbnail,*images";

/** Цены вариантов: Medusa считает их только при переданном region_id. */
export const PRODUCT_PRICE_FIELDS = "*variants.calculated_price";

/**
 * Поля страницы товара: опции со значениями, варианты с остатками и фото, категории с родителем для крошек.
 * Цены вариантов — PRODUCT_PRICE_FIELDS (при переданном region_id).
 */
export const PRODUCT_DETAIL_FIELDS = [
  "id",
  "title",
  "subtitle",
  "handle",
  "description",
  "thumbnail",
  "material",
  "origin_country",
  "weight",
  "length",
  "width",
  "height",
  "+metadata",
  "*images",
  "*options",
  "*options.values",
  "*variants",
  "*variants.options",
  "*variants.images",
  "+variants.inventory_quantity",
  "*categories",
  "*categories.parent_category",
  "*collection",
  "*type",
].join(",");
