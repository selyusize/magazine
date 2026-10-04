import {
  InvalidJSONError,
  isComplete,
  isLocked,
  isVisible,
  toFormValues,
  toRequestBody,
} from "../hooks/form-values";
import type { CRUDField } from "../types";

const FIELDS: CRUDField[] = [
  { name: "title", type: "text", required: true },
  { name: "handle", type: "text" },
  { name: "excerpt", type: "textarea", nullable: true },
  {
    name: "status",
    type: "select",
    options: ["draft", "published"],
    default: "draft",
  },
  { name: "is_active", type: "boolean", default: true },
  { name: "filters", type: "json" },
];

describe("форма CRUD-раздела", () => {
  it("новая запись — значения по умолчанию", () => {
    expect(toFormValues(FIELDS, null)).toEqual({
      title: "",
      handle: "",
      excerpt: "",
      status: "draft",
      is_active: true,
      filters: "",
    });
  });

  it("создание: пустые поля не уходят — handle построит бэкенд", () => {
    const values = { ...toFormValues(FIELDS, null), title: "  Кеды  " };
    expect(toRequestBody(FIELDS, values, null)).toEqual({
      title: "Кеды",
      status: "draft",
      is_active: true,
      filters: {},
    });
  });

  it("изменение: только изменённые поля, очищенный handle — пустая строка, очищенный анонс — null", () => {
    const row = {
      id: "art_1",
      title: "Кеды",
      handle: "kedy",
      excerpt: "Коротко",
      status: "draft",
      is_active: true,
      filters: { brand: ["nike"] },
    };
    const initial = toFormValues(FIELDS, row);
    expect(initial.filters).toBe('{\n  "brand": [\n    "nike"\n  ]\n}');

    expect(
      toRequestBody(FIELDS, { ...initial, title: "Кеды мужские" }, initial),
    ).toEqual({ title: "Кеды мужские" });
    expect(
      toRequestBody(FIELDS, { ...initial, handle: "", excerpt: " " }, initial),
    ).toEqual({
      handle: "",
      excerpt: null,
    });
    expect(toRequestBody(FIELDS, { ...initial, filters: "" }, initial)).toEqual(
      { filters: {} },
    );
  });

  it("некорректный JSON — ошибка с именем поля", () => {
    const values = {
      ...toFormValues(FIELDS, null),
      title: "X",
      filters: "{ brand: nike }",
    };
    expect(() => toRequestBody(FIELDS, values, null)).toThrow(InvalidJSONError);
  });

  it("число: по умолчанию из описания, пустое не отправляется", () => {
    const fields: CRUDField[] = [
      { name: "name", type: "text", required: true },
      { name: "assembly_days", type: "number", default: 1 },
      { name: "rank", type: "number" },
    ];
    const values = toFormValues(fields, null);
    expect(values).toEqual({ name: "", assembly_days: "1", rank: "" });
    expect(toRequestBody(fields, { ...values, name: "Альфа" }, null)).toEqual({
      name: "Альфа",
      assembly_days: 1,
    });

    const initial = toFormValues(fields, {
      id: "sup_1",
      name: "Альфа",
      assembly_days: 3,
      rank: 0,
    });
    expect(initial.rank).toBe("0");
    expect(
      toRequestBody(
        fields,
        { ...initial, assembly_days: "5", rank: "" },
        initial,
      ),
    ).toEqual({
      assembly_days: 5,
    });
  });

  it("обязательные поля", () => {
    expect(isComplete(FIELDS, toFormValues(FIELDS, null))).toBe(false);
    expect(
      isComplete(FIELDS, { ...toFormValues(FIELDS, null), title: "X" }),
    ).toBe(true);
  });
});

describe("поля только для создания и только для показа", () => {
  const SHOP_FIELDS: CRUDField[] = [
    { name: "slug", type: "text", required: true, createOnly: true },
    { name: "name", type: "text", required: true },
    { name: "publishable_api_key", type: "readonly" },
  ];
  const row = {
    id: "shop_1",
    slug: "olisa",
    name: "Olisa",
    publishable_api_key: "pk_1",
  };

  it("создание: slug уходит, показное поле — нет и скрыто", () => {
    const values = {
      ...toFormValues(SHOP_FIELDS, null),
      slug: "snow",
      name: "Snow",
    };
    expect(toRequestBody(SHOP_FIELDS, values, null)).toEqual({
      slug: "snow",
      name: "Snow",
    });
    expect(
      SHOP_FIELDS.filter((field) => isVisible(field, false)).map(
        (field) => field.name,
      ),
    ).toEqual(["slug", "name"]);
  });

  it("изменение: slug заблокирован и не уходит, даже если значение поменялось", () => {
    const initial = toFormValues(SHOP_FIELDS, row);
    expect(initial.publishable_api_key).toBe("pk_1");
    expect(isLocked(SHOP_FIELDS[0], true)).toBe(true);
    expect(isLocked(SHOP_FIELDS[0], false)).toBe(false);

    const values = {
      ...initial,
      slug: "other",
      name: "Olisa 2",
      publishable_api_key: "pk_2",
    };
    expect(toRequestBody(SHOP_FIELDS, values, initial)).toEqual({
      name: "Olisa 2",
    });
  });
});
