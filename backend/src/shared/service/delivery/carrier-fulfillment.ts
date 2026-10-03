import type {
  CalculateShippingOptionPriceDTO,
  CreateFulfillmentResult,
  FulfillmentOption,
  StockLocationAddressDTO,
} from "@medusajs/framework/types";
import {
  AbstractFulfillmentProviderService,
  MedusaError,
} from "@medusajs/framework/utils";

import { toParcel, type Parcel, type ParcelDefaults } from "./parcel";

export type CarrierOption = FulfillmentOption & {
  id: string;
  name: string;
  /** До пункта выдачи — витрина должна передать `pickup_point_id` в data способа доставки. */
  pickup: boolean;
};

export type CalculationContext = CalculateShippingOptionPriceDTO["context"];

/** Адрес покупателя: витрина заполняет его до выбора способа доставки. */
export type DestinationAddress = {
  city: string;
  /** Улица, дом, квартира — без города. */
  street: string;
  postal_code: string | null;
};

/**
 * Общая часть провайдеров перевозчиков: список способов, проверка выбранного ПВЗ, посылка из корзины,
 * адреса склада и покупателя. Отправление у перевозчика пока не создаётся — это этап 15 (заказ уходит
 * поставщику); fulfillment в админке проходит без запроса к перевозчику.
 */
export abstract class CarrierFulfillmentService extends AbstractFulfillmentProviderService {
  protected abstract readonly carrierName: string;
  protected abstract readonly options_: CarrierOption[];

  constructor(protected readonly parcelDefaults: ParcelDefaults) {
    super();
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return this.options_.map(({ id, name, pickup }) => ({
      id,
      name,
      pickup,
      is_return: false,
    }));
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return this.options_.some((option) => option.id === data.id);
  }

  async canCalculate(): Promise<boolean> {
    return true;
  }

  /** При выборе способа в корзине: для ПВЗ нужен `pickup_point_id`, остальное отбрасываем. */
  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const option = this.option(optionData);
    if (!option.pickup) return {};

    const pickupPointId = data?.pickup_point_id;
    if (typeof pickupPointId !== "string" || !pickupPointId.trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `${this.carrierName}: выберите пункт выдачи`,
      );
    }
    return { pickup_point_id: pickupPointId.trim() };
  }

  async createFulfillment(
    data: Record<string, unknown>,
  ): Promise<CreateFulfillmentResult> {
    return { data, labels: [] };
  }

  async cancelFulfillment(): Promise<Record<string, never>> {
    return {};
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] };
  }

  protected option(optionData: Record<string, unknown>): CarrierOption {
    const option = this.options_.find((item) => item.id === optionData.id);
    if (!option) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `${this.carrierName}: неизвестный способ «${optionData.id}»`,
      );
    }
    return option;
  }

  protected parcel(context: CalculationContext): Parcel {
    return toParcel(
      (context.items ?? []).map((item) => ({
        quantity: Number(item.quantity),
        weight: item.variant?.weight,
        length: item.variant?.length,
        width: item.variant?.width,
        height: item.variant?.height,
      })),
      this.parcelDefaults,
    );
  }

  /** Стоимость товаров в корзине, ₽ — объявленная ценность посылки. */
  protected itemsTotal(context: CalculationContext): number {
    return (context.items ?? []).reduce(
      (total, item) => total + Number(item.unit_price) * Number(item.quantity),
      0,
    );
  }

  /** Откуда везём: адрес склада отгрузки (у поставщика — его виртуальный склад). */
  protected origin(
    context: CalculationContext,
  ): StockLocationAddressDTO & { city: string } {
    const address = context.from_location?.address;
    if (!address?.city) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `${this.carrierName}: у склада отгрузки «${context.from_location?.name ?? "?"}» не указан город`,
      );
    }
    return address as StockLocationAddressDTO & { city: string };
  }

  /** Куда везём: город обязателен всегда, улица — только для курьера. */
  protected destination(
    context: CalculationContext,
    { street }: { street: boolean },
  ): DestinationAddress {
    const address = context.shipping_address;
    const city = address?.city?.trim();
    if (!city)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Укажите город доставки",
      );

    const line = [address?.address_1, address?.address_2]
      .filter(Boolean)
      .join(", ")
      .trim();
    if (street && !line)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Укажите улицу и дом для курьера",
      );

    return { city, street: line, postal_code: address?.postal_code || null };
  }
}

/** Цена для витрины — целые рубли вверх, с НДС (перевозчики считают с НДС). */
export const toShippingPrice = (price: number) => ({
  calculated_amount: Math.ceil(price),
  is_calculated_price_tax_inclusive: true,
});
