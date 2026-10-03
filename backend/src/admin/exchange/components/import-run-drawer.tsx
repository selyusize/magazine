import { Button, Drawer, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import type { ImportRun } from "../hooks/exchange-api";
import { ImportRunStats } from "./import-run-stats";
import { ImportRunStatusBadge } from "./import-run-status-badge";
import { dateTime } from "./date-time";

type ImportRunDrawerProps = {
  run: ImportRun;
  onRetry: (id: string) => void;
  onClose: () => void;
};

/** Карточка запуска: файлы, ход, счётчики, причина сбоя и ошибки по товарам; упавший — повторить. */
export function ImportRunDrawer({ run, onRetry, onClose }: ImportRunDrawerProps) {
  const { t } = useTranslation();
  const row = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[160px_1fr] gap-x-4">
      <Text size="small" className="text-ui-fg-subtle">
        {label}
      </Text>
      <div className="text-ui-fg-base text-sm">{value}</div>
    </div>
  );

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{t("exchange.runs.title")}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          <div className="flex flex-col gap-y-3">
            {row(t("exchange.runs.fields.status"), <ImportRunStatusBadge status={run.status} />)}
            {row(t("exchange.runs.fields.source"), t(`exchange.runs.sources.${run.source}`))}
            {row(t("exchange.runs.fields.created_at"), dateTime(run.created_at))}
            {row(t("exchange.runs.fields.finished_at"), dateTime(run.finished_at))}
            {row(t("exchange.runs.fields.files"), run.files.length ? run.files.join(", ") : "—")}
            {run.status === "running" &&
              row(t("exchange.runs.fields.progress"), `${run.current_file ?? "—"} · ${run.cursor}`)}
            {run.only_changes && row(t("exchange.runs.fields.mode"), t("exchange.runs.onlyChanges"))}
            {row(t("exchange.runs.fields.stats"), <ImportRunStats stats={run.stats} />)}
            {run.message && row(t("exchange.runs.fields.message"), <Text className="text-ui-fg-error">{run.message}</Text>)}
          </div>

          <div className="flex flex-col gap-y-2">
            <Heading level="h3">{t("exchange.runs.errors", { count: run.errors?.length ?? 0 })}</Heading>
            {(run.errors ?? []).length === 0 ? (
              <Text size="small" className="text-ui-fg-subtle">
                {t("exchange.runs.noErrors")}
              </Text>
            ) : (
              <ul className="flex flex-col gap-y-1">
                {(run.errors ?? []).map((error, index) => (
                  <li key={index} className="text-sm">
                    {error.external_id && <span className="font-mono text-ui-fg-subtle">{error.external_id}: </span>}
                    {error.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          {run.status === "failed" && (
            <Button size="small" variant="secondary" onClick={() => onRetry(run.id)}>
              {t("exchange.runs.retry")}
            </Button>
          )}
          <Drawer.Close asChild>
            <Button size="small">{t("exchange.close")}</Button>
          </Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
