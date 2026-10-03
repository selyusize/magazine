import { Injectable } from "@shared/container";

import { SaveExchangeClassifierHandler } from "../command/save-exchange-classifier/handler";
import { StageExchangeProductsHandler } from "../command/stage-exchange-products/handler";
import { GetExchangeGroupsBySupplierIdFetcher } from "../query/get-exchange-groups-by-supplier-id/fetcher";
import { GetExchangePropertiesBySupplierIdFetcher } from "../query/get-exchange-properties-by-supplier-id/fetcher";
import type { CMLGroup, CMLProduct, CMLProperty } from "./commerceml/types";
import type { ImportContext } from "./import-context";
import { contentHash, toImportedProduct } from "./imported-product";
import { isolateFailures } from "./isolate-failures";

/** Каталог поставщика (`import.xml`): классификатор и пачки товаров. */
@Injectable()
export class CatalogImporter {
  constructor(
    private readonly classifier: SaveExchangeClassifierHandler,
    private readonly stage: StageExchangeProductsHandler,
    private readonly properties: GetExchangePropertiesBySupplierIdFetcher,
    private readonly groups: GetExchangeGroupsBySupplierIdFetcher,
  ) {}

  /** Группы и свойства → справочники поставщика; маппинг перечитывается для разбора товаров. */
  async saveClassifier(context: ImportContext, groups: CMLGroup[], properties: CMLProperty[]): Promise<void> {
    const saved = await this.classifier.handle({ supplier_id: context.supplier_id, groups, properties });
    context.log.info(`exchange/import: классификатор — групп ${groups.length}, свойств ${properties.length}`, saved);
    await this.loadMappings(context);
  }

  /** Маппинг групп на категории и свойств на характеристики — из админки и классификатора. */
  async loadMappings(context: ImportContext): Promise<void> {
    const [properties, groups] = await Promise.all([
      this.properties.fetch({ supplier_id: context.supplier_id }),
      this.groups.fetch({ supplier_id: context.supplier_id }),
    ]);
    context.properties = new Map(properties.map((property) => [property.external_id, property]));
    context.groups = new Map(groups.map((group) => [group.external_id, group]));
  }

  /** Пачка товаров; упала — по одному, битый товар — в ошибки запуска. */
  async importProducts(context: ImportContext, products: CMLProduct[]): Promise<void> {
    context.progress.count("products", "received", products.length);
    const staged = products.map((product) => {
      const data = toImportedProduct(product, {
        properties: context.properties,
        groups: context.groups,
        brand_property: context.settings.brand_property,
      });
      return { ...data, content_hash: contentHash(data) };
    });

    await isolateFailures(
      staged,
      async (items) => {
        const result = await this.stage.handle({
          supplier_id: context.supplier_id,
          package_dir: context.package_dir,
          publish: context.settings.publish,
          products: items,
        });
        // Новые товары каталога — ещё не карточки (их создаст первое предложение): считаем изменившиеся
        context.progress.count("products", "updated", result.updated);
        context.progress.count("products", "skipped", result.skipped);
        for (const error of result.errors) {
          context.progress.fail(error.external_id, error.message);
          context.log.warn(`exchange/import: ${error.external_id ?? "—"}: ${error.message}`);
        }
      },
      (item, error) => {
        context.progress.count("products", "failed");
        context.progress.fail(item.external_id, error.message);
        context.log.error(`exchange/import: товар ${item.external_id}: ${error.message}`);
      },
    );
  }
}
