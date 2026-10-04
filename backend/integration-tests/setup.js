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

// Вебхуки ревалидации витрин — только фейковым приёмникам тестов на loopback (в сеть тесты не ходят), окно
// дебаунса короткое, чтобы не ждать секундами
process.env.STOREFRONT_REVALIDATE_HOSTS = "127.0.0.1"
process.env.STOREFRONT_REVALIDATE_WINDOW_MS = "300"

// Пакеты обмена и логи импорта тестов — во временной папке, не в backend/exchange и backend/logs
const os = require("node:os");
const path = require("node:path");
process.env.EXCHANGE_DIR = path.join(os.tmpdir(), "magazine-tests", "exchange");
process.env.LOGS_DIR = path.join(os.tmpdir(), "magazine-tests", "logs");
