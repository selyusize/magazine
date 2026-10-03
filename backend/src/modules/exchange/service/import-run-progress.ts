import type { ImportRunPatch } from "../step/update-import-run";

/** Ошибок в запуске храним не больше — полный список в файловом логе `import-<поставщик>.log`. */
export const MAX_RUN_ERRORS = 100;

export type ProgressScope = "products" | "offers";
/**
 * `received` — сколько пришло в выгрузке, `linked` — товар склеен с карточкой другого поставщика, `zeroed` —
 * предложение пропало из полной выгрузки.
 */
export type ProgressCounter = "received" | "created" | "updated" | "skipped" | "linked" | "zeroed" | "failed";

/**
 * Ход запуска в памяти обработчика: файл и позиция в нём, счётчики, последние ошибки. После каждой пачки
 * `snapshot()` уходит в `save-import-run-progress` — с этой позиции запуск продолжится после падения worker.
 */
export class ImportRunProgress {
  private stats: Record<string, Record<string, number>>;
  private errors: { external_id: string | null; message: string }[];
  private file: string | null;
  private position: number;

  constructor(initial: {
    stats: Record<string, Record<string, number>>;
    errors: { external_id: string | null; message: string }[];
    current_file: string | null;
    cursor: number;
  }) {
    this.stats = structuredClone(initial.stats);
    this.errors = [...initial.errors];
    this.file = initial.current_file;
    this.position = initial.cursor;
  }

  /** Сколько записей файла уже обработано в прошлых попытках; файлы раньше текущего — целиком. */
  resumeFrom(file: string, files: string[]): number | "skip" {
    if (!this.file) return 0;
    const current = files.indexOf(this.file);
    const index = files.indexOf(file);
    if (current < 0) return 0;
    if (index < current) return "skip";
    return index === current ? this.position : 0;
  }

  /** Где сейчас обработка: файл и сколько его записей позади. */
  at(file: string, position: number): void {
    this.file = file;
    this.position = position;
  }

  /** В запуске уже обрабатывались предложения (в том числе до падения) — полная выгрузка обнулит пропавшие. */
  hasOffers(): boolean {
    return (this.stats.offers?.received ?? 0) > 0;
  }

  count(scope: ProgressScope, counter: ProgressCounter, amount = 1): void {
    if (!amount) return;
    const counters = (this.stats[scope] ??= {});
    counters[counter] = (counters[counter] ?? 0) + amount;
  }

  fail(external_id: string | null, message: string): void {
    this.errors = [...this.errors, { external_id, message }].slice(-MAX_RUN_ERRORS);
  }

  snapshot(): Pick<ImportRunPatch, "current_file" | "cursor" | "stats" | "errors"> {
    return { current_file: this.file, cursor: this.position, stats: this.stats, errors: this.errors };
  }
}
