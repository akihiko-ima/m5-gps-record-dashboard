import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

/** データ保存先。相対パスは起動ディレクトリからの相対 */
export function resolveDataDir(): string {
  // 実行時に決まるパスのため、ビルド時のファイルトレース対象から外す（data/ を成果物に含めない）
  return path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? "data");
}

/** `dataDir/app.db` を開き、マイグレーションを適用する */
export function openDb(dataDir: string): { db: Db; sqlite: Database.Database } {
  mkdirSync(dataDir, { recursive: true });
  const sqlite = new Database(path.join(dataDir, "app.db"));
  const db = drizzle(sqlite, { schema });
  // drizzle/ は next.config.ts の outputFileTracingIncludes で成果物に含める
  migrate(db, { migrationsFolder: path.join(/*turbopackIgnore: true*/ process.cwd(), "drizzle") });
  return { db, sqlite };
}
