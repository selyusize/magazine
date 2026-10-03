import { StatusBadge } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import type { ImportRunStatus } from "../hooks/exchange-api";

const COLORS = {
  receiving: "grey",
  queued: "grey",
  running: "blue",
  done: "green",
  failed: "red",
} as const;

export function ImportRunStatusBadge({ status }: { status: ImportRunStatus }) {
  const { t } = useTranslation();
  return <StatusBadge color={COLORS[status]}>{t(`exchange.runs.statuses.${status}`)}</StatusBadge>;
}
