/** Настройки обмена из src/container/common/exchange.ts — классы получают их параметром конструктора. */
export type ExchangeOptions = {
  /** `file_limit` для 1С, байт. */
  file_limit: number;
  /** Товаров (предложений) в пачке-транзакции. */
  batch_size: number;
  /** Запуск без отметки «жив» дольше — завис; столько же живёт блокировка поставщика, мин. */
  stalled_after_minutes: number;
};

/** Обёртка над настройками: по типу её находит контейнер (автосборка классов, которым нужны настройки). */
export class ExchangeConfig {
  constructor(readonly options: ExchangeOptions) {}
}
