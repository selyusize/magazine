import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { fakeLogger } from "../../../../../integration-tests/fakes";

import { Downloader, HTTPTransport } from "../downloader";

const logger = fakeLogger();
const options = { max_bytes: 16, timeout_ms: 1000 };

describe("Downloader", () => {
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  let dir: string;

  beforeEach(async () => {
    fetchMock = jest.spyOn(global, "fetch");
    dir = await mkdtemp(path.join(tmpdir(), "downloader-"));
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  const downloader = () => new Downloader(options, [new HTTPTransport()], logger);

  it("скачивает по HTTP с Basic-авторизацией в файл и в память", async () => {
    fetchMock.mockImplementation(async () => new Response("<xml/>"));

    const file = path.join(dir, "a/import.xml");
    await downloader().toFile({ url: "https://supplier.test/import.xml", login: "shop", password: "p@ss" }, file);

    await expect(readFile(file, "utf8")).resolves.toBe("<xml/>");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://supplier.test/import.xml");
    expect(new Headers(init?.headers).get("authorization")).toBe(`Basic ${Buffer.from("shop:p@ss").toString("base64")}`);
    await expect(downloader().toBuffer({ url: "https://supplier.test/1.jpg" })).resolves.toEqual(Buffer.from("<xml/>"));
  });

  it("ответ не 2xx — UNEXPECTED_STATE с адресом и статусом", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 403, statusText: "Forbidden" }));

    await expect(downloader().toBuffer({ url: "https://supplier.test/x.xml" })).rejects.toMatchObject({
      type: "unexpected_state",
      message: "Не удалось скачать https://supplier.test/x.xml: HTTP 403 Forbidden",
    });
  });

  it("обрывает файл больше предела", async () => {
    fetchMock.mockResolvedValue(new Response("x".repeat(64)));

    await expect(downloader().toBuffer({ url: "https://supplier.test/big.xml" })).rejects.toMatchObject({
      type: "invalid_data",
      message: expect.stringContaining("больше 16 байт"),
    });
  });

  it("неподдержанный протокол и мусор вместо адреса — INVALID_DATA", async () => {
    await expect(downloader().toBuffer({ url: "ftp://supplier.test/x.xml" })).rejects.toMatchObject({
      message: "Протокол ftp не поддерживается (ftp://supplier.test/x.xml)",
    });
    await expect(downloader().toBuffer({ url: "not a url" })).rejects.toMatchObject({ type: "invalid_data" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
