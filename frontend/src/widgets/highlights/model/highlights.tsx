import { HighlightsView, type HighlightsViewProps } from "../ui/highlights-view";

export type HighlightsProps = HighlightsViewProps;

/** Блок особенностей. Данные — от страницы (metadata товара, конфиг, CMS); пусто — ничего не выводится. */
export function Highlights(props: HighlightsProps) {
  return <HighlightsView {...props} />;
}
