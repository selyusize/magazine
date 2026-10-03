/**
 * Ключ сравнения названий брендов: регистр, «ё», кавычки, точки и лишние пробелы не важны —
 * «NIKE», «Nike.», «“Найк”» из разных выгрузок сводятся к одному бренду (вместе с синонимами бренда).
 */
export function brandKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/["'`«»“”„‘’]/g, "")
    .replace(/[.,;:!]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Красивое написание нового бренда: без кавычек и лишних пробелов, регистр поставщика сохраняется. */
export function brandDisplayName(name: string): string {
  return name
    .replace(/["«»“”„]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
