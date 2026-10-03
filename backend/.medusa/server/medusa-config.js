"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Первым: загружает .env до конфигов ниже
require("./src/container/env");
const utils_1 = require("@medusajs/framework/utils");
const delivery_1 = require("./src/container/common/delivery");
const image_1 = require("./src/container/common/image");
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
                        image: image_1.imageConfig,
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
                ...(delivery_1.deliveryProviders.cdek
                    ? [
                        {
                            resolve: "./src/modules/fulfillment-cdek",
                            id: "cdek",
                            options: {
                                ...delivery_1.cdekConfig,
                                tariffs: delivery_1.cdekTariffs,
                                parcel: delivery_1.parcelDefaults,
                            },
                        },
                    ]
                    : []),
                ...(delivery_1.deliveryProviders.yandex_delivery
                    ? [
                        {
                            resolve: "./src/modules/fulfillment-yandex-delivery",
                            id: "yandex-delivery",
                            options: { ...delivery_1.yandexDeliveryConfig, parcel: delivery_1.parcelDefaults },
                        },
                    ]
                    : []),
            ],
        },
    },
];
module.exports = (0, utils_1.defineConfig)({
    projectConfig: {
        databaseUrl: process.env.DATABASE_URL,
        redisUrl,
        // shared — всё в одном процессе (dev); server — HTTP API; worker — подписчики, jobs, workflows
        workerMode: process.env.MEDUSA_WORKER_MODE ||
            "shared",
        http: {
            storeCors: process.env.STORE_CORS,
            adminCors: process.env.ADMIN_CORS,
            authCors: process.env.AUTH_CORS,
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
        { resolve: "./src/modules/exchange" },
    ],
    // Без модуля caching флаг ничего не делает — включаем вместе с Redis
    featureFlags: { caching: Boolean(redisUrl) },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwwQ0FBMEM7QUFDMUMsK0JBQTZCO0FBRTdCLHFEQUF5RDtBQUV6RCw4REFNeUM7QUFDekMsd0RBQTJEO0FBRTNELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO0FBRXZDLGtGQUFrRjtBQUNsRiw4RkFBOEY7QUFDOUYsTUFBTSxZQUFZLEdBQUcsUUFBUTtJQUMzQixDQUFDLENBQUM7UUFDRTtZQUNFLE9BQU8sRUFBRSxrQ0FBa0M7WUFDM0MsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFO1NBQ3RCO1FBQ0Q7WUFDRSxPQUFPLEVBQUUsd0NBQXdDO1lBQ2pELE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFO1NBQ2pDO1FBQ0QsaUdBQWlHO1FBQ2pHLCtEQUErRDtRQUMvRDtZQUNFLE9BQU8sRUFBRSwwQkFBMEI7WUFDbkMsT0FBTyxFQUFFO2dCQUNQLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxPQUFPLEVBQUUsZ0NBQWdDO3dCQUN6QyxFQUFFLEVBQUUsZUFBZTt3QkFDbkIsVUFBVSxFQUFFLElBQUk7d0JBQ2hCLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRTtxQkFDdEI7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0Q7WUFDRSxPQUFPLEVBQUUsMEJBQTBCO1lBQ25DLE9BQU8sRUFBRTtnQkFDUCxTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsT0FBTyxFQUFFLGdDQUFnQzt3QkFDekMsRUFBRSxFQUFFLGVBQWU7d0JBQ25CLFVBQVUsRUFBRSxJQUFJO3dCQUNoQixPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUU7cUJBQ3RCO2lCQUNGO2FBQ0Y7U0FDRjtLQUNGO0lBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUVQLDRHQUE0RztBQUM1RyxrR0FB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