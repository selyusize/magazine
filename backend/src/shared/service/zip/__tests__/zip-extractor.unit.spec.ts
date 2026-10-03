import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildZip } from "../../../../../integration-tests/http/helpers/zip";
import { safeRelativePath, ZipExtractor } from "../zip-extractor";

describe("ZipExtractor", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "zip-extractor-"));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  const archive = async (files: Record<string, string>) => {
    const file = path.join(dir, "package.zip");
    await writeFile(file, buildZip(files));
    return file;
  };

  it("распаковывает файлы с подпапками и кириллицей в именах", async () => {
    const file = await archive({
      "import.xml": "<a/>",
      "import_files/ab/фото.jpg": "jpeg",
    });

    const files = await new ZipExtractor({ max_bytes: 1024 }).extract(file, path.join(dir, "out"));

    expect(files).toEqual(["import.xml", "import_files/ab/фото.jpg"]);
    await expect(readFile(path.join(dir, "out/import_files/ab/фото.jpg"), "utf8")).resolves.toBe("jpeg");
  });

  it("zip-бомба — INVALID_DATA по пределу объёма", async () => {
    const file = await archive({ "big.xml": "x".repeat(2048) });

    await expect(new ZipExtractor({ max_bytes: 1024 }).extract(file, path.join(dir, "out"))).rejects.toMatchObject({
      type: "invalid_data",
      message: expect.stringContaining("больше 1024 байт"),
    });
  });

  it("не архив — INVALID_DATA", async () => {
    const file = path.join(dir, "broken.zip");
    await writeFile(file, "not a zip");

    await expect(new ZipExtractor({ max_bytes: 1024 }).extract(file, dir)).rejects.toMatchObject({
      type: "invalid_data",
    });
  });
});

describe("safeRelativePath", () => {
  it("нормализует пути Windows и ведущие слэши, не выпускает за папку", () => {
    expect(safeRelativePath("import_files\\ab\\1.jpg")).toBe("import_files/ab/1.jpg");
    expect(safeRelativePath("/offers.xml")).toBe("offers.xml");
    expect(safeRelativePath("a/../b.xml")).toBe("b.xml");
    expect(() => safeRelativePath("../../etc/passwd")).toThrow("недопустимый путь");
    expect(() => safeRelativePath("..")).toThrow("недопустимый путь");
  });
});
