import { Footer } from "@widgets/footer";
import { Header } from "@widgets/header";
import { siteConfig } from "@shared/config";
import { AppShell } from "@shared/ui/app-shell";

/** Основной лайаут витрины: полный хедер и футер. */
export function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell layout="shop" stickyHeader={siteConfig.header.sticky} header={<Header />} footer={<Footer />}>
      {children}
    </AppShell>
  );
}
