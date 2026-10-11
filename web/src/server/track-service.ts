import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";

import { isActivityType, type ActivityType } from "@/lib/activity-type";
import { TrackError } from "@/lib/errors";
import { convertTrack } from "@/lib/track/convert";
import { parseTrackCsv } from "@/lib/track/csv";
import type { BBox, TrackSummary } from "@/lib/track/types";

import { openDb, resolveDataDir, type Db } from "./db/client";
import { tracks, type TrackRow } from "./db/schema";
import { createStorage, isTrackId, type Storage } from "./storage";

export const MAX_CSV_BYTES = 10 * 1024 * 1024;

export interface ImportTrackInput {
  fileName: string;
  bytes: Uint8Array;
  activityType: unknown;
}

function toSummary(row: TrackRow): TrackSummary {
  return {
    id: row.id,
    activityType: row.activityType,
    originalFilename: row.originalFilename,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    pointCount: row.pointCount,
    noFixCount: row.noFixCount,
    distanceM: row.distanceM,
    maxSpeedKmh: row.maxSpeedKmh,
    bbox: JSON.parse(row.bbox) as BBox,
    uploadedAt: row.uploadedAt,
  };
}

function assertActivityType(value: unknown): asserts value is ActivityType {
  if (!isActivityType(value)) {
    throw new TrackError("INVALID_ACTIVITY_TYPE", "走行種別はバイクか自転車を選択してください");
  }
}

function isUniqueViolation(e: unknown): boolean {
  const code = (e as { code?: string; cause?: { code?: string } })?.code ?? (e as { cause?: { code?: string } })?.cause?.code;
  return code === "SQLITE_CONSTRAINT_UNIQUE";
}

const notFound = () => new TrackError("NOT_FOUND", "トラックが見つかりません");

export function createTrackService({ db, storage }: { db: Db; storage: Storage }) {
  const findRow = (id: string) => (isTrackId(id) ? db.select().from(tracks).where(eq(tracks.id, id)).get() : undefined);

  return {
    /** CSV を検証・変換して保存する。ファイルを書いてから DB に登録し、DB 登録に失敗したらファイルを消す */
    importTrack({ fileName, bytes, activityType }: ImportTrackInput): TrackSummary {
      assertActivityType(activityType);
      if (bytes.byteLength > MAX_CSV_BYTES) {
        throw new TrackError("TOO_LARGE", "ファイルサイズが 10MB を超えています");
      }

      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        throw new TrackError("INVALID_FORMAT", "CSV の形式が正しくありません（UTF-8 のテキストではありません）");
      }

      const contentHash = createHash("sha256").update(bytes).digest("hex");
      const duplicateError = () => new TrackError("DUPLICATE", "同じ内容のファイルが登録済みです");
      if (db.select({ id: tracks.id }).from(tracks).where(eq(tracks.contentHash, contentHash)).get()) {
        throw duplicateError();
      }

      const { geojson, stats } = convertTrack(parseTrackCsv(text));

      const id = randomUUID();
      const now = new Date().toISOString();
      storage.write("raw", id, bytes);
      storage.write("geojson", id, JSON.stringify(geojson));
      try {
        const row = db
          .insert(tracks)
          .values({
            id,
            activityType,
            originalFilename: fileName,
            contentHash,
            startedAt: stats.startedAt,
            endedAt: stats.endedAt,
            pointCount: stats.pointCount,
            noFixCount: stats.noFixCount,
            skippedCount: stats.skippedCount,
            distanceM: stats.distanceM,
            maxSpeedKmh: stats.maxSpeedKmh,
            bbox: JSON.stringify(stats.bbox),
            uploadedAt: now,
            updatedAt: now,
          })
          .returning()
          .get();
        return toSummary(row);
      } catch (e) {
        storage.remove("raw", id);
        storage.remove("geojson", id);
        if (isUniqueViolation(e)) throw duplicateError();
        throw e;
      }
    },

    /** 記録開始日時の新しい順 */
    listTracks(): TrackSummary[] {
      return db.select().from(tracks).orderBy(desc(tracks.startedAt), desc(tracks.uploadedAt)).all().map(toSummary);
    },

    getTrack(id: string): TrackSummary | undefined {
      const row = findRow(id);
      return row && toSummary(row);
    },

    /** 変換済み GeoJSON（JSON 文字列） */
    getTrackGeoJson(id: string): string {
      if (!findRow(id)) throw notFound();
      return storage.read("geojson", id);
    },

    updateActivityType(id: string, activityType: unknown): TrackSummary {
      assertActivityType(activityType);
      if (!isTrackId(id)) throw notFound();
      const row = db
        .update(tracks)
        .set({ activityType, updatedAt: new Date().toISOString() })
        .where(eq(tracks.id, id))
        .returning()
        .get();
      if (!row) throw notFound();
      return toSummary(row);
    },

    /** DB から消してからファイルを消す */
    deleteTrack(id: string): void {
      if (!isTrackId(id)) throw notFound();
      const row = db.delete(tracks).where(eq(tracks.id, id)).returning({ id: tracks.id }).get();
      if (!row) throw notFound();
      storage.remove("raw", id);
      storage.remove("geojson", id);
    },
  };
}

export type TrackService = ReturnType<typeof createTrackService>;

const globalForService = globalThis as unknown as { trackService?: TrackService };

/** アプリ全体で共有するサービス（開発時のホットリロードで DB 接続を増やさない） */
export function getTrackService(): TrackService {
  if (!globalForService.trackService) {
    const dataDir = resolveDataDir();
    globalForService.trackService = createTrackService({ db: openDb(dataDir).db, storage: createStorage(dataDir) });
  }
  return globalForService.trackService;
}
