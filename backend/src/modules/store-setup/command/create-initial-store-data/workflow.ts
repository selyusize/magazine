import { Modules } from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createFulfillmentSets,
  createRegionsWorkflow,
  createRemoteLinkStep,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import type { CreateInitialStoreDataCommand } from "./command";
import type { InitialStoreDataDTO } from "./dto";

/**
 * Только готовые workflows и шаги Medusa: у каждого свой откат, поэтому падение на любом шаге
 * откатывает уже созданное. Доставка: склад отгрузки → набор «доставка» с зоной на всю страну →
 * способы доставки с тарифом от перевозчика (price_type `calculated`).
 */
export const createInitialStoreDataWorkflow = createWorkflow(
  "create-initial-store-data",
  (command: CreateInitialStoreDataCommand) => {
    const salesChannels = createSalesChannelsWorkflow.runAsStep({
      input: transform({ command }, ({ command }) => ({
        salesChannelsData: [{ name: command.sales_channel_name }],
      })),
    });

    const apiKeys = createApiKeysWorkflow.runAsStep({
      input: transform({ command }, ({ command }) => ({
        api_keys: [
          {
            title: command.publishable_api_key_title,
            type: "publishable" as const,
            created_by: "",
          },
        ],
      })),
    });

    linkSalesChannelsToApiKeyWorkflow.runAsStep({
      input: transform(
        { salesChannels, apiKeys },
        ({ salesChannels, apiKeys }) => ({
          id: apiKeys[0].id,
          add: [salesChannels[0].id],
        }),
      ),
    });

    const stores = createStoresWorkflow.runAsStep({
      input: transform(
        { command, salesChannels },
        ({ command, salesChannels }) => ({
          stores: [
            {
              name: command.store_name,
              supported_currencies: [
                {
                  currency_code: command.currency_code,
                  is_default: true,
                  is_tax_inclusive: command.is_tax_inclusive,
                },
              ],
              default_sales_channel_id: salesChannels[0].id,
            },
          ],
        }),
      ),
    });

    const regions = createRegionsWorkflow.runAsStep({
      input: transform({ command }, ({ command }) => ({
        regions: [
          {
            name: command.region_name,
            currency_code: command.currency_code,
            countries: [command.country_code],
            is_tax_inclusive: command.is_tax_inclusive,
            payment_providers: ["pp_system_default"],
          },
        ],
      })),
    });

    createTaxRegionsWorkflow.runAsStep({
      input: transform({ command }, ({ command }) => [
        {
          country_code: command.country_code,
          provider_id: "tp_system",
          default_tax_rate: command.tax_rate,
        },
      ]),
    });

    // --- Доставка ---------------------------------------------------------

    const stockLocations = createStockLocationsWorkflow.runAsStep({
      input: transform({ command }, ({ command }) => ({
        locations: [
          {
            name: command.shipping.origin.name,
            address: {
              city: command.shipping.origin.city,
              address_1: command.shipping.origin.address_1,
              postal_code: command.shipping.origin.postal_code,
              country_code: command.country_code.toUpperCase(),
            },
          },
        ],
      })),
    });

    linkSalesChannelsToStockLocationWorkflow.runAsStep({
      input: transform(
        { stockLocations, salesChannels },
        ({ stockLocations, salesChannels }) => ({
          id: stockLocations[0].id,
          add: [salesChannels[0].id],
        }),
      ),
    });

    const fulfillmentSets = createFulfillmentSets(
      transform({ command }, ({ command }) => [
        {
          name: command.shipping.zone_name,
          type: "shipping",
          service_zones: [
            {
              name: command.shipping.zone_name,
              geo_zones: [
                {
                  type: "country" as const,
                  country_code: command.country_code,
                },
              ],
            },
          ],
        },
      ]),
    );

    // Склад ↔ набор доставки и склад ↔ провайдеры, которыми с него отгружают
    createRemoteLinkStep(
      transform(
        { command, stockLocations, fulfillmentSets },
        ({ command, stockLocations, fulfillmentSets }) => {
          const stock_location_id = stockLocations[0].id;
          const providerIds = [
            ...new Set(
              command.shipping.options.map((option) => option.provider_id),
            ),
          ];
          return [
            {
              [Modules.STOCK_LOCATION]: { stock_location_id },
              [Modules.FULFILLMENT]: {
                fulfillment_set_id: fulfillmentSets[0].id,
              },
            },
            ...providerIds.map((fulfillment_provider_id) => ({
              [Modules.STOCK_LOCATION]: { stock_location_id },
              [Modules.FULFILLMENT]: { fulfillment_provider_id },
            })),
          ];
        },
      ),
    );

    // Профиль по умолчанию создаёт Medusa (migration-скрипт ядра или старт приложения); нет — создаём
    const { data: shippingProfiles } = useQueryGraphStep({
      entity: "shipping_profile",
      fields: ["id"],
      filters: { type: "default" },
    });
    const createdProfiles = when(
      "create-default-shipping-profile",
      shippingProfiles,
      (profiles) => !profiles.length,
    ).then(() =>
      createShippingProfilesWorkflow.runAsStep({
        input: {
          data: [{ name: "Default Shipping Profile", type: "default" }],
        },
      }),
    );

    const shippingOptions = createShippingOptionsWorkflow.runAsStep({
      input: transform(
        { command, fulfillmentSets, shippingProfiles, createdProfiles },
        ({ command, fulfillmentSets, shippingProfiles, createdProfiles }) =>
          command.shipping.options.map((option) => ({
            name: option.name,
            price_type: "calculated" as const,
            provider_id: option.provider_id,
            service_zone_id: fulfillmentSets[0].service_zones[0].id,
            shipping_profile_id: (shippingProfiles[0] ?? createdProfiles![0])
              .id,
            data: { id: option.option_id },
            type: {
              label: option.name,
              description: option.description,
              code: option.option_id,
            },
            rules: [
              {
                attribute: "enabled_in_store",
                value: "true",
                operator: "eq" as const,
              },
              {
                attribute: "is_return",
                value: "false",
                operator: "eq" as const,
              },
            ],
          })),
      ),
    });

    const result = transform(
      {
        stores,
        regions,
        salesChannels,
        apiKeys,
        stockLocations,
        shippingOptions,
      },
      ({
        stores,
        regions,
        salesChannels,
        apiKeys,
        stockLocations,
        shippingOptions,
      }): InitialStoreDataDTO => ({
        store_id: stores[0].id,
        region_id: regions[0].id,
        sales_channel_id: salesChannels[0].id,
        publishable_api_key: apiKeys[0].token,
        stock_location_id: stockLocations[0].id,
        shipping_option_ids: shippingOptions.map((option) => option.id),
      }),
    );

    return new WorkflowResponse(result);
  },
);
