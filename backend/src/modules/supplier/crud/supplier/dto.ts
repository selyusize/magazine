export type SupplierDTO = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  order_email: string | null;
  order_api_url: string | null;
  ship_city: string;
  ship_address: string | null;
  assembly_days: number;
  is_active: boolean;
  exchange: { readonly [key: string]: string | number | boolean | null };
  markup: { readonly [key: string]: string | number | boolean | null };
  /** Виртуальный склад поставщика; `null` — подписчик ещё не создал его. */
  stock_location_id: string | null;
  created_at: Date;
  updated_at: Date;
};
