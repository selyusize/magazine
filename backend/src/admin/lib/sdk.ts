import Medusa from "@medusajs/js-sdk";

/** Клиент Admin API для своих страниц: та же сессия, что у дашборда. */
export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: { type: "session" },
});
