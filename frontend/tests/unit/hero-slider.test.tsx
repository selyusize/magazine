import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeroSlider, heroSlidesMock } from "@widgets/hero-slider";

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe("HeroSlider: баннеры на главной", () => {
  it("все слайды в серверном HTML, видим только первый", () => {
    const html = renderToStaticMarkup(<HeroSlider slides={heroSlidesMock} />);
    for (const slide of heroSlidesMock) expect(html).toContain(slide.title);
    expect(count(html, 'data-slot="hero-slide"')).toBe(heroSlidesMock.length);
    expect(count(html, "inert")).toBe(heroSlidesMock.length - 1);
  });

  it("индикаторы по числу слайдов, текущий отмечен aria-current", () => {
    const html = renderToStaticMarkup(<HeroSlider slides={heroSlidesMock} />);
    expect(count(html, 'aria-label="Слайд ')).toBe(heroSlidesMock.length);
    expect(count(html, 'aria-current="true"')).toBe(1);
  });

  it("с автопрокруткой — кнопка паузы, смена слайдов не озвучивается", () => {
    const html = renderToStaticMarkup(<HeroSlider slides={heroSlidesMock} autoplay={6000} />);
    expect(html).toContain('aria-label="Остановить автопрокрутку"');
    expect(html).toContain('aria-live="off"');
  });

  it("без автопрокрутки — без кнопки паузы, смена слайдов озвучивается", () => {
    const html = renderToStaticMarkup(<HeroSlider slides={heroSlidesMock} />);
    expect(html).not.toContain("автопрокрутку");
    expect(html).toContain('aria-live="polite"');
  });

  it("один слайд — без индикаторов, паузы и inert", () => {
    const html = renderToStaticMarkup(<HeroSlider slides={heroSlidesMock.slice(0, 1)} autoplay={6000} />);
    expect(html).not.toContain('data-slot="hero-slider-controls"');
    expect(html).not.toContain("inert");
  });
});
