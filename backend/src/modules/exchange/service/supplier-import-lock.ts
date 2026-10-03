import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

import { Injectable, InjectContainer } from "@shared/container";

/**
 * Один импорт на поставщика: два запуска одного поставщика (повтор от 1С, pull и ручной запуск) иначе спорили бы
 * за одни и те же карточки. Блокировка Medusa (Redis, если подключён) с владельцем — запуском и сроком: worker
 * упал — блокировка истекает сама, живой запуск продлевает её на каждой пачке.
 */
@Injectable()
export class SupplierImportLock {
  constructor(@InjectContainer() private readonly container: MedusaContainer) {}

  /** `true` — блокировка у этого запуска (взята или продлена), `false` — поставщика уже импортирует другой. */
  async acquire(supplierId: string, runId: string, expireSeconds: number): Promise<boolean> {
    try {
      await this.locking().acquire(this.key(supplierId), { ownerId: runId, expire: expireSeconds });
      return true;
    } catch {
      // Занято другим владельцем — это ответ, а не сбой: запуск подождёт в очереди
      return false;
    }
  }

  async release(supplierId: string, runId: string): Promise<void> {
    await this.locking().release(this.key(supplierId), { ownerId: runId });
  }

  private locking() {
    return this.container.resolve(Modules.LOCKING);
  }

  private key(supplierId: string): string {
    return `exchange-import:${supplierId}`;
  }
}
