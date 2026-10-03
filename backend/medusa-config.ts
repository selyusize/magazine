// Первым: загружает .env до конфигов ниже
import "./src/container/env";

import { defineConfig } from "@medusajs/framework/utils";

import {
  cdekConfig,
  cdekTariffs,
  deliveryProviders,
  parcelDefaults,
  yandexDeliveryConfig,
} from "./src/container/common/delivery";
import { imageConfig } from "./src/container/common/image";

const redisUrl = process.env.REDIS_URL;

// С REDIS_URL события, workflows и блокировки идут через Redis — это обязательно,
// когда server и worker работают в разных контейнерах. Без него — in-memory (только для dev).
const redisModules = redisUrl
  ? [
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { redisUrl } },
      },
      // Кэш Query и core-flows (флаг caching ниже). Инвалидация — автоматически по событиям сущностей,
      // поэтому кэш общий для server и worker и живёт только в Redis
      {
        resolve: "@medusajs/medusa/caching",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/caching-redis",
              id: "caching-redis",
              is_default: true,
              options: { redisUrl },
            },
          ],
        },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl },
            },
          ],
        },
      },
    ]
  : [];

// Загрузки (картинки товаров) пишутся в ./static — в Docker это volume, общий для всех контейнеров backend.
// Провайдер — file-local + уменьшенные копии картинок для srcset (src/modules/file-local-resize).
// MEDUSA_FILE_URL — публичный адрес этой папки (https://api.<домен>/static); без него Medusa
// отдаёт ссылки вида http://localhost:9000/static/…
const fileModules = [
  {
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "./src/modules/file-local-resize",
          id: "local",
          options: {
            backend_url: process.env.MEDUSA_FILE_URL,
            image: imageConfig,
          },
        },
      ],
    },
  },
];

// Доставка: перевозчики считают тариф от города склада отгрузки (src/modules/fulfillment-*).
// Провайдер без ключей не подключается; manual — для ручных способов из админки.
const fulfillmentModules = [
  {
    resolve: "@medusajs/medusa/fulfillment",
    options: {
      providers: [
        { resolve: "@medusajs/medusa/fulfillment-manual", id: "manual" },
        ...(deliveryProviders.cdek
          ? [
              {
                resolve: "./src/modules/fulfillment-cdek",
                id: "cdek",
                options: {
                  ...cdekConfig,
                  tariffs: cdekTariffs,
                  parcel: parcelDefaults,
                },
              },
            ]
          : []),
        ...(deliveryProviders.yandex_delivery
          ? [
              {
                resolve: "./src/modules/fulfillment-yandex-delivery",
                id: "yandex-delivery",
                options: { ...yandexDeliveryConfig, parcel: parcelDefaults },
              },
            ]
          : []),
      ],
    },
  },
];

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl,
    // shared — всё в одном процессе (dev); server — HTTP API; worker — подписчики, jobs, workflows
    workerMode:
      (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server") ||
      "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      // Срок жизни JWT покупателя; витрина продлевает его, пока покупатель активен
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    // Админка собирается и отдаётся только server-инстансом
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    ...redisModules,
    ...fileModules,
    ...fulfillmentModules,
    { resolve: "./src/modules/redirect" },
    { resolve: "./src/modules/brand" },
    { resolve: "./src/modules/content" },
    { resolve: "./src/modules/filter-page" },
    { resolve: "./src/modules/supplier" },
    { resolve: "./src/modules/catalog" },
    { resolve: "./src/modules/attribute" },
  ],
  // Без модуля caching флаг ничего не делает — включаем вместе с Redis
  featureFlags: { caching: Boolean(redisUrl) },
});
