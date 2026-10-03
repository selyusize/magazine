import {
  configureStoreSearch,
  defineMiddlewares,
} from "@medusajs/framework/http";

import { exchangeWith1CMiddleware } from "./1c/exchange/[supplier]/middleware";
import { adminArticlesMiddleware } from "./admin/articles/middleware";
import { adminAttributesMiddleware } from "./admin/attributes/middleware";
import { adminBrandsMiddleware } from "./admin/brands/middleware";
import { adminFilterPagesMiddleware } from "./admin/filter-pages/middleware";
import { adminExchangeMiddleware } from "./admin/import-runs/middleware";
import { adminProductAttributesMiddleware } from "./admin/products/[id]/attributes/middleware";
import { adminProductCatalogMiddleware } from "./admin/products/[id]/catalog/middleware";
import { adminRedirectsMiddleware } from "./admin/redirects/middleware";
import { adminRedirectsImportMiddleware } from "./admin/redirects/import/middleware";
import { adminSupplierOffersMiddleware } from "./admin/supplier-offers/middleware";
import { adminSuppliersMiddleware } from "./admin/suppliers/middleware";
import { storeDeliveryPointsMiddleware } from "./store/delivery/points/middleware";
import { storeRedirectsResolveMiddleware } from "./store/redirects/resolve/middleware";

export default defineMiddlewares({
  routes: [
    // The product index declares filterable `status` and `sales_channel_ids`, so
    // the route narrows it to published products in the key's sales channels.
    {
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    ...exchangeWith1CMiddleware,
    ...storeDeliveryPointsMiddleware,
    ...storeRedirectsResolveMiddleware,
    ...adminRedirectsMiddleware,
    ...adminRedirectsImportMiddleware,
    ...adminBrandsMiddleware,
    ...adminArticlesMiddleware,
    ...adminFilterPagesMiddleware,
    ...adminSuppliersMiddleware,
    ...adminExchangeMiddleware,
    ...adminSupplierOffersMiddleware,
    ...adminAttributesMiddleware,
    ...adminProductCatalogMiddleware,
    ...adminProductAttributesMiddleware,
  ],
});
