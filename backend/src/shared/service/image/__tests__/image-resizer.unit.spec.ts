import sharp from "sharp";

import { ImageResizer } from "../image-resizer";

const resizer = new ImageResizer({
  widths: [160, 640],
  formats: ["webp", "avif"],
  quality: 80,
});

function jpeg(
  width: number,
  height: number,
  orientation?: number,
): Promise<Buffer> {
  const image = sharp({
    create: { width, height, channels: 3, background: "#c33" },
  }).jpeg();
  return (orientation ? image.withMetadata({ orientation }) : image).toBuffer();
}

describe("ImageResizer", () => {
  it("строит ключ копии рядом с оригиналом", () => {
    expect(resizer.variantKey("products/123-photo.jpg", 640, "webp")).toBe(
      "products/123-photo.w640.webp",
    );
    expect(resizer.variantKeys("a.png")).toEqual([
      "a.w160.webp",
      "a.w160.avif",
      "a.w640.webp",
      "a.w640.avif",
    ]);
  });

  it("режет только растровые оригиналы, не svg и не свои копии", () => {
    expect(resizer.isResizable("a.JPG")).toBe(true);
    expect(resizer.isResizable("a.svg")).toBe(false);
    expect(resizer.isResizable("a.w640.webp")).toBe(false);
    expect(resizer.isResizable("prices.csv")).toBe(false);
  });

  it("делает копию на каждую ширину и формат, не растягивая маленький исходник", async () => {
    const variants = await resizer.resize("photo.jpg", await jpeg(400, 200));

    const sizes = await Promise.all(
      variants.map(async (variant) => {
        const meta = await sharp(variant.content).metadata();
        return { key: variant.key, format: meta.format, width: meta.width };
      }),
    );
    expect(sizes).toEqual([
      { key: "photo.w160.webp", format: "webp", width: 160 },
      { key: "photo.w160.avif", format: "heif", width: 160 },
      { key: "photo.w640.webp", format: "webp", width: 400 },
      { key: "photo.w640.avif", format: "heif", width: 400 },
    ]);
  });

  it("поворачивает по EXIF и удаляет метаданные", async () => {
    // orientation 6 — снято повёрнутым на 90°: 400×200 на экране становится 200×400
    const [variant] = await resizer.resize(
      "photo.jpg",
      await jpeg(400, 200, 6),
    );
    const meta = await sharp(variant.content).metadata();

    expect(meta.width).toBe(160);
    expect(meta.height).toBe(320);
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it("бросает ошибку на битом файле", async () => {
    await expect(
      resizer.resize("photo.jpg", Buffer.from("not an image")),
    ).rejects.toThrow();
  });
});
