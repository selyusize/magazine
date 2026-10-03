import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import type { AdminRedirectDTO, AdminRedirectsPageDTO } from "./dto";
import type { GetRedirectsForAdminQuery } from "./query";

const ADMIN_REDIRECT_FIELDS = [
  "id",
  "from_path",
  "to_path",
  "code",
  "entity_type",
  "entity_id",
  "updated_at",
];

const toAdminRedirectDTO = (redirect: AdminRedirectDTO): AdminRedirectDTO => ({
  id: redirect.id,
  from_path: redirect.from_path,
  to_path: redirect.to_path,
  code: redirect.code,
  entity_type: redirect.entity_type,
  entity_id: redirect.entity_id,
  updated_at: new Date(redirect.updated_at),
});

/** Страница правил для админки, свежие сверху — GET /admin/redirects. */
@Injectable()
export class GetRedirectsForAdminFetcher extends AbstractFetcher<
  GetRedirectsForAdminQuery,
  AdminRedirectsPageDTO
> {
  async fetch(
    query: GetRedirectsForAdminQuery,
  ): Promise<AdminRedirectsPageDTO> {
    const pattern = query.q ? `%${query.q.replace(/[%_\\]/g, "\\$&")}%` : null;

    const { data, metadata } = await this.graph({
      entity: "redirect",
      fields: ADMIN_REDIRECT_FIELDS,
      filters: pattern
        ? {
            $or: [
              { from_path: { $ilike: pattern } },
              { to_path: { $ilike: pattern } },
            ],
          }
        : {},
      pagination: {
        skip: query.offset,
        take: query.limit,
        order: { updated_at: "DESC" },
      },
    });
    return {
      redirects: data.map(toAdminRedirectDTO),
      count: metadata?.count ?? data.length,
    };
  }
}
