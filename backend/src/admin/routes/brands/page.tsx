import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";

import { CRUDPage } from "../../crud/components/crud-page";
import { brandsResource } from "../../brands/resource";

/** Бренды: страницы /brands/{handle}, фильтр каталога. */
const BrandsPage = () => <CRUDPage resource={brandsResource} />;

export const config = defineRouteConfig({
  label: "Бренды",
  icon: Buildings,
});

export default BrandsPage;
