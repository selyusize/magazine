/** Куда вести покупателя (и поисковик) с пути. `to_path = null` — 410. */
export type RedirectRuleDTO = {
  from_path: string;
  to_path: string | null;
  code: number;
};
