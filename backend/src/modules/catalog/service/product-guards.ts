import { Injectable } from "@shared/container";

import { ProductPublishGuard } from "./product-publish-guard";
import { ProductShopGuard } from "./product-shop-guard";

/** Проверка товара из хуков Medusa: `assert` бросает 400 и откатывает workflow создания или изменения. */
type ProductGuard = { assert(productIds: string[]): Promise<void> };

/**
 * Все проверки товара после создания и изменения — по порядку: сначала магазин (без него остальное не сравнить),
 * потом обязательные поля публикации. У хука Medusa один обработчик, поэтому новая проверка — строка в `guards`.
 */
@Injectable()
export class ProductGuards {
  private readonly guards: ProductGuard[];

  constructor(shop: ProductShopGuard, publish: ProductPublishGuard) {
    this.guards = [shop, publish];
  }

  async assert(productIds: string[]): Promise<void> {
    for (const guard of this.guards) await guard.assert(productIds);
  }
}
