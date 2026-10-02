import { z } from "zod";

// Стандартные сообщения zod — на русском. Свои тексты для полей — в errorMessages (./errors.ts)
z.config(z.locales.ru());

export { z };
