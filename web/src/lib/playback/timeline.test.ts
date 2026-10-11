import { describe, expect, it } from "vitest";

import { convertTrack } from "@/lib/track/convert";
import { CSV_HEADER, parseTrackCsv } from "@/lib/track/csv";

import { buildTimeline, findNearestPointIndex, resolvePosition } from "./timeline";

const { geojson, stats } = convertTrack(
  parseTrackCsv(
    [
      CSV_HEADER,
      "2026-10-11T00:00:00Z,,,,,,", // 先頭が未測位
      "2026-10-11T00:00:10Z,35.658636,139.745407,10,20,8,1.0",
      "2026-10-11T00:00:21Z,35.659636,139.745407,,30,8,1.0", // 間隔の揺らぎ（11 秒）
      "2026-10-11T00:00:31Z,,,,,,",
      "2026-10-11T00:00:41Z,,,,,,",
      "2026-10-11T00:00:51Z,35.660636,139.746407,12,40,8,1.0",
    ].join("\n"),
  ),
);
const timeline = buildTimeline(geojson, stats.startedAt, stats.endedAt);
const at = (iso: string) => resolvePosition(timeline, Date.parse(iso));

describe("buildTimeline", () => {
  it("全区間の点を時系列に並べ、範囲は記録開始〜終了", () => {
    expect(timeline.points.map((p) => [p.segment, p.lat, p.altitudeM])).toEqual([
      [0, 35.658636, 10],
      [0, 35.659636, null],
      [1, 35.660636, 12],
    ]);
    expect(timeline.startMs).toBe(Date.parse("2026-10-11T00:00:00Z"));
    expect(timeline.endMs).toBe(Date.parse("2026-10-11T00:00:51Z"));
  });
});

describe("resolvePosition", () => {
  it("最初の点より前は未測位（最初の点に置く）", () => {
    expect(at("2026-10-11T00:00:00Z")).toEqual({ index: 0, noFix: true });
  });

  it("区間内は次の点まで直前の点", () => {
    expect(at("2026-10-11T00:00:10Z")).toEqual({ index: 0, noFix: false });
    expect(at("2026-10-11T00:00:20Z")).toEqual({ index: 0, noFix: false });
    expect(at("2026-10-11T00:00:21Z")).toEqual({ index: 1, noFix: false });
  });

  it("区間の最後の点から記録間隔を過ぎたら未測位（最後の点に止まる）", () => {
    expect(at("2026-10-11T00:00:30Z")).toEqual({ index: 1, noFix: false });
    expect(at("2026-10-11T00:00:31Z")).toEqual({ index: 1, noFix: true });
    expect(at("2026-10-11T00:00:50Z")).toEqual({ index: 1, noFix: true });
  });

  it("次の区間に入ったら測位済み", () => {
    expect(at("2026-10-11T00:00:51Z")).toEqual({ index: 2, noFix: false });
  });
});

describe("findNearestPointIndex", () => {
  it("最も近い点を返す", () => {
    expect(findNearestPointIndex(timeline, 35.659736, 139.745407)).toBe(1);
    expect(findNearestPointIndex(timeline, 35.67, 139.76)).toBe(2);
  });
});
