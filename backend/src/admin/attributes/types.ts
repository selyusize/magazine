/** Типы характеристик — как `ATTRIBUTE_TYPES` модуля attribute на бэкенде. */
export const ATTRIBUTE_TYPES = ["string", "number", "boolean"] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];
