import { connection } from "next/server";

import { getProducts } from "@shared/api";
import { Container } from "@shared/ui/container";

export async function HomePage() {
  // Рендер на каждый запрос: при сборке образа бэкенд недоступен.
  // Позже заменим на "use cache" + cacheTag вместе с включением cacheComponents.
  await connection();

  const { products } = await getProducts({ limit: 12, fields: "id,title,handle,thumbnail" });

  return (
    <Container data-page="home">
      <h1>Magazine</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.title}</li>
        ))}
      </ul>
    </Container>
  );
}
