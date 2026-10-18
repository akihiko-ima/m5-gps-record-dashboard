import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openDb } from "./client";

const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(path.join(tmpdir(), "migrations-"));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

/** 0000_init だけを適用した DB（走行種別の追加前）を dataDir/app.db に作る */
function createInitOnlyDb(dataDir: string): Database.Database {
  const initOnlyDir = path.join(workDir, "drizzle-init-only");
  cpSync(MIGRATIONS_DIR, initOnlyDir, { recursive: true });
  const journalPath = path.join(initOnlyDir, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as { entries: { tag: string }[] };
  journal.entries = journal.entries.filter((e) => e.tag === "0000_init");
  writeFileSync(journalPath, JSON.stringify(journal));

  const sqlite = new Database(path.join(dataDir, "app.db"));
  migrate(drizzle(sqlite), { migrationsFolder: initOnlyDir });
  return sqlite;
}

function insertTrack(sqlite: Database.Database, id: string, activityType: string): void {
  sqlite
    .prepare(
      `INSERT INTO tracks (id, activity_type, original_filename, content_hash, started_at, ended_at,
         point_count, no_fix_count, skipped_count, distance_m, max_speed_kmh, bbox, uploaded_at, updated_at)
       VALUES (?, ?, 'a.csv', ?, '2026-10-11T00:00:00Z', '2026-10-11T01:00:00Z', 10, 0, 0, 1000, 20, '[0,0,1,1]',
         '2026-10-11T02:00:00Z', '2026-10-11T02:00:00Z')`,
    )
    .run(id, activityType, `hash-${id}`);
}

describe("マイグレーション", () => {
  it("ランニング追加前の DB を移行しても既存トラックが残り、running を保存できる", () => {
    const dataDir = path.join(workDir, "data");
    mkdirSync(dataDir);
    const old = createInitOnlyDb(dataDir);
    insertTrack(old, "moto", "motorcycle");
    insertTrack(old, "bike", "bicycle");
    expect(() => insertTrack(old, "run0", "running")).toThrowError(/CHECK constraint failed/);
    old.close();

    // 起動時と同じく openDb で残りのマイグレーションを適用する
    const { sqlite } = openDb(dataDir);
    try {
      const rows = sqlite.prepare("SELECT id, activity_type FROM tracks ORDER BY id").all();
      expect(rows).toEqual([
        { id: "bike", activity_type: "bicycle" },
        { id: "moto", activity_type: "motorcycle" },
      ]);

      insertTrack(sqlite, "run", "running");
      // テーブルの作り直し後も CHECK 制約とユニーク制約が効いている
      expect(() => insertTrack(sqlite, "car", "car")).toThrowError(/CHECK constraint failed/);
      expect(() => insertTrack(sqlite, "moto", "running")).toThrowError(/UNIQUE|PRIMARY KEY/);
      expect(() =>
        sqlite.prepare("UPDATE tracks SET content_hash = 'hash-moto' WHERE id = 'bike'").run(),
      ).toThrowError(/UNIQUE constraint failed: tracks.content_hash/);

      const indexes = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'tracks' AND sql IS NOT NULL")
        .all()
        .map((r) => (r as { name: string }).name)
        .sort();
      expect(indexes).toEqual(["tracks_content_hash_unique", "tracks_started_at_idx"]);
    } finally {
      sqlite.close();
    }
  });
});
