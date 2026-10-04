import { handleRevalidate } from "@shared/revalidate";

// Вебхук бэкенда: изменение в админке Medusa → теги кэша витрины устаревают (src/shared/revalidate).
export function POST(request: Request) {
  return handleRevalidate(request);
}
