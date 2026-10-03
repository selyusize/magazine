import { Select, Table, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { toGroupRows } from "../hooks/group-tree";
import { NONE, useGroupMapping } from "../hooks/use-exchange-mapping";

/** Группы поставщика → категории магазина. Подгруппа без категории наследует её от предка. */
export function GroupMappingSection({ supplierId }: { supplierId: string }) {
  const { t } = useTranslation();
  const mapping = useGroupMapping(supplierId);
  const rows = toGroupRows(mapping.groups);

  if (mapping.error) return <Text className="text-ui-fg-error px-6 py-4">{mapping.error.message}</Text>;
  if (mapping.isLoading) return null;
  if (!rows.length) return <Empty i18n="exchange.groups" />;

  return (
    <div className="flex flex-col">
      <Text size="small" className="text-ui-fg-subtle px-6 py-4">
        {t("exchange.groups.description")}
      </Text>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t("exchange.groups.fields.name")}</Table.HeaderCell>
            <Table.HeaderCell className="w-[320px]">{t("exchange.groups.fields.category")}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((group) => (
            <Table.Row key={group.id}>
              <Table.Cell>
                <span style={{ paddingLeft: group.depth * 20 }}>{group.name}</span>
              </Table.Cell>
              <Table.Cell>
                <Select
                  size="small"
                  value={group.category_id ?? NONE}
                  onValueChange={(value) => mapping.setCategory(group.id, value)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value={NONE}>
                      {group.inherited_category
                        ? t("exchange.groups.inherited", { name: group.inherited_category })
                        : t("exchange.mapping.none")}
                    </Select.Item>
                    {mapping.categories.map((category) => (
                      <Select.Item key={category.id} value={category.id}>
                        {category.name}
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

export function Empty({ i18n }: { i18n: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-y-1 px-6 py-10">
      <Text weight="plus">{t(`${i18n}.empty.title`)}</Text>
      <Text size="small" className="text-ui-fg-subtle">
        {t(`${i18n}.empty.description`)}
      </Text>
    </div>
  );
}
