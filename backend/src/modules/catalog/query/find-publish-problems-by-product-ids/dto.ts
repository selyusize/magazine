import type { PublishRequirement } from "../../service/publish-requirements";

/** Опубликованный товар, которому не хватает обязательных полей. */
export type PublishProblemDTO = {
  product_id: string;
  title: string;
  missing: PublishRequirement[];
};
