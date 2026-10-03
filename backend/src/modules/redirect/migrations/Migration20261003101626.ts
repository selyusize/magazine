import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261003101626 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "redirect" drop constraint if exists "redirect_from_path_unique";`,
    );
    this.addSql(
      `alter table if exists "entity_path" drop constraint if exists "entity_path_entity_type_entity_id_unique";`,
    );
    this.addSql(
      `create table if not exists "entity_path" ("id" text not null, "entity_type" text not null, "entity_id" text not null, "path" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "entity_path_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_entity_path_deleted_at" ON "entity_path" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_entity_path_entity_type_entity_id_unique" ON "entity_path" ("entity_type", "entity_id") WHERE deleted_at IS NULL;`,
    );

    this.addSql(
      `create table if not exists "redirect" ("id" text not null, "from_path" text not null, "to_path" text null, "code" integer not null, "entity_type" text null, "entity_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "redirect_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_redirect_from_path_unique" ON "redirect" ("from_path") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_redirect_deleted_at" ON "redirect" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_redirect_to_path" ON "redirect" ("to_path") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "entity_path" cascade;`);

    this.addSql(`drop table if exists "redirect" cascade;`);
  }
}
