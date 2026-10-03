import { Select, Table, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { NONE, usePropertyMapping } from "../hooks/use-exchange-mapping";
import { Empty } from "./group-mapping-section";

/** Свойства поставщика → характеристики магазина; без характеристики значения сохраняются в metadata товара. */
export function PropertyMappingSection({ supplierId }: { supplierId: string }) {
  const { t } = useTranslation();
  const mapping = usePropertyMapping(supplierId);

  if (mapping.error) return <Text className="text-ui-fg-error px-6 py-4">{mapping.error.message}</Text>;
  if (mapping.isLoading) return null;
  if (!mapping.properties.length) return <Empty i18n="exchange.properties" />;

  return (
    <div className="flex flex-col">
      <Text size="small" className="text-ui-fg-subtle px-6 py-4">
        {t("exchange.properties.description")}
      </Text>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t("exchange.properties.fields.name")}</Table.HeaderCell>
            <Table.HeaderCell>{t("exchange.properties.fields.values")}</Table.HeaderCell>
            <Table.HeaderCell className="w-[320px]">{t("exchange.properties.fields.attribute")}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {mapping.properties.map((property) => (
            <Table.Row key={property.id}>
              <Table.Cell>{property.name}</Table.Cell>
              <Table.Cell className="text-ui-fg-subtle max-w-[320px] truncate">
                {Object.values(property.values).slice(0, 5).join(", ") || "—"}
              </Table.Cell>
              <Table.Cell>
                <Select
                  size="small"
                  value={property.attribute_id ?? NONE}
                  onValueChange={(value) => mapping.setAttribute(property.id, value)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value={NONE}>{t("exchange.properties.metadata")}</Select.Item>
                    {mapping.attributes.map((attribute) => (
                      <Select.Item key={attribute.id} value={attribute.id}>
                        {attribute.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
