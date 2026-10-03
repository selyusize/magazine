import { findMissingRequirements, publishError } from "../publish-requirements";

const complete = {
  title: "Кроссовки",
  handle: "krossovki",
  has_main_category: true,
  has_image: true,
  has_price: true,
  has_offer: true,
};

describe("findMissingRequirements", () => {
  it("полная карточка проходит", () => {
    expect(findMissingRequirements(complete)).toEqual([]);
  });

  it("перечисляет всё недостающее по порядку", () => {
    expect(
      findMissingRequirements({
        title: "  ",
        handle: null,
        has_main_category: false,
        has_image: false,
        has_price: false,
        has_offer: false,
      }),
    ).toEqual(["title", "handle", "main_category", "image", "price", "offer"]);
  });
});

describe("publishError", () => {
  it("400 с названиями товаров и недостающим по-русски", () => {
    const error = publishError([
      { title: "Кроссовки", missing: ["main_category", "offer"] },
    ]);
    expect(error.type).toBe("invalid_data");
    expect(error.message).toContain(
      "«Кроссовки» — нет: основная категория, предложение поставщика",
    );
  });
});
