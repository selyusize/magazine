/** Сохранённое правило; цель может отличаться от присланной — цепочки схлопываются. */
export type SavedRedirectDTO = {
  id: string;
  from_path: string;
  to_path: string | null;
  code: number;
};
