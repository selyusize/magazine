import { isOpaqueKey, snakeToCamel } from "./src/shared/api/case";

/**
 * Переименовывает в OpenAPI-спецификации имена полей схем и query-параметров в camelCase
 * тем же правилом, что использует http.ts в рантайме (src/shared/api/case.ts).
 */
type Node = Record<string, unknown>;

const isObject = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function walk(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(walk);
  if (!isObject(node)) return node;

  const result: Node = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "properties" && isObject(value)) {
      result.properties = Object.fromEntries(
        Object.entries(value).map(([name, schema]) => [
          snakeToCamel(name),
          isOpaqueKey(name) ? schema : walk(schema),
        ]),
      );
    } else if (key === "required" && Array.isArray(value) && isObject(node.properties)) {
      result.required = value.map((name) => (typeof name === "string" ? snakeToCamel(name) : name));
    } else {
      result[key] = walk(value);
    }
  }

  // Параметры запроса: /store/products?regionId=… (http.ts вернёт region_id)
  if (result.in === "query" && typeof result.name === "string") {
    result.name = snakeToCamel(result.name);
  }
  if (isObject(result.discriminator) && typeof result.discriminator.propertyName === "string") {
    result.discriminator = { ...result.discriminator, propertyName: snakeToCamel(result.discriminator.propertyName) };
  }
  return result;
}

export default function camelCaseSpec<T>(spec: T): T {
  return walk(spec) as T;
}
