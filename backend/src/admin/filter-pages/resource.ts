import type { CRUDResource } from "../crud/types";

/** Посадочные «категория + фильтры» — /admin/filter-pages. Адрес на витрине: /catalog/{категория}/{handle}. */
export const filterPagesResource: CRUDResource = {
  path: "/admin/filter-pages",
  response: { one: "filter_page", many: "filter_pages" },
  i18n: "filterPages",
  title: "title",
  columns: [
    { key: "title" },
    { key: "category.name" },
    { key: "handle", kind: "mono" },
    { key: "is_active", kind: "boolean" },
  ],
  fields: [
    { name: "category_id", type: "category", required: true },
    { name: "title", type: "text", required: true },
    { name: "handle", type: "text", placeholder: "nike" },
    { name: "filters", type: "json" },
    { name: "is_active", type: "boolean", default: true },
  ],
  storefrontPath: (row) => {
    const category = row.category as { handle: string } | null;
    return category ? `/catalog/${category.handle}/${row.handle}` : null;
  },
};
