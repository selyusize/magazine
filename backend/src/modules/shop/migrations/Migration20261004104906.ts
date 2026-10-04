import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261004104906 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shop" drop constraint if exists "shop_domain_unique";`);
    this.addSql(`alter table if exists "shop" drop constraint if exists "shop_slug_unique";`);
    this.addSql(`create table if not exists "network_settings" ("id" text not null, "name" text null, "legal_name" text null, "inn" text null, "ogrn" text null, "kpp" text null, "legal_address" text null, "phone" text null, "email" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "network_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_network_settings_deleted_at" ON "network_settings" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "shop" ("id" text not null, "slug" text not null, "name" text not null, "domain" text not null, "storefront_url" text not null, "is_active" boolean not null default true, "root_category_id" text not null, "revalidate_secret" text not null, "settings" jsonb not null default '{}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shop_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shop_slug_unique" ON "shop" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shop_domain_unique" ON "shop" ("domain") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_deleted_at" ON "shop" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "storefront_revalidation" ("id" text not null, "shop_id" text not null, "tags" text[] not null, "status" text check ("status" in ('pending', 'sending', 'sent', 'failed')) not null default 'pending', "attempts" integer not null default 0, "first_queued_at" timestamptz not null, "due_at" timestamptz not null, "sent_at" timestamptz null, "response_status" integer null, "error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_revalidation_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_revalidation_deleted_at" ON "storefront_revalidation" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_revalidation_shop_id_status" ON "storefront_revalidation" ("shop_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_revalidation_status_due_at" ON "storefront_revalidation" ("status", "due_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_revalidation_shop_id_created_at" ON "storefront_revalidation" ("shop_id", "created_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "network_settings" cascade;`);

    this.addSql(`drop table if exists "shop" cascade;`);

    this.addSql(`drop table if exists "storefront_revalidation" cascade;`);
  }

}
