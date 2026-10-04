import type { SettingsResource } from "../crud/types";

/** Реквизиты сети — одно юрлицо на все магазины: подвал витрин, Organization, оферта, чеки. */
export const networkSettingsResource: SettingsResource = {
  path: "/admin/network-settings",
  response: "network_settings",
  i18n: "networkSettings",
  fields: [
    { name: "name", type: "text", nullable: true, placeholder: "Snowaa" },
    {
      name: "legal_name",
      type: "text",
      nullable: true,
      placeholder: "ООО «Сноуа»",
    },
    { name: "inn", type: "text", nullable: true },
    { name: "ogrn", type: "text", nullable: true },
    { name: "kpp", type: "text", nullable: true },
    { name: "legal_address", type: "textarea", nullable: true, rows: 2 },
    {
      name: "phone",
      type: "text",
      nullable: true,
      placeholder: "+78000000000",
    },
    { name: "email", type: "text", nullable: true },
  ],
};
