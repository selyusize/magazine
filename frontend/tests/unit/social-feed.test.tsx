import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SocialFeed, socialFeedMock } from "@widgets/social-feed";

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe("SocialFeed: лента соцсети", () => {
  it("центрированный h2 и внешняя ссылка на каждую публикацию", () => {
    const html = renderToStaticMarkup(<SocialFeed />);
    expect(html).toContain(`<h2 class="p-4 text-600 text-center">${socialFeedMock.title}</h2>`);
    expect(count(html, 'data-slot="social-post"')).toBe(socialFeedMock.items.length);
    expect(count(html, 'rel="noopener noreferrer"')).toBe(socialFeedMock.items.length);
    for (const item of socialFeedMock.items) expect(html).toContain(`alt="${item.image.alt}"`);
  });

  it("ссылки подписаны для скринридеров, иконка декоративная", () => {
    const html = renderToStaticMarkup(<SocialFeed />);
    expect(count(html, "Открыть в Instagram (новая вкладка)")).toBe(socialFeedMock.items.length);
    expect(html).toContain('data-icon="instagram"');
  });

  it("колонки по числу фото, не больше шести", () => {
    expect(renderToStaticMarkup(<SocialFeed />)).toContain("md:grid-cols-5");
    const first = socialFeedMock.items[0]!;
    const many = Array.from({ length: 8 }, (_, i) => ({ ...first, id: `p${i}` }));
    const html = renderToStaticMarkup(<SocialFeed items={many} />);
    expect(html).toContain("md:grid-cols-6");
    expect(count(html, 'data-slot="social-post"')).toBe(6);
  });

  it("пустая лента — секции нет", () => {
    expect(renderToStaticMarkup(<SocialFeed items={[]} />)).toBe("");
  });
});
