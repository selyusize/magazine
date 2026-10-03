import type { DeliveryProvider } from "./dto";

export type GetPickupPointsByCityQuery = {
  provider: DeliveryProvider;
  /** Название города, как его ввёл покупатель: «Москва». */
  city: string;
};
