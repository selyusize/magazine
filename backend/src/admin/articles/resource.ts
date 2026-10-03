import type { CRUDResource } from "../crud/types";

/** Статьи блога — /admin/articles. Адрес на витрине: /blog/{handle}. */
export const articlesResource: CRUDResource = {
  path: "/admin/articles",
  response: { one: "article", many: "articles" },
  i18n: "articles",
  title: "title",
  columns: [
    { key: "title" },
    { key: "handle", kind: "mono" },
    { key: "status", kind: "badge" },
  ],
  fields: [
    { name: "title", type: "text", required: true },
    { name: "handle", type: "text", placeholder: "kak-vybrat-krossovki" },
    {
      name: "status",
      type: "select",
      options: ["draft", "published"],
      default: "draft",
    },
    { name: "excerpt", type: "textarea", nullable: true, rows: 3 },
    { name: "body", type: "textarea", nullable: true, rows: 14 },
  ],
  storefrontPath: (row) => `/blog/${row.handle}`,
};
