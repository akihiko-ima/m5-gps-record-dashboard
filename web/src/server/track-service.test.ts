import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CSV_HEADER } from "@/lib/track/csv";
import type { TrackGeoJson } from "@/lib/track/types";

import { openDb } from "./db/client";
import { createStorage } from "./storage";
import { createTrackService, MAX_CSV_BYTES, type TrackService } from "./track-service";

const encode = (text: string) => new TextEncoder().encode(text);

const csvBytes = (startHour: number) =>
  encode(
    [
      CSV_HEADER,
      `2026-10-11T0${startHour}:00:00Z,35.658636,139.745407,10,20,8,1.0`,
      `2026-10-11T0${startHour}:00:10Z,35.659636,139.745407,10,30,8,1.0`,
      `2026-10-11T0${startHour}:00:20Z,,,,,,`,
      `2026-10-11T0${startHour}:00:30Z,35.660636,139.745407,10,40,8,1.0`,
    ].join("\n"),
  );

let dataDir: string;
let sqlite: ReturnType<typeof openDb>["sqlite"];
let service: TrackService;

const filesIn = (sub: string) => readdirSync(path.join(dataDir, sub));
const expectCode = (fn: () => unknown, code: string) => expect(fn).toThrowError(expect.objectContaining({ code }));

beforeEach(() => {
  dataDir = mkdtempSync(path.join(tmpdir(), "track-service-"));
  const opened = openDb(dataDir);
  sqlite = opened.sqlite;
  service = createTrackService({ db: opened.db, storage: createStorage(dataDir) });
});

afterEach(() => {
  sqlite.close();
  rmSync(dataDir, { recursive: true, force: true });
});

describe("track-service", () => {
  it("登録 → 一覧 → GeoJSON 取得 → 種別変更 → 削除", () => {
    const older = service.importTrack({ fileName: "a.csv", bytes: csvBytes(1), activityType: "motorcycle" });
    const newer = service.importTrack({ fileName: "b.csv", bytes: csvBytes(2), activityType: "bicycle" });

    expect(older).toMatchObject({
      activityType: "motorcycle",
      originalFilename: "a.csv",
      startedAt: "2026-10-11T01:00:00Z",
      endedAt: "2026-10-11T01:00:30Z",
      pointCount: 3,
      noFixCount: 1,
      maxSpeedKmh: 40,
      bbox: [139.745407, 35.658636, 139.745407, 35.660636],
    });
    expect(filesIn("raw")).toHaveLength(2);
    expect(filesIn("tracks")).toHaveLength(2);
    expect(existsSync(path.join(dataDir, "app.db"))).toBe(true);

    // 記録開始日時の新しい順
    expect(service.listTracks().map((t) => t.id)).toEqual([newer.id, older.id]);

    const geojson = JSON.parse(service.getTrackGeoJson(older.id)) as TrackGeoJson;
    expect(geojson.features).toHaveLength(2);

    expect(service.updateActivityType(older.id, "bicycle").activityType).toBe("bicycle");
    expect(service.getTrack(older.id)?.activityType).toBe("bicycle");

    service.deleteTrack(older.id);
    expect(service.getTrack(older.id)).toBeUndefined();
    expect(filesIn("raw")).toEqual([`${newer.id}.csv`]);
    expect(filesIn("tracks")).toEqual([`${newer.id}.geojson`]);
    expectCode(() => service.getTrackGeoJson(older.id), "NOT_FOUND");
  });

  it("同じ内容は重複として拒否する", () => {
    service.importTrack({ fileName: "a.csv", bytes: csvBytes(1), activityType: "motorcycle" });
    expectCode(() => service.importTrack({ fileName: "copy.csv", bytes: csvBytes(1), activityType: "bicycle" }), "DUPLICATE");
    expect(service.listTracks()).toHaveLength(1);
  });

  it.each([
    ["不正な種別", { bytes: csvBytes(1), activityType: "car" }, "INVALID_ACTIVITY_TYPE"],
    ["種別なし", { bytes: csvBytes(1), activityType: null }, "INVALID_ACTIVITY_TYPE"],
    ["サイズ超過", { bytes: new Uint8Array(MAX_CSV_BYTES + 1), activityType: "bicycle" }, "TOO_LARGE"],
    ["UTF-8 でない", { bytes: new Uint8Array([0xff, 0xfe, 0x00]), activityType: "bicycle" }, "INVALID_FORMAT"],
    ["測位なし", { bytes: encode(`${CSV_HEADER}\n2026-10-11T00:00:00Z,,,,,,`), activityType: "bicycle" }, "NO_FIX"],
  ])("%s は拒否し、ファイルを残さない", (_, input, code) => {
    expectCode(() => service.importTrack({ fileName: "x.csv", ...input }), code);
    expect(service.listTracks()).toHaveLength(0);
    expect(filesIn("raw")).toHaveLength(0);
    expect(filesIn("tracks")).toHaveLength(0);
  });

  it("DB 登録に失敗したらファイルを残さない", () => {
    sqlite.exec("CREATE TRIGGER fail_insert BEFORE INSERT ON tracks BEGIN SELECT RAISE(ABORT, 'boom'); END;");
    expect(() => service.importTrack({ fileName: "a.csv", bytes: csvBytes(1), activityType: "bicycle" })).toThrowError();
    expect(filesIn("raw")).toHaveLength(0);
    expect(filesIn("tracks")).toHaveLength(0);
  });

  it("存在しない・不正な id は NOT_FOUND", () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expectCode(() => service.updateActivityType(missing, "bicycle"), "NOT_FOUND");
    expectCode(() => service.deleteTrack("../app.db"), "NOT_FOUND");
    expectCode(() => service.getTrackGeoJson("../../etc/passwd"), "NOT_FOUND");
    expect(service.getTrack("../app.db")).toBeUndefined();
  });
});
