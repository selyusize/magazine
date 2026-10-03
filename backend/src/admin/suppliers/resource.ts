import type { CRUDResource } from "../crud/types";

/** Поставщики — /admin/suppliers. Страницы на витрине нет; склад поставщика создаётся сам. */
export const suppliersResource: CRUDResource = {
  path: "/admin/suppliers",
  response: { one: "supplier", many: "suppliers" },
  i18n: "suppliers",
  title: "name",
  columns: [
    { key: "name" },
    { key: "ship_city" },
    { key: "assembly_days" },
    { key: "is_active", kind: "boolean" },
  ],
  fields: [
    { name: "name", type: "text", required: true },
    { name: "is_active", type: "boolean", default: true },
    { name: "ship_city", type: "text", required: true, placeholder: "Москва" },
    { name: "ship_address", type: "text", nullable: true },
    { name: "assembly_days", type: "number", default: 1, min: 0 },
    { name: "contact_name", type: "text", nullable: true },
    { name: "phone", type: "text", nullable: true },
    { name: "email", type: "text", nullable: true },
    { name: "order_email", type: "text", nullable: true },
    { name: "order_api_url", type: "text", nullable: true },
    { name: "exchange", type: "json" },
    { name: "markup", type: "json" },
  ],
};
