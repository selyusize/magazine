import type { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  associateLocationsWithSalesChannelsStep,
  createProductCategoriesWorkflow,
  createRemoteLinkStep,
  createSalesChannelsWorkflow,
  emitEventStep,
  linkSalesChannelsToApiKeyWorkflow,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";

import { toCRUDRow } from "@shared/crud/definition";
import { records } from "@shared/query/narrow";
import { toStoredHandle } from "@shared/shop/shop-slug";

import { SHOP_MODULE } from "../../index";
import { SHOP_FIELDS, toShopDTO } from "../../crud";
import type { CreateShopCommand } from "./command";
import type { CreatedShopDTO } from "./dto";
import { createPublishableAPIKeyStep } from "./step/create-publishable-api-key";
import { insertShopStep } from "./step/insert-shop";
import { validateNewShopStep } from "./step/validate-new-shop";

/** Две одновременные формы с одним slug иначе обе прошли бы проверку. */
const LOCK_KEY = "create-shop";

/** Handle корня дерева магазина — с префиксом, как у всех категорий магазина. */
const ROOT_CATEGORY_HANDLE = "catalog";

/**
 * Магазин сети за один сценарий: канал продаж → publishable-ключ этого канала → корневая категория → запись
 * магазина и связи с каналом и ключом → канал видит склады с доставкой (иначе в корзине нет способов доставки).
 * Регион «Россия» в Medusa не привязан к каналу — он общий для всех магазинов. У каждого шага свой откат: падение
 * на любом убирает уже созданное.
 */
export const createShopWorkflow = createWorkflow(
  "create-shop",
  (command: CreateShopCommand) => {
    acquireLockStep({ key: LOCK_KEY, timeout: 30, ttl: 120 });
    validateNewShopStep(command);

    const salesChannels = createSalesChannelsWorkflow.runAsStep({
      input: transform({ command }, ({ command }) => ({
        salesChannelsData: [
          {
            name: command.name,
            description: `Магазин ${command.slug} (${command.domain})`,
          },
        ],
      })),
    });

    // По названию «Витрина <slug>» `make dev-install` находит ключ olisa для frontend/.env.local
    const apiKey = createPublishableAPIKeyStep(
      transform({ command }, ({ command }) => ({
        title: `Витрина ${command.slug}`,
      })),
    );

    linkSalesChannelsToApiKeyWorkflow.runAsStep({
      input: transform(
        { salesChannels, apiKey },
        ({ salesChannels, apiKey }) => ({
          id: apiKey.id,
          add: [salesChannels[0].id],
        }),
      ),
    });

    const categories = createProductCategoriesWorkflow.runAsStep({
      input: transform({ command }, ({ command }) => ({
        product_categories: [
          {
            name: command.name,
            handle: toStoredHandle({
              shop: command.slug,
              handle: ROOT_CATEGORY_HANDLE,
            }),
            is_active: true,
            is_internal: false,
          },
        ],
      })),
    });

    const shop = insertShopStep(
      transform({ command, categories }, ({ command, categories }) => ({
        ...command,
        root_category_id: categories[0].id,
      })),
    );

    createRemoteLinkStep(
      transform(
        { shop, salesChannels, apiKey },
        ({ shop, salesChannels, apiKey }): LinkDefinition[] => [
          {
            [SHOP_MODULE]: { shop_id: shop.id },
            [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannels[0].id },
          },
          {
            [SHOP_MODULE]: { shop_id: shop.id },
            [Modules.API_KEY]: { api_key_id: apiKey.id },
          },
        ],
      ),
    );

    // Склады с наборами доставки (сид: «Отгрузка»). Склады поставщиков без доставки — их канал задаёт поставщик.
    const { data: locations } = useQueryGraphStep({
      entity: "stock_location",
      fields: ["id", "fulfillment_sets.id"],
    }).config({ name: "find-shipping-stock-locations" });

    associateLocationsWithSalesChannelsStep(
      transform(
        { locations, salesChannels },
        ({ locations, salesChannels }) => ({
          links: records(locations)
            .filter((location) => records(location.fulfillment_sets).length > 0)
            .map((location) => ({
              sales_channel_id: salesChannels[0].id,
              location_id: String(location.id),
            })),
        }),
      ),
    );

    emitEventStep({
      eventName: "shop.created",
      data: transform(shop, (shop) => ({ id: shop.id })),
    });
    releaseLockStep({ key: LOCK_KEY });

    const { data: saved } = useQueryGraphStep({
      entity: "shop",
      fields: SHOP_FIELDS,
      filters: transform(shop, (shop) => ({ id: shop.id })),
    }).config({ name: "read-created-shop" });

    return new WorkflowResponse(
      transform(saved, (saved): CreatedShopDTO =>
        toShopDTO(toCRUDRow(saved[0])),
      ),
    );
  },
);
