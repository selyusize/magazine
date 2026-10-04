import type { RedirectCode } from "../../service/path";

/** Правила из CSV в магазин `shop_id` — сохраняются все или ни одного. */
export type ImportRedirectsCommand = {
  shop_id: string;
  redirects: {
    from_path: string;
    to_path: string | null;
    code: RedirectCode;
  }[];
};
