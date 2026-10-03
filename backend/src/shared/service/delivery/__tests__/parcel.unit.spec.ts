import { toParcel } from "../parcel";

const defaults = { item_weight: 500, box_side: 20 };

describe("toParcel", () => {
  it("складывает вес с учётом количества, пустой вес — по умолчанию", () => {
    const parcel = toParcel(
      [
        { quantity: 2, weight: 300 },
        { quantity: 1, weight: null },
      ],
      defaults,
    );
    expect(parcel.weight).toBe(2 * 300 + 500);
  });

  it("без габаритов — коробка по умолчанию", () => {
    expect(toParcel([{ quantity: 1, weight: 100 }], defaults)).toEqual({
      weight: 100,
      length: 20,
      width: 20,
      height: 20,
    });
  });

  it("габариты: самая длинная и широкая сторона, высоты складываются", () => {
    const parcel = toParcel(
      [
        { quantity: 2, weight: 100, length: 30, width: 20, height: 5 },
        { quantity: 1, weight: 100, length: 10, width: 40, height: 3 },
        { quantity: 1, weight: 100 },
      ],
      defaults,
    );
    expect(parcel).toEqual({ weight: 400, length: 40, width: 20, height: 13 });
  });
});
