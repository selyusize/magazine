import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { canShowPromo, isExcludedPath, markPromoShown, markPromoSubscribed, PromoPopupView } from "@widgets/promo-popup";

const content = { title: "−15% на первый заказ", description: "Описание", eyebrow: "Оставьте email" };

describe("PromoPopupView", () => {
  it("закрытый попап не попадает в HTML (SEO, без лишнего h2)", () => {
    const html = renderToStaticMarkup(<PromoPopupView {...content} open={false} onOpenChange={() => {}} />);
    expect(html).toBe("");
  });
});

describe("PromoPopup: пути-исключения", () => {
  it("префикс совпадает только по сегментам", () => {
    expect(isExcludedPath("/cart", ["/cart"])).toBe(true);
    expect(isExcludedPath("/cart/checkout", ["/cart"])).toBe(true);
    expect(isExcludedPath("/cartoons", ["/cart"])).toBe(false);
    expect(isExcludedPath("/", undefined)).toBe(false);
  });
});

describe("PromoPopup: частота показа", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("первый раз — показать, после показа — ждать dismissDays", () => {
    expect(canShowPromo("a", 7)).toBe(true);
    markPromoShown("a");
    expect(canShowPromo("a", 7)).toBe(false);
    expect(canShowPromo("a", 7, Date.now() + 8 * 24 * 60 * 60 * 1000)).toBe(true);
  });

  it("подписавшимся — никогда; новая кампания — снова", () => {
    markPromoSubscribed("a");
    expect(canShowPromo("a", 0, Date.now() + 1e12)).toBe(false);
    expect(canShowPromo("b", 7)).toBe(true);
  });

  it("localStorage недоступен — показываем, без ошибок", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("denied");
        },
        setItem: () => {
          throw new Error("denied");
        },
      },
    });
    expect(() => markPromoShown("a")).not.toThrow();
    expect(canShowPromo("a", 7)).toBe(true);
  });
});
