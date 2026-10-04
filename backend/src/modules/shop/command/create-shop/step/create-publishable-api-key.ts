import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/**
 * Publishable-ключ витрины магазина. Вместо `createApiKeysWorkflow`: его откат удаляет ключ без отзыва, а модуль
 * api-key неотозванный ключ не удаляет — после сбоя `create-shop` оставался бы рабочий ключ без магазина.
 * Здесь откат сначала отзывает ключ, затем удаляет.
 */
export const createPublishableAPIKeyStep = createStep(
  "create-publishable-api-key",
  async (input: { title: string }, { container }) => {
    const apiKeys = container.resolve(Modules.API_KEY);
    const apiKey = await apiKeys.createApiKeys({
      title: input.title,
      type: "publishable",
      created_by: "",
    });
    return new StepResponse({ id: apiKey.id, token: apiKey.token }, apiKey.id);
  },
  async (apiKeyId, { container }) => {
    if (!apiKeyId) return;
    const apiKeys = container.resolve(Modules.API_KEY);
    await apiKeys.revoke(apiKeyId, { revoked_by: "create-shop" });
    await apiKeys.deleteApiKeys(apiKeyId);
  },
);
