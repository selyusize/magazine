import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CollectionBanners, lookbookBannersMock } from "@widgets/collection-banners";
import { TextBlock, textBlockMock, toParagraphs } from "@widgets/text-block";

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe("TextBlock: текстовая секция", () => {
  it("по умолчанию — h2 с текстом макета, секция подписана заголовком", () => {
    const html = renderToStaticMarkup(<TextBlock />);
    expect(html).toMatch(new RegExp(`<h2 id="([^"]+)" class="text-900">${textBlockMock.title}</h2>`));
    const headingId = html.match(/<h2 id="([^"]+)"/)?.[1];
    expect(html).toContain(`aria-labelledby="${headingId}"`);
    expect(html).toContain('data-tone="surface"');
  });

  it("уровень заголовка задаётся пропом", () => {
    expect(renderToStaticMarkup(<TextBlock headingLevel={1} />)).toContain("<h1");
    expect(renderToStaticMarkup(<TextBlock headingLevel={3} />)).toContain("<h3");
  });

  it("строка из CMS делится на абзацы по пустым строкам", () => {
    expect(toParagraphs("Первый.\n\n  Второй.\n \n\nТретий.")).toEqual(["Первый.", "Второй.", "Третий."]);
    expect(toParagraphs(["  а ", "", "б"])).toEqual(["а", "б"]);
    const html = renderToStaticMarkup(<TextBlock text={"Раз.\n\nДва."} />);
    expect(count(html, "<p>")).toBe(2);
  });

  it("ссылка-действие и пустой блок", () => {
    const html = renderToStaticMarkup(<TextBlock action={{ label: "О бренде", href: "/about" }} />);
    expect(html).toContain('href="/about"');
    expect(renderToStaticMarkup(<TextBlock title="" text="" />)).toBe("");
  });
});

describe("CollectionBanners: скрытый заголовок", () => {
  it("h2 остаётся в HTML для поисковиков, но визуально скрыт", () => {
    const html = renderToStaticMarkup(
      <CollectionBanners title={lookbookBannersMock.title} titleHidden items={lookbookBannersMock.items} />,
    );
    expect(html).toContain(`<h2 class="sr-only">${lookbookBannersMock.title}</h2>`);
    expect(count(html, 'data-slot="collection-banner"')).toBe(2);
    expect(html).toContain("md:grid-cols-2");
  });
});
