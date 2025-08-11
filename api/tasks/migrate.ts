import { resolve } from "node:path";
import process from "node:process";

import { exists } from "@std/fs";

import { config } from "~libraries/database/config.ts";
import { getMongoClient } from "~libraries/database/connection.ts";
import { container } from "~libraries/database/container.ts";
import { logger } from "~libraries/logger/mod.ts";

/*
 |--------------------------------------------------------------------------------
 | Dependencies
 |--------------------------------------------------------------------------------
 */

const client = getMongoClient(config.mongo);

container.set("client", client);

/*
|--------------------------------------------------------------------------------
| Migrate
|--------------------------------------------------------------------------------
*/

const db = client.db("api:migrations");
const collection = db.collection<MigrationDocument>("migrations");

const { default: journal } = await import(resolve(import.meta.dirname!, "migrations", "meta", "_journal.json"), {
  with: { type: "json" },
});

const migrations =
  (await collection.findOne({ name: journal.name })) ?? ({ name: journal.name, entries: [] } as MigrationDocument);

for (const entry of journal.entries) {
  const migrationFileName = `${String(entry.idx).padStart(4, "0")}_${entry.name}.ts`;
  if (migrations.entries.includes(migrationFileName)) {
    continue;
  }
  const migrationPath = resolve(import.meta.dirname!, "migrations", migrationFileName);
  if (await exists(migrationPath)) {
    await import(migrationPath);
    await collection.updateOne(
      {
        name: journal.name,
      },
      {
        $set: { name: journal.name },
        $push: { entries: migrationFileName }, // Assuming 'entries' is an array
      },
      {
        upsert: true,
      },
    );
    logger.info(`Migrated ${migrationPath}`);
  }
}

type MigrationDocument = {
  name: string;
  entries: string[];
};

process.exit(0);
