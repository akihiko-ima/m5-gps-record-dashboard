import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { convertTrack } from "../src/lib/track/convert";
import { parseTrackCsv } from "../src/lib/track/csv";

import { generateDemoCsvs } from "./demo-routes";

// 実データ（Git 管理外の sample_data/）。位置情報をソースに残さないため、範囲はある環境でのみ実行時に求める
const sampleDir = path.resolve(import.meta.dirname, "../../sample_data");
const realBboxes = existsSync(sampleDir)
  ? readdirSync(sampleDir)
      .filter((f) => f.endsWith(".csv"))
      .map((f) => convertTrack(parseTrackCsv(readFileSync(path.join(sampleDir, f), "utf-8"))).stats.bbox)
  : [];

const demos = generateDemoCsvs();

describe("ダミー CSV", () => {
  it("バイクと自転車の両方があり、未測位の行を含む", () => {
    expect(new Set(demos.map((d) => d.activityType))).toEqual(new Set(["motorcycle", "bicycle"]));
    expect(demos.some((d) => d.csv.includes(",,,,,,"))).toBe(true);
  });

  it.each(demos.map((d) => [d.fileName, d]))("%s は M5 の CSV 形式で、不正な行がない", (_, demo) => {
    const { geojson, stats } = convertTrack(parseTrackCsv(demo.csv));
    expect(stats.skippedCount).toBe(0);
    expect(stats.pointCount).toBeGreaterThan(50);
    expect(geojson.features.length).toBeGreaterThan(0);
    // ファイル名は記録開始時刻（M5 と同じ命名）
    expect(demo.fileName).toBe(`${stats.startedAt.slice(0, 19).replace(/[-:]/g, "").replace("T", "_")}.csv`);
  });

  it.skipIf(realBboxes.length === 0).each(demos.map((d) => [d.fileName, d]))("%s は実データの範囲と重ならない", (_, demo) => {
    const [minLon, minLat, maxLon, maxLat] = convertTrack(parseTrackCsv(demo.csv)).stats.bbox;
    for (const real of realBboxes) {
      const overlaps = minLon <= real[2] && maxLon >= real[0] && minLat <= real[3] && maxLat >= real[1];
      expect(overlaps).toBe(false);
    }
  });

  it.each(demos.map((d) => [d.fileName, d]))("%s はコミット済みの web/demo/ と一致する（npm run demo:generate で再生成）", (_, demo) => {
    expect(readFileSync(path.resolve(import.meta.dirname, "../demo", demo.fileName), "utf-8")).toBe(demo.csv);
  });
});
