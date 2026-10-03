export type BrandDTO = {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};
