import { defineRouteConfig } from "@medusajs/admin-sdk";
import { DocumentText } from "@medusajs/icons";

import { CRUDPage } from "../../crud/components/crud-page";
import { articlesResource } from "../../articles/resource";

/** Статьи блога: страницы /blog/{handle}. */
const ArticlesPage = () => <CRUDPage resource={articlesResource} />;

export const config = defineRouteConfig({
  label: "Статьи",
  icon: DocumentText,
});

export default ArticlesPage;
