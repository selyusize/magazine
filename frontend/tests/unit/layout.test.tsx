import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppShell } from "@shared/ui/app-shell";
import { Container } from "@shared/ui/container";
import { Footer } from "@widgets/footer";
import { Header } from "@widgets/header";

function render(node: ReactNode) {
  const html = renderToStaticMarkup(node);
  return { html, has: (slot: string) => html.includes(`data-slot="${slot}"`) };
}

describe("AppShell: каркас страницы", () => {
  it("header / main / footer в landmark-тегах, main с id для skip-link", () => {
    const { html } = render(
      <AppShell header="H" footer="F">
        content
      </AppShell>,
    );
    expect(html).toContain('<header data-slot="app-header">H</header>');
    expect(html).toContain('<main id="main" data-slot="app-main">content</main>');
    expect(html).toContain('<footer data-slot="app-footer">F</footer>');
    expect(html).toContain('href="#main"');
  });

  it("без header / footer — соответствующих тегов нет", () => {
    const { html } = render(<AppShell footer={null}>content</AppShell>);
    expect(html).not.toContain("<header");
    expect(html).not.toContain("<footer");
    expect(html).toContain("<main");
  });

  it("вариант лайаута и липкий хедер отражаются в data-атрибутах", () => {
    const { html } = render(
      <AppShell layout="checkout" header="H" stickyHeader>
        x
      </AppShell>,
    );
    expect(html).toContain('data-layout="checkout"');
    expect(html).toContain('data-sticky="true"');
  });

  it("Container: размер по умолчанию и свой", () => {
    expect(render(<Container>x</Container>).html).toContain('data-size="default"');
    expect(render(<Container size="full">x</Container>).html).toContain('data-size="full"');
  });
});

describe("Header: регионы по умолчанию, скрытие и замена", () => {
  it("по умолчанию — все регионы, каждый пустой div", () => {
    expect(render(<Header />).html).toBe(
      "<div><div></div><div><div></div><div></div><div></div><div></div></div></div>",
    );
  });

  it("null скрывает регион (минимальный хедер оформления заказа)", () => {
    expect(render(<Header topBar={null} navigation={null} search={null} actions={null} />).html).toBe(
      "<div><div><div></div></div></div>",
    );
  });

  it("свой элемент заменяет стандартный регион", () => {
    const { html } = render(<Header topBar={null} logo={<span>logo</span>} search={null} />);
    expect(html).toBe("<div><div><span>logo</span><div></div><div></div></div></div>");
  });
});

describe("Footer: регионы по умолчанию, скрытие и замена", () => {
  it("по умолчанию — все регионы, каждый пустой div", () => {
    expect(render(<Footer />).html).toBe("<div><div><div></div><div></div><div></div></div><div></div></div>");
  });

  it("регионы скрываются через null и заменяются своими", () => {
    expect(render(<Footer columns={null} socials={null} contacts={<span>contacts</span>} />).html).toBe(
      "<div><div><span>contacts</span></div><div></div></div>",
    );
  });
});
