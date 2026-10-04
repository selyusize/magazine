import type { StorefrontRevalidationStatus } from "../../entity/storefront-revalidation";

/** Запись журнала отправок вебхука ревалидации. */
export type StorefrontRevalidationDTO = {
  id: string;
  tags: string[];
  status: StorefrontRevalidationStatus;
  attempts: number;
  due_at: Date;
  sent_at: Date | null;
  response_status: number | null;
  error: string | null;
  created_at: Date;
};
