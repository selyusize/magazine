"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("@medusajs/framework/http");
const middleware_1 = require("./admin/redirects/middleware");
const middleware_2 = require("./admin/redirects/import/middleware");
const middleware_3 = require("./store/delivery/points/middleware");
const middleware_4 = require("./store/redirects/resolve/middleware");
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
        ...middleware_3.storeDeliveryPointsMiddleware,
        ...middleware_4.storeRedirectsResolveMiddleware,
        ...middleware_1.adminRedirectsMiddleware,
        ...middleware_2.adminRedirectsImportMiddleware,
    ],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL21pZGRsZXdhcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbURBR2tDO0FBRWxDLDZEQUF3RTtBQUN4RSxvRUFBcUY7QUFDckYsbUVBQW1GO0FBQ25GLHFFQUF1RjtBQUV2RixrQkFBZSxJQUFBLHdCQUFpQixFQUFDO0lBQy9CLE1BQU0sRUFBRTtRQUNOLDZFQUE2RTtRQUM3RSwwRUFBMEU7UUFDMUU7WUFDRSxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDaEIsT0FBTyxFQUFFLGVBQWU7WUFDeEIsV0FBVyxFQUFFO2dCQUNYLElBQUEsMkJBQW9CLEVBQUM7b0JBQ25CLGVBQWUsRUFBRTt3QkFDZixPQUFPLEVBQUUsSUFBSTtxQkFDZDtpQkFDRixDQUFDO2FBQ0g7U0FDRjtRQUNELEdBQUcsMENBQTZCO1FBQ2hDLEdBQUcsNENBQStCO1FBQ2xDLEdBQUcscUNBQXdCO1FBQzNCLEdBQUcsMkNBQThCO0tBQ2xDO0NBQ0YsQ0FBQyxDQUFDIn0=