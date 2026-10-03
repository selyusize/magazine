import { timingSafeEqual } from "node:crypto";

import { Injectable } from "@shared/container";

import type { ExchangeSupplierDTO } from "../../query/get-exchange-supplier-by-id/dto";
import { EXCHANGE_COOKIE, ExchangeSession } from "../exchange-session";

const equal = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

/**
 * Кто пришёл на `/1c/exchange/:supplier`: Basic с логином и паролем поставщика (`supplier.exchange`) или cookie
 * сессии, выданная этому же поставщику после `checkauth`. Логин и пароль сравниваются за постоянное время.
 */
@Injectable()
export class ExchangeAuthenticator {
  constructor(private readonly session: ExchangeSession) {}

  basic(supplier: ExchangeSupplierDTO, header: string | undefined): boolean {
    const { login, password } = supplier.settings;
    if (!login || !password || !header?.startsWith("Basic ")) return false;
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    return equal(decoded.slice(0, separator), login) && equal(decoded.slice(separator + 1), password);
  }

  hasSession(supplier: ExchangeSupplierDTO, cookieHeader: string | undefined): boolean {
    const cookie = (cookieHeader ?? "")
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${EXCHANGE_COOKIE}=`));
    return this.session.supplierOf(cookie?.slice(EXCHANGE_COOKIE.length + 1)) === supplier.id;
  }
}
