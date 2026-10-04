import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261004085508 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "article" drop constraint if exists "article_shop_id_handle_unique";`);
    this.addSql(`create table if not exists "article" ("id" text not null, "shop_id" text not null, "title" text not null, "handle" text not null, "excerpt" text null, "body" text null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "article_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_deleted_at" ON "article" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_shop_id_handle_unique" ON "article" ("shop_id", "handle") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "article" cascade;`);
  }

}
