import "server-only";

import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isTrackId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export type TrackFileKind = "raw" | "geojson";

/**
 * `data/raw/{id}.csv` と `data/tracks/{id}.geojson` を扱う。
 * パスはサーバーで生成した UUID からのみ作る（パストラバーサル対策）。
 */
export function createStorage(dataDir: string) {
  const dirs = { raw: path.join(dataDir, "raw"), geojson: path.join(dataDir, "tracks") };
  mkdirSync(dirs.raw, { recursive: true });
  mkdirSync(dirs.geojson, { recursive: true });

  const filePath = (kind: TrackFileKind, id: string) => {
    if (!isTrackId(id)) throw new Error(`不正なトラック ID: ${id}`);
    return path.join(dirs[kind], kind === "raw" ? `${id}.csv` : `${id}.geojson`);
  };

  return {
    filePath,

    /** 一時ファイルに書いてから rename する（書き込み途中のファイルを残さない） */
    write(kind: TrackFileKind, id: string, data: string | Uint8Array) {
      const target = filePath(kind, id);
      const tmp = `${target}.tmp`;
      try {
        writeFileSync(tmp, data);
        renameSync(tmp, target);
      } catch (e) {
        rmSync(tmp, { force: true });
        throw e;
      }
    },

    read(kind: TrackFileKind, id: string): string {
      return readFileSync(filePath(kind, id), "utf-8");
    },

    /** ファイルがなくてもエラーにしない */
    remove(kind: TrackFileKind, id: string) {
      rmSync(filePath(kind, id), { force: true });
    },
  };
}

export type Storage = ReturnType<typeof createStorage>;
