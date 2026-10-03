import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Adjustments } from "@medusajs/icons";

import { CRUDPage } from "../../crud/components/crud-page";
import { attributesResource } from "../../attributes/resource";

/** Характеристики товаров: таблица на карточке и фильтры каталога. */
const AttributesPage = () => <CRUDPage resource={attributesResource} />;

export const config = defineRouteConfig({
  label: "Характеристики",
  icon: Adjustments,
});

export default AttributesPage;
