import { Injectable } from "@shared/container";

import { AddExchangeVariantsHandler } from "../command/add-exchange-variants/handler";
import { ImportExchangeOffersHandler } from "../command/import-exchange-offers/handler";
import { PublishExchangeProductsHandler } from "../command/publish-exchange-products/handler";
import type { CMLOffer } from "./commerceml/types";
import type { ImportContext } from "./import-context";
import { isolateFailures } from "./isolate-failures";

/** Предложения поставщика (`offers.xml`, `prices.xml`, `rests.xml`): карточки, варианты, цены, остатки. */
@Injectable()
export class OffersImporter {
  constructor(
    private readonly offers: ImportExchangeOffersHandler,
    private readonly variants: AddExchangeVariantsHandler,
    private readonly publish: PublishExchangeProductsHandler,
  ) {}

  /** Пачка предложений, затем новые варианты существующих карточек — по карточке. */
  async importOffers(context: ImportContext, offers: CMLOffer[]): Promise<void> {
    const prices = {
      purchase_price_type: context.settings.purchase_price_type,
      retail_price_type: context.settings.retail_price_type,
      markup_percent: context.settings.markup_percent,
    };

    context.progress.count("offers", "received", offers.length);
    // Повтор по одному — по товару: предложения одного товара создают одну карточку
    await isolateFailures(
      groupByProduct(offers),
      async (groups) => {
        const result = await this.offers.handle({
          supplier_id: context.supplier_id,
          package_dir: context.package_dir,
          publish: context.settings.publish,
          synced_at: context.synced_at,
          price_types: context.price_types,
          settings: prices,
          offers: groups.flat(),
        });
        context.progress.count("products", "created", result.created.length);
        context.progress.count("products", "linked", result.linked.length);
        context.progress.count("offers", "created", result.offers.created);
        context.progress.count("offers", "updated", result.offers.updated);
        this.report(context, result.errors);

        for (const deferred of result.deferred) {
          await isolateFailures(
            [deferred],
            async () => {
              const added = await this.variants.handle({
                supplier_id: context.supplier_id,
                product_id: deferred.product_id,
                synced_at: context.synced_at,
                price_types: context.price_types,
                settings: prices,
                offers: deferred.offers,
              });
              context.progress.count("offers", "created", added.created);
              this.report(context, added.errors);
            },
            (item, error) => this.fail(context, item.offers, error),
          );
        }
        if (result.deferred.length)
          await this.publish.handle({
            supplier_id: context.supplier_id,
            publish: context.settings.publish,
            external_ids: result.deferred.map((deferred) => deferred.external_id),
          });
      },
      (group, error) => this.fail(context, group, error),
    );
  }

  private report(context: ImportContext, errors: { external_id: string | null; message: string }[]): void {
    context.progress.count("offers", "failed", errors.length);
    for (const error of errors) {
      context.progress.fail(error.external_id, error.message);
      context.log.warn(`exchange/import: ${error.external_id ?? "—"}: ${error.message}`);
    }
  }

  private fail(context: ImportContext, offers: CMLOffer[], error: Error): void {
    context.progress.count("offers", "failed", offers.length);
    context.progress.fail(offers[0]?.product_external_id ?? null, error.message);
    context.log.error(`exchange/import: товар ${offers[0]?.product_external_id}: ${error.message}`);
  }
}

function groupByProduct(offers: CMLOffer[]): CMLOffer[][] {
  const groups = new Map<string, CMLOffer[]>();
  for (const offer of offers) groups.set(offer.product_external_id, [...(groups.get(offer.product_external_id) ?? []), offer]);
  return [...groups.values()];
}
