import { ImportRunProgress, MAX_RUN_ERRORS } from "../import-run-progress";
import { isolateFailures } from "../isolate-failures";
import { orderPackageFiles } from "../package-files";

describe("orderPackageFiles", () => {
  it("только XML вне import_files, каталог раньше предложений, номера по порядку", () => {
    expect(
      orderPackageFiles([
        "offers0_1.xml",
        "import0_10.xml",
        "rests0_1.xml",
        "import_files/ab/1.jpg",
        "import_files/x.xml",
        "import0_2.xml",
        "prices0_1.xml",
        "package.zip",
        "custom.xml",
      ]),
    ).toEqual(["import0_2.xml", "import0_10.xml", "offers0_1.xml", "prices0_1.xml", "rests0_1.xml", "custom.xml"]);
  });
});

describe("ImportRunProgress", () => {
  it("копит счётчики и ошибки, хранит последние MAX_RUN_ERRORS", () => {
    const progress = new ImportRunProgress({ stats: {}, errors: [], current_file: null, cursor: 0 });
    progress.at("import.xml", 3);
    progress.count("products", "created", 2);
    progress.count("products", "created");
    progress.count("offers", "failed", 0);
    for (let i = 0; i <= MAX_RUN_ERRORS; i++) progress.fail(`p${i}`, "ошибка");

    const snapshot = progress.snapshot();
    expect(snapshot).toEqual(
      expect.objectContaining({ current_file: "import.xml", cursor: 3, stats: { products: { created: 3 } } }),
    );
    expect(snapshot.errors).toHaveLength(MAX_RUN_ERRORS);
    expect(snapshot.errors![0].external_id).toBe("p1");
    expect(progress.hasOffers()).toBe(false);
    progress.count("offers", "zeroed");
    expect(progress.hasOffers()).toBe(false);
    progress.count("offers", "received");
    expect(progress.hasOffers()).toBe(true);
  });

  it("продолжение после падения: прошлые файлы пропускаются, текущий — с позиции", () => {
    const files = ["import.xml", "offers.xml", "rests.xml"];
    const progress = new ImportRunProgress({ stats: {}, errors: [], current_file: "offers.xml", cursor: 200 });

    expect(progress.resumeFrom("import.xml", files)).toBe("skip");
    expect(progress.resumeFrom("offers.xml", files)).toBe(200);
    expect(progress.resumeFrom("rests.xml", files)).toBe(0);
    expect(new ImportRunProgress({ stats: {}, errors: [], current_file: null, cursor: 0 }).resumeFrom("import.xml", files)).toBe(0);
  });
});

describe("isolateFailures", () => {
  it("пачка упала — по одной; падающая сама по себе запись — в onError", async () => {
    const written: number[][] = [];
    const failed: number[] = [];
    await isolateFailures(
      [1, 2, 3],
      async (items) => {
        if (items.includes(2)) throw new Error("битая");
        written.push(items);
      },
      (item) => failed.push(item),
    );

    expect(written).toEqual([[1], [3]]);
    expect(failed).toEqual([2]);
  });
});
