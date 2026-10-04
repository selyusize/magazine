import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { SHOP_MODULE } from "../../../index";
import {
  toNetworkSettingsValues,
  type NetworkSettingsValues,
} from "../../../service/network-settings";
import type { ShopModuleService } from "../../../service/shop-module-service";
import type { UpdateNetworkSettingsCommand } from "../command";
import type { UpdatedNetworkSettingsDTO } from "../dto";

/** Что вернуть при откате: удалить созданную строку или вернуть прежние значения. */
type Previous =
  | { id: string; created: true }
  | { id: string; created: false; values: NetworkSettingsValues };

/** Единственная строка реквизитов: нет — создаёт, есть — меняет переданные поля. */
export const saveNetworkSettingsStep = createStep(
  "save-network-settings",
  async (command: UpdateNetworkSettingsCommand, { container }) => {
    const service = container.resolve<ShopModuleService>(SHOP_MODULE);
    const [current] = await service.listNetworkSettings(
      {},
      { take: 1, order: { created_at: "ASC" } },
    );

    if (!current) {
      const created = await service.createNetworkSettings(command);
      const dto: UpdatedNetworkSettingsDTO = toNetworkSettingsValues(created);
      return new StepResponse<UpdatedNetworkSettingsDTO, Previous>(dto, {
        id: created.id,
        created: true,
      });
    }

    const updated = await service.updateNetworkSettings({
      ...command,
      id: current.id,
    });
    const dto: UpdatedNetworkSettingsDTO = toNetworkSettingsValues(updated);
    return new StepResponse<UpdatedNetworkSettingsDTO, Previous>(dto, {
      id: current.id,
      created: false,
      values: toNetworkSettingsValues(current),
    });
  },
  async (previous, { container }) => {
    if (!previous) return;
    const service = container.resolve<ShopModuleService>(SHOP_MODULE);
    if (previous.created) await service.deleteNetworkSettings(previous.id);
    else
      await service.updateNetworkSettings({
        ...previous.values,
        id: previous.id,
      });
  },
);
