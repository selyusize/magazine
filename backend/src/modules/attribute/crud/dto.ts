export type AttributeDTO = {
  id: string;
  name: string;
  handle: string;
  type: "string" | "number" | "boolean";
  unit: string | null;
  is_filterable: boolean;
  is_visible: boolean;
  rank: number;
  created_at: Date;
  updated_at: Date;
};
