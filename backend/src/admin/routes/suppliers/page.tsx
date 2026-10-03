import { defineRouteConfig } from "@medusajs/admin-sdk";
import { BuildingStorefront } from "@medusajs/icons";

import { CRUDPage } from "../../crud/components/crud-page";
import { suppliersResource } from "../../suppliers/resource";

/** Поставщики: откуда приходят товары и остатки, кому уходят заказы. */
const SuppliersPage = () => <CRUDPage resource={suppliersResource} />;

export const config = defineRouteConfig({
  label: "Поставщики",
  icon: BuildingStorefront,
});

export default SuppliersPage;
