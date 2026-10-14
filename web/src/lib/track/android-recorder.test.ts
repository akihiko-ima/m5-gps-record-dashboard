import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { convertTrack } from "./convert";
import { parseTrackCsv } from "./csv";

// android-gps-recorder の lib/csv.ts・lib/slots.ts で生成した CSV（satellites / hdop は常に空欄）
const sample = readFileSync(path.join(import.meta.dirname, "testdata/android-recorder.csv"), "utf-8");

describe("Android レコーダーの CSV", () => {
  it("不正行なしで読み込み、未測位区間で 2 区間に分かれる", () => {
    const parsed = parseTrackCsv(sample);
    expect(parsed.skippedCount).toBe(0);

    const { geojson, stats } = convertTrack(parsed);
    expect(geojson.features).toHaveLength(2);
    expect(stats).toMatchObject({
      startedAt: "2026-10-14T00:00:00Z",
      endedAt: "2026-10-14T00:02:10Z",
      pointCount: 12,
      noFixCount: 2,
      skippedCount: 0,
      maxSpeedKmh: 46.8,
    });
  });
});
