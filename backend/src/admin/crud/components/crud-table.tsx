import { EllipsisHorizontal, PencilSquare, Trash } from "@medusajs/icons";
import { Badge, DropdownMenu, IconButton, Table, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { PAGE_SIZE } from "../hooks/use-crud-page";
import type { CRUDColumn, CRUDResource, CRUDRow } from "../types";
import { isRecord } from "../../lib/narrow";

type CRUDTableProps = {
  resource: CRUDResource;
  rows: CRUDRow[];
  count: number;
  pageIndex: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  previousPage: () => void;
  nextPage: () => void;
  onEdit: (row: CRUDRow) => void;
  onDelete: (row: CRUDRow) => void;
};

const valueAt = (row: CRUDRow, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (value, part) => (isRecord(value) ? value[part] : undefined),
      row,
    );

function Cell({ column, row }: { column: CRUDColumn; row: CRUDRow }) {
  const { t } = useTranslation();
  const value = valueAt(row, column.key);

  switch (column.kind) {
    case "boolean":
      return (
        <Badge size="2xsmall" color={value ? "green" : "grey"}>
          {t(value ? "crud.yes" : "crud.no")}
        </Badge>
      );
    case "badge":
      return <Badge size="2xsmall">{String(value ?? "—")}</Badge>;
    case "mono":
      return <span className="font-mono">{String(value ?? "—")}</span>;
    default:
      return <>{String(value ?? "—")}</>;
  }
}

/** Таблица раздела по колонкам из описания ресурса. */
export function CRUDTable(props: CRUDTableProps) {
  const { t } = useTranslation();
  const { resource } = props;

  if (props.rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-y-1 px-6 py-10">
        <Text weight="plus">{t(`${resource.i18n}.empty.title`)}</Text>
        <Text size="small" className="text-ui-fg-subtle">
          {t(`${resource.i18n}.empty.description`)}
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Table>
        <Table.Header>
          <Table.Row>
            {resource.columns.map((column) => (
              <Table.HeaderCell key={column.key}>
                {t(`${resource.i18n}.fields.${column.key}`)}
              </Table.HeaderCell>
            ))}
            {resource.storefrontPath && (
              <Table.HeaderCell>{t("crud.storefrontPath")}</Table.HeaderCell>
            )}
            <Table.HeaderCell className="w-px" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {props.rows.map((row) => (
            <Table.Row key={row.id}>
              {resource.columns.map((column) => (
                <Table.Cell key={column.key} className="max-w-[280px] truncate">
                  <Cell column={column} row={row} />
                </Table.Cell>
              ))}
              {resource.storefrontPath && (
                <Table.Cell className="text-ui-fg-subtle max-w-[320px] truncate font-mono">
                  {resource.storefrontPath(row) ?? "—"}
                </Table.Cell>
              )}
              <Table.Cell>
                <DropdownMenu>
                  <DropdownMenu.Trigger asChild>
                    <IconButton
                      size="small"
                      variant="transparent"
                      aria-label={t("crud.actions")}
                    >
                      <EllipsisHorizontal />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item
                      className="gap-x-2"
                      onClick={() => props.onEdit(row)}
                    >
                      <PencilSquare className="text-ui-fg-subtle" />
                      {t("crud.edit")}
                    </DropdownMenu.Item>
                    {resource.canDelete !== false && (
                      <DropdownMenu.Item
                        className="gap-x-2"
                        onClick={() => props.onDelete(row)}
                      >
                        <Trash className="text-ui-fg-subtle" />
                        {t("crud.delete.action")}
                      </DropdownMenu.Item>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Table.Pagination
        count={props.count}
        pageSize={PAGE_SIZE}
        pageIndex={props.pageIndex}
        pageCount={props.pageCount}
        canPreviousPage={props.canPreviousPage}
        canNextPage={props.canNextPage}
        previousPage={props.previousPage}
        nextPage={props.nextPage}
        translations={{
          of: t("crud.pagination.of"),
          results: t("crud.pagination.results"),
          pages: t("crud.pagination.pages"),
          prev: t("crud.pagination.prev"),
          next: t("crud.pagination.next"),
        }}
      />
    </div>
  );
}
