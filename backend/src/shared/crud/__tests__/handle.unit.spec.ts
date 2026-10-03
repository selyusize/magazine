import { resolveHandle, type ResolveHandleInput } from "../handle";

const taken =
  (...handles: string[]) =>
  async (candidate: string) =>
    handles.includes(candidate);

const input = (overrides: Partial<ResolveHandleInput>): ResolveHandleInput => ({
  requested: undefined,
  title: "Кроссовки Nike",
  current: null,
  scope_changed: false,
  fallback: "brand-abc123",
  isTaken: taken(),
  ...overrides,
});

describe("resolveHandle", () => {
  it("при создании строит slug из названия и делает его уникальным", async () => {
    expect(await resolveHandle(input({}))).toBe("krossovki-nike");
    expect(
      await resolveHandle(
        input({ isTaken: taken("krossovki-nike", "krossovki-nike-2") }),
      ),
    ).toBe("krossovki-nike-3");
  });

  it("пустой handle — тоже из названия, без букв в названии — запасной", async () => {
    expect(await resolveHandle(input({ requested: "" }))).toBe(
      "krossovki-nike",
    );
    expect(await resolveHandle(input({ title: "!!!" }))).toBe("brand-abc123");
  });

  it("явный handle приводит к slug, занятый — ошибка, а не суффикс", async () => {
    expect(await resolveHandle(input({ requested: "Найк Air" }))).toBe(
      "nayk-air",
    );
    await expect(
      resolveHandle(input({ requested: "nike", isTaken: taken("nike") })),
    ).rejects.toThrow("Адрес «nike» уже занят");
  });

  it("при изменении без handle адрес не меняется, даже если сменилось название", async () => {
    expect(
      await resolveHandle(input({ current: "nike", title: "Nike Inc." })),
    ).toBeNull();
  });

  it("тот же handle при изменении — ничего не меняем и не считаем занятым самим собой", async () => {
    expect(
      await resolveHandle(
        input({ current: "nike", requested: "Nike", isTaken: taken("nike") }),
      ),
    ).toBeNull();
  });

  it("сменилась категория посадочной, а адрес в ней занят — суффикс", async () => {
    expect(
      await resolveHandle(input({ current: "nike", scope_changed: true })),
    ).toBeNull();
    expect(
      await resolveHandle(
        input({ current: "nike", scope_changed: true, isTaken: taken("nike") }),
      ),
    ).toBe("nike-2");
    await expect(
      resolveHandle(
        input({
          current: "nike",
          requested: "nike",
          scope_changed: true,
          isTaken: taken("nike"),
        }),
      ),
    ).rejects.toThrow("уже занят");
  });
});
