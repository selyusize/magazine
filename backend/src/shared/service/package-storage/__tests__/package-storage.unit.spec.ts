import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";

import { PackageStorage } from "../package-storage";

describe("PackageStorage", () => {
  let dir: string;
  let storage: PackageStorage;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "package-storage-"));
    storage = new PackageStorage({ dir });
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it("дописывает файл частями и перечисляет файлы папки", async () => {
    await storage.append("sup/run", "import.zip", Readable.from([Buffer.from("ab")]), 10);
    await storage.append("sup/run", "import.zip", Readable.from([Buffer.from("cd")]), 10);
    await storage.append("sup/run", "import_files/1.jpg", Readable.from([Buffer.from("x")]), 10);

    await expect(readFile(storage.resolve("sup/run", "import.zip"), "utf8")).resolves.toBe("abcd");
    await expect(storage.list("sup/run")).resolves.toEqual(["import.zip", "import_files/1.jpg"]);
    await expect(storage.list("missing")).resolves.toEqual([]);
    await expect(storage.exists("sup/run", "import.zip")).resolves.toBe(true);
  });

  it("не выпускает за корень и ограничивает размер части", async () => {
    expect(() => storage.resolve("sup", "../../etc/passwd")).toThrow("Недопустимый путь");
    await expect(
      storage.append("sup", "big.xml", Readable.from([Buffer.from("x".repeat(11))]), 10),
    ).rejects.toMatchObject({ type: "invalid_data" });
  });
});
