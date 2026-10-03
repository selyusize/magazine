import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { cartItemsTotal, lineOptions, MiniCartView, toCartLines, type MiniCartViewProps } from "@features/mini-cart";
import { cartItemCount } from "@entities/cart";
import type { StoreCart, StoreCartLineItem } from "@shared/api";
import { siteConfig, type ProductOptionConfig } from "@shared/config";

const options: ProductOptionConfig[] = [
  { option: "Color", type: "color", labels: { Beige: "Бежевый" } },
  { option: "Size", type: "button" },
];

const line = (item: Partial<StoreCartLineItem>) =>
  ({ id: "l1", title: "Title", quantity: 1, unitPrice: 1000, ...item }) as StoreCartLineItem;

const cart = (items: StoreCartLineItem[]) => ({ currencyCode: "rub", itemTotal: 39_600, items }) as StoreCart;

describe("Корзина: строки шторки", () => {
  it("опции — из названия варианта с подписями из конфига; вариант по умолчанию не показывается", () => {
    expect(lineOptions(line({ variantTitle: "Beige / M" }), options)).toBe("Бежевый / M");
    expect(lineOptions(line({ variantTitle: "Apricot / Large" }), options)).toBe("Apricot / Large");
    expect(lineOptions(line({ variantTitle: "Default variant" }), options)).toBeUndefined();
    expect(lineOptions(line({}), options)).toBeUndefined();
  });

  it("порядок добавления, ссылка на вариант, сумма строки из total", () => {
    const lines = toCartLines(
      cart([
        line({ id: "b", createdAt: "2026-10-02", productTitle: "Кардиган", productHandle: "cardigan", variantId: "v2", total: 29_800, quantity: 2, thumbnail: "/b.jpg" }),
        line({ id: "a", createdAt: "2026-10-01", title: "Свитер" }),
      ]),
      options,
    );
    expect(lines.map((item) => item.id)).toEqual(["a", "b"]);
    expect(lines[1]).toMatchObject({
      title: "Кардиган",
      href: "/products/cardigan?variant=v2",
      image: { src: "/b.jpg", alt: "Кардиган" },
      quantity: 2,
    });
    expect(lines[1]?.price.replace(/\s/g, " ")).toBe("29 800 ₽");
    // Без total — цена × количество; без handle — без ссылки
    expect(lines[0]).toMatchObject({ title: "Свитер", href: undefined, image: undefined });
    expect(lines[0]?.price.replace(/\s/g, " ")).toBe("1 000 ₽");
  });

  it("счётчик — сумма штук, итог — сумма товаров", () => {
    expect(cartItemCount(null)).toBe(0);
    expect(cartItemCount(cart([line({ quantity: 2 }), line({ quantity: 3 })]))).toBe(5);
    expect(cartItemsTotal(cart([])).replace(/\s/g, " ")).toBe("39 600 ₽");
  });
});

describe("Корзина: шторка", () => {
  const props: MiniCartViewProps = {
    ...siteConfig.cart!,
    checkoutHref: "/checkout",
    trigger: <button type="button">Корзина</button>,
    open: false,
    onOpenChange: () => {},
    loading: false,
    lines: [],
    total: undefined,
    busy: false,
    pendingLineId: undefined,
    onQuantityChange: () => {},
    onRemove: () => {},
  };

  it("закрытая шторка: в HTML только кнопка-триггер", () => {
    const html = renderToStaticMarkup(<MiniCartView {...props} />);
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain(siteConfig.cart!.checkoutLabel);
  });
});
