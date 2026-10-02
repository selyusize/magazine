"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
(0, utils_1.loadEnv)(process.env.NODE_ENV || 'development', process.cwd());
const redisUrl = process.env.REDIS_URL;
// С REDIS_URL события, workflows и блокировки идут через Redis — это обязательно,
// когда server и worker работают в разных контейнерах. Без него — in-memory (только для dev).
const redisModules = redisUrl
    ? [
        {
            resolve: '@medusajs/medusa/event-bus-redis',
            options: { redisUrl },
        },
        {
            resolve: '@medusajs/medusa/workflow-engine-redis',
            options: { redis: { redisUrl } },
        },
        {
            resolve: '@medusajs/medusa/locking',
            options: {
                providers: [
                    {
                        resolve: '@medusajs/medusa/locking-redis',
                        id: 'locking-redis',
                        is_default: true,
                        options: { redisUrl },
                    },
                ],
            },
        },
    ]
    : [];
module.exports = (0, utils_1.defineConfig)({
    projectConfig: {
        databaseUrl: process.env.DATABASE_URL,
        redisUrl,
        // shared — всё в одном процессе (dev); server — HTTP API; worker — подписчики, jobs, workflows
        workerMode: process.env.MEDUSA_WORKER_MODE || 'shared',
        http: {
            storeCors: process.env.STORE_CORS,
            adminCors: process.env.ADMIN_CORS,
            authCors: process.env.AUTH_CORS,
            jwtSecret: process.env.JWT_SECRET,
            cookieSecret: process.env.COOKIE_SECRET,
        },
    },
    admin: {
        // Админка собирается и отдаётся только server-инстансом
        disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
        backendUrl: process.env.MEDUSA_BACKEND_URL,
    },
    modules: redisModules,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBaUU7QUFFakUsSUFBQSxlQUFPLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO0FBRTdELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFBO0FBRXRDLGtGQUFrRjtBQUNsRiw4RkFBOEY7QUFDOUYsTUFBTSxZQUFZLEdBQUcsUUFBUTtJQUMzQixDQUFDLENBQUM7UUFDRTtZQUNFLE9BQU8sRUFBRSxrQ0FBa0M7WUFDM0MsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFO1NBQ3RCO1FBQ0Q7WUFDRSxPQUFPLEVBQUUsd0NBQXdDO1lBQ2pELE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFO1NBQ2pDO1FBQ0Q7WUFDRSxPQUFPLEVBQUUsMEJBQTBCO1lBQ25DLE9BQU8sRUFBRTtnQkFDUCxTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsT0FBTyxFQUFFLGdDQUFnQzt3QkFDekMsRUFBRSxFQUFFLGVBQWU7d0JBQ25CLFVBQVUsRUFBRSxJQUFJO3dCQUNoQixPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUU7cUJBQ3RCO2lCQUNGO2FBQ0Y7U0FDRjtLQUNGO0lBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtBQUVOLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBQSxvQkFBWSxFQUFDO0lBQzVCLGFBQWEsRUFBRTtRQUNiLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7UUFDckMsUUFBUTtRQUNSLCtGQUErRjtRQUMvRixVQUFVLEVBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBcUQsSUFBSSxRQUFRO1FBQzFGLElBQUksRUFBRTtZQUNKLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVc7WUFDbEMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVztZQUNsQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFVO1lBQ2hDLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVU7WUFDakMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYTtTQUN4QztLQUNGO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsd0RBQXdEO1FBQ3hELE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixLQUFLLE1BQU07UUFDcEQsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCO0tBQzNDO0lBQ0QsT0FBTyxFQUFFLFlBQVk7Q0FDdEIsQ0FBQyxDQUFBIn0=