import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261004051815 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "attribute" drop constraint if exists "attribute_shop_id_handle_unique";`);
    this.addSql(`create table if not exists "attribute" ("id" text not null, "shop_id" text not null, "name" text not null, "handle" text not null, "type" text check ("type" in ('string', 'number', 'boolean')) not null default 'string', "unit" text null, "is_filterable" boolean not null default false, "is_visible" boolean not null default true, "rank" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_deleted_at" ON "attribute" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_attribute_shop_id_handle_unique" ON "attribute" ("shop_id", "handle") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "attribute_value" ("id" text not null, "attribute_id" text not null, "product_id" text not null, "variant_id" text null, "value" text not null, "handle" text not null, "number" real null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "attribute_value_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_value_attribute_id" ON "attribute_value" ("attribute_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_value_product_id" ON "attribute_value" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_value_variant_id" ON "attribute_value" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_value_deleted_at" ON "attribute_value" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_value_attribute_id_handle" ON "attribute_value" ("attribute_id", "handle") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "attribute_value" add constraint "attribute_value_attribute_id_foreign" foreign key ("attribute_id") references "attribute" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "attribute_value" drop constraint if exists "attribute_value_attribute_id_foreign";`);

    this.addSql(`drop table if exists "attribute" cascade;`);

    this.addSql(`drop table if exists "attribute_value" cascade;`);
  }

}
