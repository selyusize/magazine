import { Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

/** Счётчики запуска строкой: «Товары: создано 3, пропущено 2 · Предложения: …». */
export function ImportRunStats({ stats }: { stats: Record<string, Record<string, number>> }) {
  const { t } = useTranslation();
  const scopes = Object.entries(stats).filter(([, counters]) => Object.keys(counters).length > 0);
  if (!scopes.length) return <Text size="small" className="text-ui-fg-subtle">—</Text>;

  return (
    <Text size="small" className="text-ui-fg-subtle">
      {scopes
        .map(
          ([scope, counters]) =>
            `${t(`exchange.runs.scopes.${scope}`)}: ${Object.entries(counters)
              .map(([counter, value]) => `${t(`exchange.runs.counters.${counter}`)} ${value}`)
              .join(", ")}`,
        )
        .join(" · ")}
    </Text>
  );
}
