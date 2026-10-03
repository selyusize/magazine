/** Поля категории для страницы каталога: сама категория, родитель и подкатегории. */
export const CATEGORY_FIELDS = "id,name,handle,description,rank,*parent_category,*category_children";

/** Поля категорий-ссылок (верхний уровень каталога) */
export const CATEGORY_LINK_FIELDS = "id,name,handle,rank";
