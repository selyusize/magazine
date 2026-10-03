import type { RedirectCode } from "../../service/path";

/** Ручное правило из админки. Правило с тем же `from_path` перезаписывается. */
export type SaveRedirectCommand = {
  from_path: string;
  /** `null` — 410. */
  to_path: string | null;
  code: RedirectCode;
};
