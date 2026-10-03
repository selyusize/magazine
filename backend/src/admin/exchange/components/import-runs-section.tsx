import { ArrowPath } from "@medusajs/icons";
import { Button, Table, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import type { ExchangeSupplier } from "../hooks/exchange-api";
import { RUNS_PAGE_SIZE, useImportRunsTab } from "../hooks/use-import-runs";
import { dateTime } from "./date-time";
import { ImportRunDrawer } from "./import-run-drawer";
import { ImportRunStats } from "./import-run-stats";
import { ImportRunStatusBadge } from "./import-run-status-badge";

/** История импортов поставщика: статус, источник, счётчики; клик — карточка запуска с ошибками. */
export function ImportRunsSection({ supplier }: { supplier: ExchangeSupplier }) {
  const { t } = useTranslation();
  const runs = useImportRunsTab(supplier);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {t("exchange.runs.description")}
        </Text>
        {runs.canPull && (
          <Button size="small" variant="secondary" onClick={runs.pull} isLoading={runs.isPulling}>
            <ArrowPath />
            {t("exchange.runs.pull")}
          </Button>
        )}
      </div>

      {runs.error ? (
        <Text className="text-ui-fg-error px-6 py-4">{runs.error.message}</Text>
      ) : runs.isLoading ? null : runs.runs.length === 0 ? (
        <div className="flex flex-col items-center gap-y-1 px-6 py-10">
          <Text weight="plus">{t("exchange.runs.empty.title")}</Text>
          <Text size="small" className="text-ui-fg-subtle">
            {t("exchange.runs.empty.description")}
          </Text>
        </div>
      ) : (
        <>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("exchange.runs.fields.created_at")}</Table.HeaderCell>
                <Table.HeaderCell>{t("exchange.runs.fields.source")}</Table.HeaderCell>
                <Table.HeaderCell>{t("exchange.runs.fields.status")}</Table.HeaderCell>
                <Table.HeaderCell>{t("exchange.runs.fields.stats")}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {runs.runs.map((run) => (
                <Table.Row key={run.id} className="cursor-pointer" onClick={() => runs.open(run.id)}>
                  <Table.Cell>{dateTime(run.created_at)}</Table.Cell>
                  <Table.Cell>{t(`exchange.runs.sources.${run.source}`)}</Table.Cell>
                  <Table.Cell>
                    <ImportRunStatusBadge status={run.status} />
                  </Table.Cell>
                  <Table.Cell className="max-w-[480px] whitespace-normal">
                    <ImportRunStats stats={run.stats} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <Table.Pagination
            count={runs.count}
            pageSize={RUNS_PAGE_SIZE}
            pageIndex={runs.pageIndex}
            pageCount={runs.pageCount}
            canPreviousPage={runs.canPreviousPage}
            canNextPage={runs.canNextPage}
            previousPage={runs.previousPage}
            nextPage={runs.nextPage}
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

      {runs.opened && <ImportRunDrawer run={runs.opened} onRetry={runs.retry} onClose={runs.close} />}
    </div>
  );
}
