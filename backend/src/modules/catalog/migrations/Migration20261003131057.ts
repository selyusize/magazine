import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261003131057 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "product_main_category" drop constraint if exists "product_main_category_product_id_unique";`,
    );
    this.addSql(
      `create table if not exists "product_main_category" ("id" text not null, "product_id" text not null, "category_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_main_category_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_main_category_product_id_unique" ON "product_main_category" ("product_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_main_category_category_id" ON "product_main_category" ("category_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_main_category_deleted_at" ON "product_main_category" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_main_category" cascade;`);
  }
}
