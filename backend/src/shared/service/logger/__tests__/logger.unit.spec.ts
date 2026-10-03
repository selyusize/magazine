import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { fakeLogger } from "../../../../../integration-tests/fakes";
import { Logger } from "../logger";

describe("Logger", () => {
  let dir: string;

  beforeEach(async () => {
    dir = path.join(await mkdtemp(path.join(os.tmpdir(), "logger-")), "logs");
  });

  afterEach(async () => {
    await rm(path.dirname(dir), { recursive: true, force: true });
  });

  it("пишет в stdout через логгер Medusa и добавляет данные к сообщению", () => {
    const medusa = fakeLogger();
    const logger = new Logger({ dir }, medusa);

    logger.info("import/run: старт", { supplier: "acme" });

    expect(medusa.info).toHaveBeenCalledWith(
      'import/run: старт {"supplier":"acme"}',
    );
  });

  it("toFile создаёт папку и пишет строки JSON в <dir>/<name>.log по порядку", async () => {
    const medusa = fakeLogger();
    const file = new Logger({ dir }, medusa).toFile(
      "import-acme",
    );

    file.info("первая");
    file.error("вторая", { id: 1 });
    await file.flush();

    const lines = (await readFile(path.join(dir, "import-acme.log"), "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(lines).toMatchObject([
      { level: "info", message: "первая" },
      { level: "error", message: "вторая", data: { id: 1 } },
    ]);
    expect(medusa.info).toHaveBeenCalledWith("первая");
  });

  it("не принимает имя файла с путём", () => {
    const logger = new Logger(
      { dir },
      fakeLogger(),
    );

    expect(() => logger.toFile("../etc/passwd")).toThrow(
      "недопустимое имя файла",
    );
  });
});
