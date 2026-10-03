import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { Logger } from "@medusajs/framework/types";
import sharp from "sharp";

import { LocalResizeFileService } from "../service/local-resize-file";

describe("LocalResizeFileService", () => {
  let dir: string;
  let logger: jest.Mocked<Pick<Logger, "warn">>;
  let service: LocalResizeFileService;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "file-local-resize-"));
    logger = { warn: jest.fn() };
    service = new LocalResizeFileService(
      { logger: logger as unknown as Logger },
      {
        upload_dir: dir,
        private_upload_dir: dir,
        backend_url: "http://localhost:9000/static",
        image: { widths: [160, 640], formats: ["webp"], quality: 80 },
      },
    );
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function upload(
    filename: string,
    content: Buffer,
    access: "public" | "private" = "public",
  ) {
    return service.upload({
      filename,
      mimeType: "image/png",
      content: content.toString("base64"),
      access,
    });
  }

  const png = () =>
    sharp({
      create: { width: 800, height: 600, channels: 3, background: "#39c" },
    })
      .png()
      .toBuffer();

  it("кладёт копии рядом с оригиналом и удаляет их вместе с ним", async () => {
    const { key, url } = await upload("photo.png", await png());
    const base = key.replace(/\.png$/, "");

    expect(url).toBe(`http://localhost:9000/static/${key}`);
    expect((await readdir(dir)).sort()).toEqual(
      [key, `${base}.w160.webp`, `${base}.w640.webp`].sort(),
    );

    await service.delete({ fileKey: key });
    expect(await readdir(dir)).toEqual([]);
  });

  it("не режет приватные файлы и не-картинки", async () => {
    await upload("photo.png", await png(), "private");
    await upload("prices.csv", Buffer.from("a;b"));

    expect(await readdir(dir)).toHaveLength(2);
  });

  it("битая картинка сохраняется без копий, загрузка не падает", async () => {
    const { key } = await upload("broken.jpg", Buffer.from("not an image"));

    expect(await readdir(dir)).toEqual([key]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`не удалось сделать копии ${key}`),
    );
  });
});
