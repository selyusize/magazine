import type { MedusaContainer } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

import { Injectable, InjectContainer } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { records, text } from "@shared/query/narrow";
import { SecretBox } from "@shared/service/crypto/secret-box";
import { revalidateURL } from "@shared/service/storefront/storefront-revalidator";

import type { RevalidateSecretDTO } from "./dto";
import type { GetRevalidateSecretByShopIdQuery } from "./query";

/** GET /admin/shops/current/revalidate-secret — адрес вебхука витрины и расшифрованный секрет текущего магазина. */
@Injectable()
export class GetRevalidateSecretByShopIdFetcher extends AbstractFetcher<
  GetRevalidateSecretByShopIdQuery,
  RevalidateSecretDTO
> {
  constructor(
    @InjectContainer() container: MedusaContainer,
    private readonly secrets: SecretBox,
  ) {
    super(container);
  }

  async fetch(query: GetRevalidateSecretByShopIdQuery): Promise<RevalidateSecretDTO> {
    const { data } = await this.graph({
      entity: "shop",
      fields: ["storefront_url", "revalidate_secret"],
      filters: { id: query.shop_id },
    });
    const [shop] = records(data);
    if (!shop) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Магазин ${query.shop_id} не найден`);
    return {
      revalidate_url: revalidateURL(text(shop.storefront_url)),
      revalidate_secret: this.secrets.decrypt(text(shop.revalidate_secret)),
    };
  }
}
