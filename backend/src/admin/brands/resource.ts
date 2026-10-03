import type { CRUDResource } from "../crud/types";

/** Бренды — /admin/brands. Адрес на витрине: /brands/{handle}. */
export const brandsResource: CRUDResource = {
  path: "/admin/brands",
  response: { one: "brand", many: "brands" },
  i18n: "brands",
  title: "name",
  columns: [
    { key: "name" },
    { key: "handle", kind: "mono" },
    { key: "is_active", kind: "boolean" },
  ],
  fields: [
    { name: "name", type: "text", required: true },
    { name: "handle", type: "text", placeholder: "nike" },
    { name: "description", type: "textarea", nullable: true },
    { name: "is_active", type: "boolean", default: true },
  ],
  storefrontPath: (row) => `/brands/${row.handle}`,
};
