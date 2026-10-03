import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261003123321 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "filter_page" drop constraint if exists "filter_page_category_id_handle_unique";`,
    );
    this.addSql(
      `create table if not exists "filter_page" ("id" text not null, "category_id" text not null, "title" text not null, "handle" text not null, "filters" jsonb not null default '{}', "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "filter_page_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_filter_page_category_id" ON "filter_page" ("category_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_filter_page_deleted_at" ON "filter_page" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_filter_page_category_id_handle_unique" ON "filter_page" ("category_id", "handle") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "filter_page" cascade;`);
  }
}
