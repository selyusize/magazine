import { planContent, type ProductContent } from "../content-plan";

const content = (overrides: Partial<ProductContent> = {}): ProductContent => ({
  title: "Кеды",
  description: "Описание",
  images: ["/static/1.jpg"],
  category_id: "pcat_1",
  brand_id: "brand_1",
  ...overrides,
});

describe("planContent", () => {
  it("новая карточка без снимка: пишет отличающееся и запоминает всё записанное", () => {
    const plan = planContent({
      next: content({ title: "Кеды новые" }),
      current: content({ title: "Кеды", description: null }),
      imported: {},
      manual_fields: [],
    });

    expect(plan.changes).toEqual({ title: "Кеды новые", description: "Описание" });
    expect(plan.imported).toEqual(content({ title: "Кеды новые" }));
    expect(plan.manual_fields).toEqual([]);
  });

  it("поле правили в админке (карточка ≠ снимку) — уходит под ручное управление и не перезаписывается", () => {
    const plan = planContent({
      next: content({ title: "Кеды от поставщика", description: "Новое описание" }),
      current: content({ title: "Кеды — наше название" }),
      imported: content({ title: "Кеды" }),
      manual_fields: [],
    });

    expect(plan.changes).toEqual({ description: "Новое описание" });
    expect(plan.manual_fields).toEqual(["title"]);
    expect(plan.imported.title).toBe("Кеды");
  });

  it("поле под ручным управлением не трогается, даже если карточка совпала со снимком", () => {
    const plan = planContent({
      next: content({ images: ["/static/2.jpg"] }),
      current: content(),
      imported: content(),
      manual_fields: ["images"],
    });

    expect(plan.changes).toEqual({});
    expect(plan.manual_fields).toEqual(["images"]);
  });

  it("повтор той же выгрузки ничего не пишет", () => {
    const plan = planContent({ next: content(), current: content(), imported: content(), manual_fields: [] });

    expect(plan.changes).toEqual({});
  });

  it("пустое из выгрузки не затирает заполненное", () => {
    const plan = planContent({
      next: content({ description: null, images: [], category_id: null }),
      current: content(),
      imported: content(),
      manual_fields: [],
    });

    expect(plan.changes).toEqual({});
  });
});
