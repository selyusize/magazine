/** Перевозчики с пунктами выдачи; совпадает с идентификатором провайдера доставки. */
export const DELIVERY_PROVIDERS = ["cdek", "yandex-delivery"] as const;
export type DeliveryProvider = (typeof DELIVERY_PROVIDERS)[number];

/** Пункт выдачи для карты на витрине. `id` уходит в data способа доставки как `pickup_point_id`. */
export type PickupPointDTO = {
  id: string;
  provider: DeliveryProvider;
  name: string;
  type: "pickup_point" | "postamat" | "post_office";
  address: string;
  city: string;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  work_time: string | null;
  phone: string | null;
};
