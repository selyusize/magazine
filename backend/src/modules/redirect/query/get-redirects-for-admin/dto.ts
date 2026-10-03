export type AdminRedirectDTO = {
  id: string;
  from_path: string;
  to_path: string | null;
  code: number;
  /** `product` / `product_category` / `product_collection` — правило поставлено автоматически при смене handle. */
  entity_type: string | null;
  entity_id: string | null;
  updated_at: Date;
};

export type AdminRedirectsPageDTO = {
  redirects: AdminRedirectDTO[];
  count: number;
};
