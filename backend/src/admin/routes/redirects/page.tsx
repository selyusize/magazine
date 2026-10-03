import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ArrowUturnLeft } from "@medusajs/icons";
import { Button, Container, Heading, Input, Text } from "@medusajs/ui";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { RedirectFormDrawer } from "../../redirects/components/redirect-form-drawer";
import { RedirectsTable } from "../../redirects/components/redirects-table";
import { useRedirectsPage } from "../../redirects/hooks/use-redirects-page";

/** Редиректы витрины: ручные правила, автоматические 301 при смене handle и импорт из CSV. */
const RedirectsPage = () => {
  const { t } = useTranslation();
  const page = useRedirectsPage();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h1">{t("redirects.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("redirects.description")}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void page.importFile(file);
              event.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            size="small"
            isLoading={page.isImporting}
            onClick={() => fileInput.current?.click()}
            title={t("redirects.import.hint")}
          >
            {t("redirects.import.action")}
          </Button>
          <Button size="small" onClick={page.openNew}>
            {t("redirects.create")}
          </Button>
        </div>
      </div>

      <div className="px-6 py-4">
        <Input
          type="search"
          size="small"
          className="max-w-xs"
          placeholder={t("redirects.search")}
          value={page.search}
          onChange={(event) => page.setSearch(event.target.value)}
        />
      </div>

      {page.error ? (
        <Text className="text-ui-fg-error px-6 py-4">{page.error.message}</Text>
      ) : (
        !page.isLoading && (
          <RedirectsTable
            redirects={page.redirects}
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
        <RedirectFormDrawer
          redirect={page.editing === "new" ? null : page.editing}
          onClose={page.closeEditor}
        />
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Редиректы",
  icon: ArrowUturnLeft,
});

export default RedirectsPage;
