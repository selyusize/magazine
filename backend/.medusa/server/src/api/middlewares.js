"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("@medusajs/framework/http");
const middleware_1 = require("./1c/exchange/[supplier]/middleware");
const middleware_2 = require("./admin/articles/middleware");
const middleware_3 = require("./admin/attributes/middleware");
const middleware_4 = require("./admin/brands/middleware");
const middleware_5 = require("./admin/filter-pages/middleware");
const middleware_6 = require("./admin/import-runs/middleware");
const middleware_7 = require("./admin/products/[id]/attributes/middleware");
const middleware_8 = require("./admin/products/[id]/catalog/middleware");
const middleware_9 = require("./admin/redirects/middleware");
const middleware_10 = require("./admin/redirects/import/middleware");
const middleware_11 = require("./admin/supplier-offers/middleware");
const middleware_12 = require("./admin/suppliers/middleware");
const middleware_13 = require("./store/delivery/points/middleware");
const middleware_14 = require("./store/redirects/resolve/middleware");
exports.default = (0, http_1.defineMiddlewares)({
    routes: [
        // The product index declares filterable `status` and `sales_channel_ids`, so
        // the route narrows it to published products in the key's sales channels.
        {
            method: ["POST"],
            matcher: "/store/search",
            middlewares: [
                (0, http_1.configureStoreSearch)({
                    allowed_indexes: {
                        product: true,
                    },
                }),
            ],
        },
        ...middleware_1.exchangeWith1CMiddleware,
        ...middleware_13.storeDeliveryPointsMiddleware,
        ...middleware_14.storeRedirectsResolveMiddleware,
        ...middleware_9.adminRedirectsMiddleware,
        ...middleware_10.adminRedirectsImportMiddleware,
        ...middleware_4.adminBrandsMiddleware,
        ...middleware_2.adminArticlesMiddleware,
        ...middleware_5.adminFilterPagesMiddleware,
        ...middleware_12.adminSuppliersMiddleware,
        ...middleware_6.adminExchangeMiddleware,
        ...middleware_11.adminSupplierOffersMiddleware,
        ...middleware_3.adminAttributesMiddleware,
        ...middleware_8.adminProductCatalogMiddleware,
        ...middleware_7.adminProductAttributesMiddleware,
    ],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL21pZGRsZXdhcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbURBR2tDO0FBRWxDLG9FQUErRTtBQUMvRSw0REFBc0U7QUFDdEUsOERBQTBFO0FBQzFFLDBEQUFrRTtBQUNsRSxnRUFBNkU7QUFDN0UsK0RBQXlFO0FBQ3pFLDRFQUErRjtBQUMvRix5RUFBeUY7QUFDekYsNkRBQXdFO0FBQ3hFLHFFQUFxRjtBQUNyRixvRUFBbUY7QUFDbkYsOERBQXdFO0FBQ3hFLG9FQUFtRjtBQUNuRixzRUFBdUY7QUFFdkYsa0JBQWUsSUFBQSx3QkFBaUIsRUFBQztJQUMvQixNQUFNLEVBQUU7UUFDTiw2RUFBNkU7UUFDN0UsMEVBQTBFO1FBQzFFO1lBQ0UsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDO1lBQ2hCLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLFdBQVcsRUFBRTtnQkFDWCxJQUFBLDJCQUFvQixFQUFDO29CQUNuQixlQUFlLEVBQUU7d0JBQ2YsT0FBTyxFQUFFLElBQUk7cUJBQ2Q7aUJBQ0YsQ0FBQzthQUNIO1NBQ0Y7UUFDRCxHQUFHLHFDQUF3QjtRQUMzQixHQUFHLDJDQUE2QjtRQUNoQyxHQUFHLDZDQUErQjtRQUNsQyxHQUFHLHFDQUF3QjtRQUMzQixHQUFHLDRDQUE4QjtRQUNqQyxHQUFHLGtDQUFxQjtRQUN4QixHQUFHLG9DQUF1QjtRQUMxQixHQUFHLHVDQUEwQjtRQUM3QixHQUFHLHNDQUF3QjtRQUMzQixHQUFHLG9DQUF1QjtRQUMxQixHQUFHLDJDQUE2QjtRQUNoQyxHQUFHLHNDQUF5QjtRQUM1QixHQUFHLDBDQUE2QjtRQUNoQyxHQUFHLDZDQUFnQztLQUNwQztDQUNGLENBQUMsQ0FBQyJ9