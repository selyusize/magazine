import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeaderNavigation } from "@widgets/header/ui/header-navigation";

describe("Хедер: пункт с меню", () => {
  it("пункт верхнего уровня — ссылка на раздел и при этом триггер меню", () => {
    const html = renderToStaticMarkup(
      <HeaderNavigation
        items={[{ label: "Каталог", href: "/catalog", children: [{ label: "Платья", href: "/catalog/dresses" }] }]}
      />,
    );
    expect(html).toMatch(/<a[^>]*data-slot="navigation-menu-trigger"[^>]*href="\/catalog"|<a[^>]*href="\/catalog"[^>]*data-slot="navigation-menu-trigger"/);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toMatch(/<button[^>]*navigation-menu-trigger/);
  });
});
