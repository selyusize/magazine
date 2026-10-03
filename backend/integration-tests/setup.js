const { MetadataStorage } = require("@medusajs/framework/mikro-orm/core");

MetadataStorage.clear();

// Тесты — без Redis: иначе события тестов уходят в общую очередь BullMQ, и их забирает запущенный
// `medusa develop` (а кэш и блокировки делятся с dev-окружением). Пустое значение dotenv не перезаписывает.
process.env.REDIS_URL = "";

// Перевозчики подключаются только с ключами (medusa-config.ts). В тестах к ним не ходим — ключи-пустышки,
// чтобы провайдеры зарегистрировались и сид создал способы доставки.
process.env.CDEK_BASE_URL = "https://cdek.invalid"
process.env.CDEK_CLIENT_ID = "test"
process.env.CDEK_CLIENT_SECRET = "test"
process.env.YANDEX_DELIVERY_BASE_URL = "https://yandex-delivery.invalid"
process.env.YANDEX_DELIVERY_TOKEN = "test"
