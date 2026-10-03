import { EllipsisHorizontal, PencilSquare, Trash } from "@medusajs/icons";
import { Badge, DropdownMenu, IconButton, Table, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import type { AdminRedirect } from "../hooks/redirects-api";
import { PAGE_SIZE } from "../hooks/use-redirects-page";

type RedirectsTableProps = {
  redirects: AdminRedirect[];
  count: number;
  pageIndex: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  previousPage: () => void;
  nextPage: () => void;
  onEdit: (redirect: AdminRedirect) => void;
  onDelete: (redirect: AdminRedirect) => void;
};

const CODE_COLORS = { 301: "green", 302: "blue", 410: "red" } as const;

export function RedirectsTable(props: RedirectsTableProps) {
  const { t } = useTranslation();

  if (props.redirects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-y-1 px-6 py-10">
        <Text weight="plus">{t("redirects.empty.title")}</Text>
        <Text size="small" className="text-ui-fg-subtle">
          {t("redirects.empty.description")}
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t("redirects.fields.from")}</Table.HeaderCell>
            <Table.HeaderCell>{t("redirects.fields.to")}</Table.HeaderCell>
            <Table.HeaderCell>{t("redirects.fields.code")}</Table.HeaderCell>
            <Table.HeaderCell>{t("redirects.fields.source")}</Table.HeaderCell>
            <Table.HeaderCell className="w-px" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {props.redirects.map((redirect) => (
            <Table.Row key={redirect.id}>
              <Table.Cell className="max-w-[320px] truncate font-mono">
                {redirect.from_path}
              </Table.Cell>
              <Table.Cell className="max-w-[320px] truncate font-mono">
                {redirect.to_path ?? "—"}
              </Table.Cell>
              <Table.Cell>
                <Badge size="2xsmall" color={CODE_COLORS[redirect.code]}>
                  {redirect.code}
                </Badge>
              </Table.Cell>
              <Table.Cell className="text-ui-fg-subtle">
                {redirect.entity_type
                  ? t(`redirects.entities.${redirect.entity_type}`)
                  : t("redirects.manual")}
              </Table.Cell>
              <Table.Cell>
                <DropdownMenu>
                  <DropdownMenu.Trigger asChild>
                    <IconButton
                      size="small"
                      variant="transparent"
                      aria-label={t("redirects.actions")}
                    >
                      <EllipsisHorizontal />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item
                      className="gap-x-2"
                      onClick={() => props.onEdit(redirect)}
                    >
                      <PencilSquare className="text-ui-fg-subtle" />
                      {t("redirects.edit")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="gap-x-2"
                      onClick={() => props.onDelete(redirect)}
                    >
                      <Trash className="text-ui-fg-subtle" />
                      {t("redirects.delete.action")}
                    </DropdownMenu.Item>
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
          of: t("redirects.pagination.of"),
          results: t("redirects.pagination.results"),
          pages: t("redirects.pagination.pages"),
          prev: t("redirects.pagination.prev"),
          next: t("redirects.pagination.next"),
        }}
      />
    </div>
  );
}
