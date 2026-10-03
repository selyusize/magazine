import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { define } from "@shared/container";
import { CDEKClient, type CDEKOptions } from "@shared/service/cdek/cdek-client";
import type { ParcelDefaults } from "@shared/service/delivery/parcel";
import {
  YandexDeliveryClient,
  type YandexDeliveryOptions,
} from "@shared/service/yandex-delivery/yandex-delivery-client";

/** У товаров поставщиков вес и габариты часто пустые — считаем по средней посылке. */
export const parcelDefaults: ParcelDefaults = {
  item_weight: Number(process.env.DELIVERY_ITEM_WEIGHT || 500),
  box_side: Number(process.env.DELIVERY_BOX_SIDE || 20),
};

/** Локально — тестовый контур СДЭК (ключи из документации, .env.template), на проде — ключи договора. */
export const cdekConfig: CDEKOptions = {
  base_url: process.env.CDEK_BASE_URL ?? "",
  client_id: process.env.CDEK_CLIENT_ID ?? "",
  client_secret: process.env.CDEK_CLIENT_SECRET ?? "",
};

/** Тарифы СДЭК: поставщик сдаёт посылку в пункт СДЭК (склад), покупатель забирает в ПВЗ или ждёт курьера. */
export const cdekTariffs = {
  pickup: Number(process.env.CDEK_TARIFF_PICKUP || 136),
  door: Number(process.env.CDEK_TARIFF_DOOR || 137),
};

export const yandexDeliveryConfig: YandexDeliveryOptions = {
  base_url: process.env.YANDEX_DELIVERY_BASE_URL ?? "",
  token: process.env.YANDEX_DELIVERY_TOKEN ?? "",
};

/** Провайдер подключается, только когда для него заданы ключи (medusa-config.ts, сид). */
export const deliveryProviders = {
  cdek: Boolean(
    cdekConfig.base_url && cdekConfig.client_id && cdekConfig.client_secret,
  ),
  yandex_delivery: Boolean(
    yandexDeliveryConfig.base_url && yandexDeliveryConfig.token,
  ),
};

export default [
  define(
    CDEKClient,
    ({ container }) =>
      new CDEKClient(
        cdekConfig,
        container.resolve(ContainerRegistrationKeys.LOGGER),
      ),
  ),
  define(
    YandexDeliveryClient,
    ({ container }) =>
      new YandexDeliveryClient(
        yandexDeliveryConfig,
        container.resolve(ContainerRegistrationKeys.LOGGER),
      ),
  ),
];
