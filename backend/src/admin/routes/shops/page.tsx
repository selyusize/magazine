import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";

import { CRUDPage } from "../../crud/components/crud-page";
import { shopsResource } from "../../shops/resource";

/** Магазины сети: у каждого свой фронт, домен, канал продаж и publishable-ключ. */
const ShopsPage = () => <CRUDPage resource={shopsResource} />;

export const config = defineRouteConfig({
  label: "Магазины",
  icon: Buildings,
});

export default ShopsPage;
