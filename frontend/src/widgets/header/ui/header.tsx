import { siteConfig } from "@shared/config";
import { resolveSlot, type Slot } from "@shared/lib/slot";

import { HeaderActions } from "./header-actions";
import { HeaderLogo } from "./header-logo";
import { HeaderNavigation } from "./header-navigation";
import { HeaderSearch } from "./header-search";
import { HeaderTopBar } from "./header-top-bar";

/**
 * Каждый регион: не передан — стандартный компонент, `null` — скрыт, свой элемент — вместо стандартного.
 *
 * @example Минимальный хедер оформления заказа
 * <Header topBar={null} navigation={null} search={null} actions={null} />
 */
export type HeaderProps = {
  topBar?: Slot;
  logo?: Slot;
  navigation?: Slot;
  search?: Slot;
  actions?: Slot;
};

export function Header({ topBar, logo, navigation, search, actions }: HeaderProps) {
  return (
    <div>
      {resolveSlot(topBar, () => (siteConfig.header.topBar ? <HeaderTopBar /> : null))}
      <div>
        {resolveSlot(logo, () => <HeaderLogo />)}
        {resolveSlot(navigation, () => <HeaderNavigation />)}
        {resolveSlot(search, () => (siteConfig.header.search ? <HeaderSearch /> : null))}
        {resolveSlot(actions, () => <HeaderActions />)}
      </div>
    </div>
  );
}
