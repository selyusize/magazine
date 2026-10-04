import type { RedirectCode } from "../../service/path";

/** Ручное правило из админки в текущем магазине. Правило магазина с тем же `from_path` перезаписывается. */
export type SaveRedirectCommand = {
  shop_id: string;
  from_path: string;
  /** `null` — 410. */
  to_path: string | null;
  code: RedirectCode;
};
