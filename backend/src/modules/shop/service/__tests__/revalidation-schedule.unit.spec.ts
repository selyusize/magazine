import { RevalidationSchedule } from "../revalidation-schedule";
import { groupBatchesByShop, revalidationLockKey } from "../storefront-revalidation";

const schedule = new RevalidationSchedule({
  window_ms: 3_000,
  max_wait_ms: 30_000,
  retry_delays_ms: [10_000, 60_000],
  tag_limit: 2,
  stale_sending_ms: 300_000,
  keep_days: 7,
});

const at = (seconds: number) => new Date(Date.UTC(2026, 9, 4, 12, 0, seconds));

describe("RevalidationSchedule.dueAt", () => {
  it.each([
    ["первое событие — через окно", 0, 0, 3],
    ["новое событие сдвигает срок на окно", 0, 10, 13],
    ["потолок от первого события", 0, 28, 30],
    ["события идут дольше потолка — срок не растёт", 0, 59, 30],
  ])("%s", (_, first, now, due) => {
    expect(schedule.dueAt({ now: at(now), first_queued_at: at(first) })).toEqual(at(due));
  });
});

describe("RevalidationSchedule.retryDelay", () => {
  it.each([
    [0, null],
    [1, 10_000],
    [2, 60_000],
    [3, null],
  ])("после %i неудач → %p", (attempts, delay) => {
    expect(schedule.retryDelay(attempts)).toBe(delay);
  });
});

describe("RevalidationSchedule.delayUntil", () => {
  it("остаток до срока, прошедший срок — 0", () => {
    expect(schedule.delayUntil({ now: at(1), due_at: at(3) })).toBe(2_000);
    expect(schedule.delayUntil({ now: at(5), due_at: at(3) })).toBe(0);
  });
});

describe("RevalidationSchedule.mergeTags", () => {
  it("предел тегов сущностей — из настроек", () => {
    expect(schedule.mergeTags(["product:a"], ["product:b"])).toEqual(["product:a", "product:b"]);
    expect(schedule.mergeTags(["product:a"], ["product:b", "product:c"])).toEqual(["products"]);
  });
});

describe("groupBatchesByShop", () => {
  it("теги одного магазина — в одну пачку, пустые пачки отбрасываются", () => {
    expect(
      groupBatchesByShop([
        { shop_id: "a", tags: ["products", "product:x"] },
        { shop_id: "b", tags: [] },
        { shop_id: "a", tags: ["products", "sitemap"] },
      ]),
    ).toEqual([{ shop_id: "a", tags: ["product:x", "products", "sitemap"] }]);
  });
});

describe("revalidationLockKey", () => {
  it("блокировка — на магазин", () => {
    expect(revalidationLockKey("shop_1")).toBe("storefront-revalidation:shop_1");
  });
});
