import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Funnel } from "@medusajs/icons";

import { CRUDPage } from "../../crud/components/crud-page";
import { filterPagesResource } from "../../filter-pages/resource";

/** Посадочные «категория + фильтры»: страницы /catalog/{категория}/{handle}. */
const FilterPagesPage = () => <CRUDPage resource={filterPagesResource} />;

export const config = defineRouteConfig({
  label: "Посадочные",
  icon: Funnel,
});

export default FilterPagesPage;
