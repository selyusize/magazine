import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { texts } from "@shared/query/narrow";
import { toSlug, toUniqueSlug } from "@shared/service/slug/slug";

import { BRAND_MODULE } from "../../../index";
import type { BrandModuleService } from "../../../service/brand-module-service";
import { brandDisplayName, brandKey } from "../../../service/brand-name";
import type { EnsureBrandsByNamesCommand } from "../command";
import type { BrandByNameDTO } from "../dto";

/**
 * Находит бренды магазина по ключу названия (`brandKey`) среди названий и синонимов, недостающие создаёт в этом
 * магазине со свободным в нём slug: бренды и handle других магазинов не мешают. Откат удаляет созданные. Handle
 * выбирается под той же блокировкой, что и в CRUD брендов (`crud-handle:brand`).
 */
export const createMissingBrandsStep = createStep(
  "create-missing-brands",
  async (command: EnsureBrandsByNamesCommand, { container }) => {
    const brands = container.resolve<BrandModuleService>(BRAND_MODULE);
    const names = [...new Set(command.names.map((name) => name.trim()).filter(Boolean))];
    if (!names.length) return new StepResponse<BrandByNameDTO[], string[]>([], []);

    const existing = await brands.listBrands(
      { shop_id: command.shop_id },
      { select: ["id", "name", "synonyms", "handle"] },
    );
    const byKey = new Map<string, string>();
    for (const brand of existing) {
      for (const synonym of texts(brand.synonyms)) byKey.set(brandKey(synonym), brand.id);
      byKey.set(brandKey(brand.name), brand.id);
    }
    const handles = new Set(existing.map((brand) => brand.handle));

    const result: BrandByNameDTO[] = [];
    const created: string[] = [];
    for (const name of names) {
      const key = brandKey(name);
      if (!key) continue;
      const found = byKey.get(key);
      if (found) {
        result.push({ name, brand_id: found, created: false });
        continue;
      }

      const display = brandDisplayName(name);
      const handle = await toUniqueSlug(toSlug(display) || "brand", async (candidate) => handles.has(candidate));
      const brand = await brands.createBrands({ shop_id: command.shop_id, name: display, handle });
      handles.add(handle);
      byKey.set(key, brand.id);
      created.push(brand.id);
      result.push({ name, brand_id: brand.id, created: true });
    }
    return new StepResponse(result, created);
  },
  async (created, { container }) => {
    if (!created?.length) return;
    await container.resolve<BrandModuleService>(BRAND_MODULE).deleteBrands(created);
  },
);
