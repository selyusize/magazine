import { Header } from "@widgets/header";
import { AppShell } from "@shared/ui/app-shell";

/**
 * Оформление заказа: только логотип, без навигации, поиска и футера —
 * покупатель не должен уходить со страницы.
 */
export function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell layout="checkout" header={<Header topBar={null} navigation={null} search={null} actions={null} />}>
      {children}
    </AppShell>
  );
}
