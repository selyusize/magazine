/** Сколько групп и свойств добавилось и изменилось. */
export type SavedExchangeClassifierDTO = {
  groups: { created: number; updated: number };
  properties: { created: number; updated: number; linked: number };
};
