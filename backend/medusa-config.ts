import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const redisUrl = process.env.REDIS_URL

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
  : []

// Загрузки (картинки товаров) пишутся в ./static — в Docker это volume, общий для всех контейнеров backend.
// MEDUSA_FILE_URL — публичный адрес этой папки (https://api.<домен>/static); без него Medusa
// отдаёт ссылки вида http://localhost:9000/static/…
const fileUrl = process.env.MEDUSA_FILE_URL

const fileModules = fileUrl
  ? [
      {
        resolve: '@medusajs/medusa/file',
        options: {
          providers: [
            {
              resolve: '@medusajs/medusa/file-local',
              id: 'local',
              options: { backend_url: fileUrl },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl,
    // shared — всё в одном процессе (dev); server — HTTP API; worker — подписчики, jobs, workflows
    workerMode: (process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server') || 'shared',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      // Срок жизни JWT покупателя; витрина продлевает его, пока покупатель активен
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    // Админка собирается и отдаётся только server-инстансом
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [...redisModules, ...fileModules],
})
