import type { CMLRecord } from "../commerceml/reader";
import type { CMLOffer, CMLProduct } from "../commerceml/types";
import { batchRecords, type RecordBatch } from "../record-batches";

const cmlProduct = (external_id: string): CMLProduct => ({
  external_id,
  name: external_id,
  description: null,
  sku: null,
  barcode: null,
  group_ids: [],
  images: [],
  manufacturer: null,
  properties: [],
  requisites: [],
  deleted: false,
});
const cmlOffer = (external_id: string): CMLOffer => ({
  external_id,
  product_external_id: external_id.split("#")[0],
  name: null,
  sku: null,
  barcode: null,
  characteristics: [],
  prices: [],
  quantity: null,
  deleted: false,
});
const product = (id: string): CMLRecord => ({ kind: "product", product: cmlProduct(id) });
const offer = (id: string): CMLRecord => ({ kind: "offer", offer: cmlOffer(id) });

async function* from(records: CMLRecord[]) {
  yield* records;
}

const collect = async (records: CMLRecord[], options = { batch_size: 2, skip: 0 }) => {
  const batches: RecordBatch[] = [];
  for await (const batch of batchRecords(from(records), options)) batches.push(batch);
  return batches;
};

const summary = (batches: RecordBatch[]) =>
  batches.map((batch) =>
    batch.kind === "products"
      ? `products:${batch.products.map((item) => item.external_id).join(",")}@${batch.position}`
      : batch.kind === "offers"
        ? `offers:${batch.offers.map((item) => item.external_id).join(",")}@${batch.position}`
        : batch.kind,
  );

describe("batchRecords", () => {
  it("классификатор — одним куском перед товарами, товары — пачками с курсором", async () => {
    const batches = await collect([
      { kind: "groups", groups: [{ external_id: "g", parent_external_id: null, name: "G" }] },
      { kind: "properties", properties: [] },
      { kind: "package", only_changes: false },
      product("a"),
      product("b"),
      product("c"),
    ]);

    expect(summary(batches)).toEqual(["package", "classifier", "products:a,b@2", "products:c@3"]);
  });

  it("предложения одного товара не разрываются между пачками", async () => {
    const batches = await collect([offer("a#1"), offer("a#2"), offer("a#3"), offer("b#1"), offer("c#1")]);

    expect(summary(batches)).toEqual(["offers:a#1,a#2,a#3@3", "offers:b#1,c#1@5"]);
  });

  it("продолжение после падения: первые skip записей пропускаются, курсор считается от начала файла", async () => {
    const batches = await collect([product("a"), product("b"), product("c")], { batch_size: 2, skip: 2 });

    expect(summary(batches)).toEqual(["products:c@3"]);
  });
});
