import type { ReactNode } from "react";

import { SearchPanel } from "@features/product-search";
import { routes, siteConfig } from "@shared/config";

import { hitArea } from "../ui/classes";
import { HeaderLayout, type HeaderVariant } from "../ui/header-layout";
import { HeaderLogo } from "../ui/header-logo";
import { HeaderMobileMenu } from "../ui/header-mobile-menu";
import { HeaderNavigation } from "../ui/header-navigation";
import { HeaderSearch } from "../ui/header-search";
import { HeaderTopBar } from "../ui/header-top-bar";
import { HeaderActions } from "./header-actions";

const { header, search: searchConfig } = siteConfig;

// Действия, скрытые на мобильных, переезжают в мобильное меню
const menuLinks = header.actions.filter((action) => !action.mobile).map(({ label, href }) => ({ label, href }));

/**
 * Каждый регион: не передан — стандартный компонент с данными из siteConfig, `null` — скрыт,
 * свой элемент — вместо стандартного. Раскладка (variant) по умолчанию тоже из siteConfig.
 *
 * @example Минимальный хедер оформления заказа
 * <Header topBar={null} menu={null} navigation={null} search={null} actions={null} />
 *
 * @example Своя навигация и поле поиска вместо иконки
 * <Header navigation={<HeaderNavigation items={promoLinks} />} search={<HeaderSearch variant="field" action={routes.search()} />} />
 *
 * @example Панель поиска с шестью колонками результатов
 * <Header search={<SearchPanel {...siteConfig.search} columns={6} previewLimit={6} />} />
 */
export type HeaderProps = {
  variant?: HeaderVariant;
  topBar?: ReactNode;
  /** Кнопка мобильного меню (на md и шире скрыта) */
  menu?: ReactNode;
  logo?: ReactNode;
  navigation?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
};

/** Поиск по варианту из конфига: панель под хедером, ссылка-иконка или поле. Без siteConfig.search — нет поиска */
function defaultSearch() {
  if (!header.search || !searchConfig) return null;
  if (header.search.variant === "panel") {
    return <SearchPanel {...searchConfig} triggerClassName={hitArea} />;
  }
  return (
    <HeaderSearch
      variant={header.search.variant}
      action={routes.search()}
      label={searchConfig.label}
      placeholder={searchConfig.placeholder}
    />
  );
}

// Значения по умолчанию срабатывают только для undefined — переданный null скрывает регион
export function Header({
  variant = header.variant,
  topBar = header.topBar && <HeaderTopBar {...header.topBar} />,
  menu = (header.navigation.length > 0 || menuLinks.length > 0) && (
    <HeaderMobileMenu navigation={header.navigation} links={menuLinks} />
  ),
  logo = <HeaderLogo {...siteConfig.logo} alt={siteConfig.name} href={routes.home} />,
  navigation = header.navigation.length > 0 && <HeaderNavigation items={header.navigation} />,
  search = defaultSearch(),
  actions = header.actions.length > 0 && <HeaderActions items={header.actions} />,
}: HeaderProps) {
  return (
    <HeaderLayout
      variant={variant}
      topBar={topBar}
      menu={menu}
      logo={logo}
      navigation={navigation}
      search={search}
      actions={actions}
    />
  );
}
