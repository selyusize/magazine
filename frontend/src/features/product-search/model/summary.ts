import type { SearchConfig } from "@shared/config";
import { plural } from "@shared/lib/plural";

/** «13 товаров» — подпись над результатами */
export const formatCount = (count: number, forms: SearchConfig["countForms"]) => `${count} ${plural(count, forms)}`;

/** Текст «ничего не найдено» с подставленным запросом */
export const formatEmpty = (template: string, query: string) => template.replaceAll("{query}", query);
