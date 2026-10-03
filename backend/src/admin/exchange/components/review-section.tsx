import { Badge, Table, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { REVIEW_PAGE_SIZE, useExchangeReviewTab } from "../hooks/use-exchange-review";
import { Empty } from "./group-mapping-section";

/** Очередь «требует разбора»: товары поставщика без категории, фото, цены или предложения. */
export function ReviewSection({ supplierId }: { supplierId: string }) {
  const { t } = useTranslation();
  const review = useExchangeReviewTab(supplierId);

  if (review.error) return <Text className="text-ui-fg-error px-6 py-4">{review.error.message}</Text>;
  if (review.isLoading) return null;

  return (
    <div className="flex flex-col">
      {review.unmappedGroups > 0 && (
        <Text size="small" className="text-ui-fg-subtle px-6 py-4">
          {t("exchange.review.unmappedGroups", { count: review.unmappedGroups })}
        </Text>
      )}
      {review.products.length === 0 ? (
        <Empty i18n="exchange.review" />
      ) : (
        <>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("exchange.review.fields.title")}</Table.HeaderCell>
                <Table.HeaderCell>{t("exchange.review.fields.external_id")}</Table.HeaderCell>
                <Table.HeaderCell>{t("exchange.review.fields.problems")}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {review.products.map((product) => (
                <Table.Row key={product.external_id}>
                  <Table.Cell>
                    {product.product_id ? (
                      <Link className="text-ui-fg-interactive" to={`/products/${product.product_id}`}>
                        {product.title}
                      </Link>
                    ) : (
                      product.title
                    )}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-ui-fg-subtle">{product.external_id}</Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-1">
                      {product.problems.map((problem) => (
                        <Badge key={problem} size="2xsmall" color="orange">
                          {t(`exchange.review.problems.${problem}`)}
                        </Badge>
                      ))}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <Table.Pagination
            count={review.count}
            pageSize={REVIEW_PAGE_SIZE}
            pageIndex={review.pageIndex}
            pageCount={review.pageCount}
            canPreviousPage={review.canPreviousPage}
            canNextPage={review.canNextPage}
            previousPage={review.previousPage}
            nextPage={review.nextPage}
            translations={{
              of: t("crud.pagination.of"),
              results: t("crud.pagination.results"),
              pages: t("crud.pagination.pages"),
              prev: t("crud.pagination.prev"),
              next: t("crud.pagination.next"),
            }}
          />
        </>
      )}
    </div>
  );
}
