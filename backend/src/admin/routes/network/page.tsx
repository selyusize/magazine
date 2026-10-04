import { defineRouteConfig } from "@medusajs/admin-sdk";
import { BuildingsMini } from "@medusajs/icons";

import { SettingsPage } from "../../crud/components/settings-page";
import { networkSettingsResource } from "../../network/resource";

/** Реквизиты сети: юрлицо, ИНН/ОГРН/КПП, адрес и контакты — общие для всех магазинов. */
const NetworkSettingsPage = () => (
  <SettingsPage resource={networkSettingsResource} />
);

export const config = defineRouteConfig({
  label: "Реквизиты сети",
  icon: BuildingsMini,
});

export default NetworkSettingsPage;
