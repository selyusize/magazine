import { LookbookView, type LookbookViewProps } from "../ui/lookbook-view";

export type LookbookProps = LookbookViewProps;

/** Лукбук. Фото и тексты — от страницы (metadata товара, коллекция, CMS); без фото ничего не выводится. */
export function Lookbook(props: LookbookProps) {
  return <LookbookView {...props} />;
}
