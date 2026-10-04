import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { MedusaError } from "@medusajs/framework/utils";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const IV_BYTES = 12;

/**
 * Шифрование секретов в БД (секрет ревалидации витрины, позже — ключи ЮKassa магазина): AES-256-GCM, формат
 * `v1:<iv>:<tag>:<данные>` в base64url. Ключ — `SHOP_SECRETS_KEY` (`src/container/common/cache.ts`), из любой
 * строки получается 32 байта через SHA-256. Смена ключа делает старые записи нечитаемыми — секреты перевыпускают.
 */
export class SecretBox {
  private readonly key: Buffer;

  constructor(secret: string) {
    if (!secret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "SecretBox: пустой ключ шифрования (SHOP_SECRETS_KEY)");
    }
    this.key = createHash("sha256").update(secret).digest();
  }

  encrypt(plain: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    return [VERSION, iv, cipher.getAuthTag(), data]
      .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
      .join(":");
  }

  /** Расшифровка; чужой ключ или испорченная запись — `null`, а не исключение: вызывающий решает, что делать. */
  decrypt(sealed: string): string | null {
    const [version, iv, tag, data] = sealed.split(":");
    if (version !== VERSION || !iv || !tag || data === undefined) return null;
    try {
      const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(iv, "base64url"));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
    } catch {
      return null;
    }
  }
}

/** Случайный секрет для внешней системы (вебхук витрины): 32 байта в base64url. */
export const generateSecret = (): string => randomBytes(32).toString("base64url");
