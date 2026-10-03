import {
  toAttributeFormValues,
  toAttributeValuesBody,
} from "../hooks/attribute-form-values";
import type { Attribute } from "../hooks/product-attributes-api";

const ATTRIBUTES: Attribute[] = [
  {
    id: "attr_material",
    name: "Материал",
    handle: "material",
    type: "string",
    unit: null,
  },
  {
    id: "attr_power",
    name: "Мощность",
    handle: "power",
    type: "number",
    unit: "Вт",
  },
];

describe("форма характеристик товара", () => {
  it("значения товара через «;», значения вариантов не попадают в форму", () => {
    expect(
      toAttributeFormValues(ATTRIBUTES, [
        {
          id: "1",
          attribute_id: "attr_material",
          variant_id: null,
          value: "Сталь",
        },
        {
          id: "2",
          attribute_id: "attr_material",
          variant_id: null,
          value: "Стекло",
        },
        {
          id: "3",
          attribute_id: "attr_power",
          variant_id: "variant_1",
          value: "2000",
        },
      ]),
    ).toEqual({ attr_material: "Сталь; Стекло", attr_power: "" });
  });

  it("тело: строка делится по «;», число — целиком (запятая — дробная часть), пустые пропускаются", () => {
    expect(
      toAttributeValuesBody(ATTRIBUTES, {
        attr_material: " Сталь ;; Стекло ",
        attr_power: "1,5",
      }),
    ).toEqual([
      { attribute_id: "attr_material", value: "Сталь" },
      { attribute_id: "attr_material", value: "Стекло" },
      { attribute_id: "attr_power", value: "1,5" },
    ]);
    expect(toAttributeValuesBody(ATTRIBUTES, { attr_material: " " })).toEqual(
      [],
    );
  });
});
