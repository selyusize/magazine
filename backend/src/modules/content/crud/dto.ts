export type ArticleDTO = {
  id: string;
  title: string;
  handle: string;
  excerpt: string | null;
  body: string | null;
  status: "draft" | "published";
  created_at: Date;
  updated_at: Date;
};
