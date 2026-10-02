import Link from "next/link";

import { routes } from "@shared/config";
import { Container } from "@shared/ui/container";

export function NotFoundPage() {
  return (
    <Container data-page="not-found">
      <h1>Страница не найдена</h1>
      <Link href={routes.home}>На главную</Link>
    </Container>
  );
}
