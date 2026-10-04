import { Badge, Table, Text, Tooltip } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import type { RevalidationStatus, StorefrontRevalidation } from "../hooks/revalidation-api";

type RevalidationsTableProps = {
  revalidations: StorefrontRevalidation[];
};

const STATUS_COLORS: Record<RevalidationStatus, "green" | "blue" | "orange" | "red"> = {
  sent: "green",
  pending: "blue",
  sending: "orange",
  failed: "red",
};

/** Сколько тегов показать в строке; остальные — во всплывающей подсказке. */
const VISIBLE_TAGS = 4;

const formatTime = (value: string | null) =>
  value ? new Date(value).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "medium" }) : "—";

/** Журнал вебхуков ревалидации: пачка тегов, статус, попытки, ответ витрины. */
export function RevalidationsTable({ revalidations }: RevalidationsTableProps) {
  const { t } = useTranslation();

  if (revalidations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-y-1 px-6 py-10">
        <Text weight="plus">{t("storefrontRevalidation.empty.title")}</Text>
        <Text size="small" className="text-ui-fg-subtle">
          {t("storefrontRevalidation.empty.description")}
        </Text>
      </div>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t("storefrontRevalidation.fields.created")}</Table.HeaderCell>
          <Table.HeaderCell>{t("storefrontRevalidation.fields.status")}</Table.HeaderCell>
          <Table.HeaderCell>{t("storefrontRevalidation.fields.tags")}</Table.HeaderCell>
          <Table.HeaderCell>{t("storefrontRevalidation.fields.attempts")}</Table.HeaderCell>
          <Table.HeaderCell>{t("storefrontRevalidation.fields.result")}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {revalidations.map((row) => (
          <Table.Row key={row.id}>
            <Table.Cell className="whitespace-nowrap">{formatTime(row.created_at)}</Table.Cell>
            <Table.Cell>
              <Badge size="2xsmall" color={STATUS_COLORS[row.status]}>
                {t(`storefrontRevalidation.statuses.${row.status}`)}
              </Badge>
            </Table.Cell>
            <Table.Cell className="max-w-[420px]">
              <Tooltip content={row.tags.join(", ")}>
                <span className="truncate font-mono text-xs">
                  {row.tags.slice(0, VISIBLE_TAGS).join(", ")}
                  {row.tags.length > VISIBLE_TAGS ? ` +${row.tags.length - VISIBLE_TAGS}` : ""}
                </span>
              </Tooltip>
            </Table.Cell>
            <Table.Cell>{row.attempts}</Table.Cell>
            <Table.Cell className="max-w-[320px] truncate">
              {row.status === "sent"
                ? `${row.response_status ?? ""} · ${formatTime(row.sent_at)}`
                : row.error
                  ? `${row.error} · ${t("storefrontRevalidation.nextAttempt", { time: formatTime(row.due_at) })}`
                  : formatTime(row.due_at)}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
