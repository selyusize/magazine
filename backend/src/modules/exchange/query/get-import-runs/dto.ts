import type { ImportRunDTO } from "../get-import-run-by-id/dto";

export type ImportRunsPageDTO = { rows: Omit<ImportRunDTO, "errors">[]; count: number };
