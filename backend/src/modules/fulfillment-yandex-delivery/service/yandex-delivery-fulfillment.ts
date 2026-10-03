import type {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceDTO,
  Logger,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

import {
  CarrierFulfillmentService,
  toShippingPrice,
  type CalculationContext,
  type CarrierOption,
} from "@shared/service/delivery/carrier-fulfillment";
import type { ParcelDefaults } from "@shared/service/delivery/parcel";
import {
  YandexDeliveryClient,
  type YandexDeliveryOptions,
  type YandexDeliveryPoint,
} from "@shared/service/yandex-delivery/yandex-delivery-client";

export type YandexDeliveryFulfillmentOptions = YandexDeliveryOptions & {
  parcel: ParcelDefaults;
};

/**
 * Доставка Яндекс Доставкой (платформа «в другой день»): до ПВЗ Яндекса или курьером.
 * Отправитель — склад отгрузки: `metadata.yandex_station_id` (склад, заведённый в Яндексе), иначе его адрес.
 */
export class YandexDeliveryFulfillmentService extends CarrierFulfillmentService {
  static identifier = "yandex-delivery";

  protected readonly carrierName = "Яндекс Доставка";
  protected readonly options_: CarrierOption[] = [
    {
      id: "yandex-pickup",
      name: "Яндекс Доставка — пункт выдачи",
      pickup: true,
    },
    { id: "yandex-courier", name: "Яндекс Доставка — курьер", pickup: false },
  ];

  private readonly client: YandexDeliveryClient;

  constructor(
    { logger }: { logger: Logger },
    config: YandexDeliveryFulfillmentOptions,
  ) {
    super(config.parcel);
    this.client = new YandexDeliveryClient(config, logger);
  }

  static validateOptions(
    options: Partial<YandexDeliveryFulfillmentOptions>,
  ): void {
    if (!options.base_url || !options.token) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Яндекс Доставка: задайте YANDEX_DELIVERY_BASE_URL и YANDEX_DELIVERY_TOKEN",
      );
    }
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculationContext,
  ): Promise<CalculatedShippingOptionPrice> {
    const option = this.option(optionData);
    const destination = option.pickup
      ? this.pickupPoint(data)
      : this.courierAddress(context);

    const tariff = await this.client.calculateTariff({
      source: this.source(context),
      destination,
      tariff: option.pickup ? "self_pickup" : "time_interval",
      parcel: this.parcel(context),
      assessed_price: this.itemsTotal(context),
    });
    return toShippingPrice(tariff.price);
  }

  private source(context: CalculationContext): YandexDeliveryPoint {
    const stationId = context.from_location?.metadata?.yandex_station_id;
    if (typeof stationId === "string" && stationId)
      return { platform_station_id: stationId };

    const origin = this.origin(context);
    return {
      address: [origin.city, origin.address_1, origin.address_2]
        .filter(Boolean)
        .join(", "),
    };
  }

  /** Цена до ПВЗ зависит от самого пункта — без него посчитать нельзя. */
  private pickupPoint(
    data: CalculateShippingOptionPriceDTO["data"],
  ): YandexDeliveryPoint {
    const pickupPointId = data?.pickup_point_id;
    if (typeof pickupPointId !== "string" || !pickupPointId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Яндекс Доставка: выберите пункт выдачи",
      );
    }
    return { platform_station_id: pickupPointId };
  }

  private courierAddress(context: CalculationContext): YandexDeliveryPoint {
    const { city, street } = this.destination(context, { street: true });
    return { address: `${city}, ${street}` };
  }
}
