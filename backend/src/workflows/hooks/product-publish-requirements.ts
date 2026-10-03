import {
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows";

import { Container } from "@container/index";
import { ProductPublishGuard } from "@domain/catalog/service/product-publish-guard";

/**
 * Обязательные поля для публикации (план, этап 2.6). Ошибка в хуке валит workflow Medusa, и он откатывает
 * создание или изменение: из админки, импортом CSV, импортом поставщика — любым путём.
 */
createProductsWorkflow.hooks.productsCreated(
  async ({ products }, { container }) => {
    await Container.from(container)
      .get(ProductPublishGuard)
      .assertPublishable(products.map((product) => product.id));
  },
);

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products }, { container }) => {
    await Container.from(container)
      .get(ProductPublishGuard)
      .assertPublishable(products.map((product) => product.id));
  },
);
