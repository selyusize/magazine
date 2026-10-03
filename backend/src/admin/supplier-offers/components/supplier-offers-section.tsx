import { EllipsisHorizontal, PencilSquare, Trash } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  DropdownMenu,
  Heading,
  IconButton,
  Table,
  Text,
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useSupplierOffersSection } from "../hooks/use-supplier-offers-section";
import { SupplierOfferFormDrawer } from "./supplier-offer-form-drawer";

type SupplierOffersSectionProps = {
  productId: string;
  variants: { id: string; title: string }[];
};

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 2,
});

/** Предложения поставщиков по вариантам товара: одна карточка — несколько поставщиков. */
export function SupplierOffersSection({
  productId,
  variants,
}: SupplierOffersSectionProps) {
  const { t } = useTranslation();
  const section = useSupplierOffersSection(productId);

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h2">{t("supplierOffers.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("supplierOffers.description", { count: section.totalQuantity })}
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={section.openNew}>
          {t("crud.create")}
        </Button>
      </div>

      {section.error ? (
        <Text className="text-ui-fg-error px-6 py-4">
          {section.error.message}
        </Text>
      ) : section.rows.length === 0 ? (
        !section.isLoading && (
          <Text size="small" className="text-ui-fg-subtle px-6 py-4">
            {t("supplierOffers.empty")}
          </Text>
        )
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                {t("supplierOffers.fields.supplier")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {t("supplierOffers.fields.variant")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {t("supplierOffers.fields.sku")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {t("supplierOffers.fields.purchase_price")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {t("supplierOffers.fields.quantity")}
              </Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {section.rows.map((offer) => (
              <Table.Row key={offer.id}>
                <Table.Cell>
                  <div className="flex items-center gap-x-2">
                    {offer.supplier_name}
                    {!offer.supplier_is_active && (
                      <Badge size="2xsmall" color="grey">
                        {t("supplierOffers.inactive")}
                      </Badge>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>{offer.variant_title}</Table.Cell>
                <Table.Cell>
                  <span className="font-mono">{offer.sku ?? "—"}</span>
                </Table.Cell>
                <Table.Cell>
                  {offer.purchase_price === null
                    ? "—"
                    : money.format(offer.purchase_price)}
                </Table.Cell>
                <Table.Cell>{offer.quantity}</Table.Cell>
                <Table.Cell className="text-right">
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <IconButton size="small" variant="transparent">
                        <EllipsisHorizontal />
                      </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item
                        className="gap-x-2"
                        onClick={() => section.openEdit(offer)}
                      >
                        <PencilSquare className="text-ui-fg-subtle" />
                        {t("crud.edit")}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="gap-x-2"
                        onClick={() => section.remove(offer)}
                      >
                        <Trash className="text-ui-fg-subtle" />
                        {t("crud.delete.action")}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {section.editing && (
        <SupplierOfferFormDrawer
          productId={productId}
          variants={variants}
          offer={section.editing === "new" ? null : section.editing}
          onClose={section.closeEditor}
        />
      )}
    </Container>
  );
}
