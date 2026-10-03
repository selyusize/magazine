import { Button, Container, Heading, Input, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useCRUDPage } from "../hooks/use-crud-page";
import type { CRUDResource } from "../types";
import { CRUDFormDrawer } from "./crud-form-drawer";
import { CRUDTable } from "./crud-table";

/** Страница раздела целиком: заголовок, поиск, таблица, шторка формы. Страница в `routes/` — одна строка. */
export function CRUDPage({ resource }: { resource: CRUDResource }) {
  const { t } = useTranslation();
  const page = useCRUDPage(resource);

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h1">{t(`${resource.i18n}.title`)}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t(`${resource.i18n}.description`)}
          </Text>
        </div>
        <Button size="small" onClick={page.openNew}>
          {t("crud.create")}
        </Button>
      </div>

      <div className="px-6 py-4">
        <Input
          type="search"
          size="small"
          className="max-w-xs"
          placeholder={t("crud.search")}
          value={page.search}
          onChange={(event) => page.setSearch(event.target.value)}
        />
      </div>

      {page.error ? (
        <Text className="text-ui-fg-error px-6 py-4">{page.error.message}</Text>
      ) : (
        !page.isLoading && (
          <CRUDTable
            resource={resource}
            rows={page.rows}
            count={page.count}
            pageIndex={page.pageIndex}
            pageCount={page.pageCount}
            canPreviousPage={page.canPreviousPage}
            canNextPage={page.canNextPage}
            previousPage={page.previousPage}
            nextPage={page.nextPage}
            onEdit={page.openEdit}
            onDelete={page.remove}
          />
        )
      )}

      {page.editing && (
        <CRUDFormDrawer
          resource={resource}
          row={page.editing === "new" ? null : page.editing}
          onClose={page.closeEditor}
        />
      )}
    </Container>
  );
}
