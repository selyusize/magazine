import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261003164817 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "exchange_property" drop constraint if exists "exchange_property_supplier_id_external_id_unique";`);
    this.addSql(`alter table if exists "exchange_product" drop constraint if exists "exchange_product_supplier_id_external_id_unique";`);
    this.addSql(`alter table if exists "exchange_image" drop constraint if exists "exchange_image_supplier_id_source_unique";`);
    this.addSql(`alter table if exists "exchange_group" drop constraint if exists "exchange_group_supplier_id_external_id_unique";`);
    this.addSql(`create table if not exists "exchange_group" ("id" text not null, "supplier_id" text not null, "external_id" text not null, "parent_external_id" text null, "name" text not null, "category_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "exchange_group_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exchange_group_category_id" ON "exchange_group" ("category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exchange_group_deleted_at" ON "exchange_group" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_exchange_group_supplier_id_external_id_unique" ON "exchange_group" ("supplier_id", "external_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "exchange_image" ("id" text not null, "supplier_id" text not null, "source" text not null, "hash" text not null, "url" text not null, "file_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "exchange_image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exchange_image_hash" ON "exchange_image" ("hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exchange_image_deleted_at" ON "exchange_image" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_exchange_image_supplier_id_source_unique" ON "exchange_image" ("supplier_id", "source") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "exchange_product" ("id" text not null, "supplier_id" text not null, "external_id" text not null, "product_id" text null, "is_owner" boolean not null default false, "is_deleted" boolean not null default false, "content_hash" text null, "data" jsonb not null default '{}', "imported" jsonb not null default '{}', "manual_fields" jsonb not null default '[]', "problems" jsonb not null default '[]', "needs_review" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "exchange_product_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exchange_product_product_id" ON "exchange_product" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exchange_product_needs_review" ON "exchange_product" ("needs_review") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exchange_product_deleted_at" ON "exchange_product" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_exchange_product_supplier_id_external_id_unique" ON "exchange_product" ("supplier_id", "external_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "exchange_property" ("id" text not null, "supplier_id" text not null, "external_id" text not null, "name" text not null, "values" jsonb not null default '{}', "attribute_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "exchange_property_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exchange_property_attribute_id" ON "exchange_property" ("attribute_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exchange_property_deleted_at" ON "exchange_property" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_exchange_property_supplier_id_external_id_unique" ON "exchange_property" ("supplier_id", "external_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "import_run" ("id" text not null, "supplier_id" text not null, "source" text check ("source" in ('push', 'pull', 'manual')) not null, "status" text check ("status" in ('receiving', 'queued', 'running', 'done', 'failed')) not null default 'queued', "dir" text not null, "files" jsonb not null default '[]', "only_changes" boolean not null default false, "current_file" text null, "cursor" integer not null default 0, "stats" jsonb not null default '{}', "errors" jsonb not null default '[]', "message" text null, "started_at" timestamptz null, "finished_at" timestamptz null, "heartbeat_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "import_run_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_run_supplier_id" ON "import_run" ("supplier_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_run_deleted_at" ON "import_run" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_run_supplier_id_status" ON "import_run" ("supplier_id", "status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "exchange_group" cascade;`);

    this.addSql(`drop table if exists "exchange_image" cascade;`);

    this.addSql(`drop table if exists "exchange_product" cascade;`);

    this.addSql(`drop table if exists "exchange_property" cascade;`);

    this.addSql(`drop table if exists "import_run" cascade;`);
  }

}
