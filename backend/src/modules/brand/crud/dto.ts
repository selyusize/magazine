export type BrandDTO = {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  is_active: boolean;
  synonyms: string[];
  created_at: Date;
  updated_at: Date;
};
