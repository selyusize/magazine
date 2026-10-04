import {
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows";

import { Container } from "@container/index";
import { ProductGuards } from "@domain/catalog/service/product-guards";

/**
 * Проверки товара (`ProductGuards`: магазин, обязательные поля публикации). Хуки срабатывают после записи связей
 * с каналами продаж; ошибка валит workflow Medusa, и он откатывает создание или изменение — из админки, импортом
 * CSV, импортом поставщика, любым путём.
 */
createProductsWorkflow.hooks.productsCreated(
  async ({ products }, { container }) => {
    await Container.from(container)
      .get(ProductGuards)
      .assert(products.map((product) => product.id));
  },
);

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products }, { container }) => {
    await Container.from(container)
      .get(ProductGuards)
      .assert(products.map((product) => product.id));
  },
);
