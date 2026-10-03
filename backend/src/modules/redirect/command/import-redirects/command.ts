import type { RedirectCode } from "../../service/path";

/** Правила из CSV — сохраняются все или ни одного. */
export type ImportRedirectsCommand = {
  redirects: {
    from_path: string;
    to_path: string | null;
    code: RedirectCode;
  }[];
};
