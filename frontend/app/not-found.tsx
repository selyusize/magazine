import { ShopLayout } from "@app/layouts";
import { NotFoundPage } from "@pages/not-found";

// Глобальная 404 рендерится вне route groups — оборачиваем в лайаут магазина явно
export default function NotFound() {
  return (
    <ShopLayout>
      <NotFoundPage />
    </ShopLayout>
  );
}
