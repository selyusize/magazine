"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("@medusajs/framework/http");
// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
exports.default = (0, http_1.defineMiddlewares)({
    routes: [
        {
            method: ['POST'],
            matcher: '/store/search',
            middlewares: [
                (0, http_1.configureStoreSearch)({
                    allowed_indexes: {
                        product: true,
                    },
                }),
            ],
        },
    ],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL21pZGRsZXdhcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbURBQWtGO0FBRWxGLDZFQUE2RTtBQUM3RSwwRUFBMEU7QUFDMUUsa0JBQWUsSUFBQSx3QkFBaUIsRUFBQztJQUMvQixNQUFNLEVBQUU7UUFDTjtZQUNFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQztZQUNoQixPQUFPLEVBQUUsZUFBZTtZQUN4QixXQUFXLEVBQUU7Z0JBQ1gsSUFBQSwyQkFBb0IsRUFBQztvQkFDbkIsZUFBZSxFQUFFO3dCQUNmLE9BQU8sRUFBRSxJQUFJO3FCQUNkO2lCQUNGLENBQUM7YUFDSDtTQUNGO0tBQ0Y7Q0FDRixDQUFDLENBQUEifQ==