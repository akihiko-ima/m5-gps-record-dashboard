import { sql } from "drizzle-orm";
import { check, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { ACTIVITY_TYPES } from "@/lib/activity-type";

export const tracks = sqliteTable(
  "tracks",
  {
    id: text("id").primaryKey(),
    activityType: text("activity_type", { enum: ACTIVITY_TYPES }).notNull(),
    originalFilename: text("original_filename").notNull(),
    contentHash: text("content_hash").notNull().unique(),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at").notNull(),
    pointCount: integer("point_count").notNull(),
    noFixCount: integer("no_fix_count").notNull(),
    skippedCount: integer("skipped_count").notNull(),
    distanceM: real("distance_m").notNull(),
    maxSpeedKmh: real("max_speed_kmh"),
    bbox: text("bbox").notNull(), // [minLon, minLat, maxLon, maxLat] の JSON
    uploadedAt: text("uploaded_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("tracks_started_at_idx").on(table.startedAt),
    // 種別の一覧は ACTIVITY_TYPES から生成する（コード内の定数のみで、外部入力は入らない）
    check(
      "tracks_activity_type_check",
      sql`${table.activityType} IN (${sql.raw(ACTIVITY_TYPES.map((t) => `'${t}'`).join(", "))})`,
    ),
  ],
);

export type TrackRow = typeof tracks.$inferSelect;
