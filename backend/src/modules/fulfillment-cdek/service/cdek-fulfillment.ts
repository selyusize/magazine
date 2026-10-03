import type {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceDTO,
  Logger,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

import { CDEKClient, type CDEKOptions } from "@shared/service/cdek/cdek-client";
import {
  CarrierFulfillmentService,
  toShippingPrice,
  type CarrierOption,
} from "@shared/service/delivery/carrier-fulfillment";
import type { ParcelDefaults } from "@shared/service/delivery/parcel";

export type CDEKFulfillmentOptions = CDEKOptions & {
  /** Тарифы СДЭК: 136 — склад–склад (до ПВЗ), 137 — склад–дверь. Поставщик сдаёт посылку в пункт СДЭК. */
  tariffs: { pickup: number; door: number };
  parcel: ParcelDefaults;
};

/** Доставка СДЭК: тариф в корзине от города склада отгрузки, до ПВЗ или до двери. */
export class CDEKFulfillmentService extends CarrierFulfillmentService {
  static identifier = "cdek";

  protected readonly carrierName = "СДЭК";
  protected readonly options_: CarrierOption[] = [
    { id: "cdek-pickup", name: "СДЭК — пункт выдачи", pickup: true },
    { id: "cdek-door", name: "СДЭК — курьер", pickup: false },
  ];

  private readonly client: CDEKClient;
  /** Коды городов почти не меняются — не спрашиваем СДЭК на каждый расчёт. */
  private readonly cityCodes = new Map<string, number>();

  constructor(
    { logger }: { logger: Logger },
    private readonly config: CDEKFulfillmentOptions,
  ) {
    super(config.parcel);
    this.client = new CDEKClient(config, logger);
  }

  static validateOptions(options: Partial<CDEKFulfillmentOptions>): void {
    if (!options.base_url || !options.client_id || !options.client_secret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "СДЭК: задайте CDEK_BASE_URL, CDEK_CLIENT_ID, CDEK_CLIENT_SECRET",
      );
    }
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    _data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"],
  ): Promise<CalculatedShippingOptionPrice> {
    const option = this.option(optionData);
    const origin = this.origin(context);
    const destination = this.destination(context, { street: !option.pickup });

    const [fromCityCode, toCityCode] = await Promise.all([
      this.cityCode(origin.city),
      this.cityCode(destination.city),
    ]);

    const tariff = await this.client.calculateTariff({
      tariff_code: option.pickup
        ? this.config.tariffs.pickup
        : this.config.tariffs.door,
      from_city_code: fromCityCode,
      to_city_code: toCityCode,
      to_address: option.pickup ? undefined : destination.street,
      parcel: this.parcel(context),
    });
    return toShippingPrice(tariff.price);
  }

  private async cityCode(name: string): Promise<number> {
    const key = name.trim().toLowerCase();
    const cached = this.cityCodes.get(key);
    if (cached) return cached;

    const city = await this.client.findCity(name);
    if (!city)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `СДЭК не доставляет в «${name}»`,
      );

    this.cityCodes.set(key, city.code);
    return city.code;
  }
}
