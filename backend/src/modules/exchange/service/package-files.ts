/** Порядок разбора: сначала каталог, потом предложения, цены, остатки; внутри — `import0_2` после `import0_1`. */
const KINDS = ["import", "offers", "prices", "rests"];

/** Картинки товаров 1С кладёт в `import_files/` — XML там не ищем. */
const IMAGES_DIR = "import_files/";

/**
 * XML-файлы пакета обмена в порядке обработки. Каталог должен прийти раньше предложений: карточку создаёт первое
 * предложение по данным товара из `import.xml`.
 */
export function orderPackageFiles(files: string[]): string[] {
  const rank = (file: string) => {
    const name = file.slice(file.lastIndexOf("/") + 1).toLowerCase();
    const kind = KINDS.findIndex((prefix) => name.startsWith(prefix));
    return kind < 0 ? KINDS.length : kind;
  };
  return files
    .filter((file) => file.toLowerCase().endsWith(".xml") && !file.startsWith(IMAGES_DIR))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "en", { numeric: true }));
}
