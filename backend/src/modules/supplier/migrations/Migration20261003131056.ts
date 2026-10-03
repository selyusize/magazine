import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261003131056 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "supplier_offer" drop constraint if exists "supplier_offer_supplier_id_external_id_unique";`,
    );
    this.addSql(
      `create table if not exists "supplier" ("id" text not null, "name" text not null, "contact_name" text null, "phone" text null, "email" text null, "order_email" text null, "order_api_url" text null, "ship_city" text not null, "ship_address" text null, "assembly_days" integer not null default 1, "is_active" boolean not null default true, "exchange" jsonb not null default '{}', "markup" jsonb not null default '{}', "stock_location_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_supplier_deleted_at" ON "supplier" ("deleted_at") WHERE deleted_at IS NULL;`,
    );

    this.addSql(
      `create table if not exists "supplier_offer" ("id" text not null, "supplier_id" text not null, "variant_id" text not null, "external_id" text not null, "sku" text null, "barcode" text null, "purchase_price" numeric null, "quantity" integer not null default 0, "synced_at" timestamptz null, "raw_purchase_price" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_offer_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_supplier_offer_supplier_id" ON "supplier_offer" ("supplier_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_supplier_offer_variant_id" ON "supplier_offer" ("variant_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_supplier_offer_sku" ON "supplier_offer" ("sku") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_supplier_offer_barcode" ON "supplier_offer" ("barcode") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_supplier_offer_deleted_at" ON "supplier_offer" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_offer_supplier_id_external_id_unique" ON "supplier_offer" ("supplier_id", "external_id") WHERE deleted_at IS NULL;`,
    );

    this.addSql(
      `alter table if exists "supplier_offer" add constraint "supplier_offer_supplier_id_foreign" foreign key ("supplier_id") references "supplier" ("id") on update cascade on delete cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "supplier_offer" drop constraint if exists "supplier_offer_supplier_id_foreign";`,
    );

    this.addSql(`drop table if exists "supplier" cascade;`);

    this.addSql(`drop table if exists "supplier_offer" cascade;`);
  }
}
