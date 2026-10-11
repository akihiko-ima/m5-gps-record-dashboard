import { describe, expect, it } from "vitest";

import { TrackError } from "@/lib/errors";

import { convertTrack } from "./convert";
import { CSV_HEADER, parseTrackCsv } from "./csv";

const csv = (...rows: string[]) => [CSV_HEADER, ...rows].join("\n");

describe("convertTrack", () => {
  it("未測位の行で区間を分割する", () => {
    const { geojson, stats } = convertTrack(
      parseTrackCsv(
        csv(
          "2026-10-11T00:00:00Z,35.658636,139.745407,10.0,20.0,8,1.0",
          "2026-10-11T00:00:10Z,35.659636,139.745407,11.0,30.0,8,1.0",
          "2026-10-11T00:00:20Z,,,,,,",
          "2026-10-11T00:00:30Z,,,,,,",
          "2026-10-11T00:00:40Z,35.660636,139.745407,,,,",
        ),
      ),
    );

    expect(geojson.features).toHaveLength(2);
    expect(geojson.features[0]).toEqual({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [139.745407, 35.658636, 10.0],
          [139.745407, 35.659636, 11.0],
        ],
      },
      properties: {
        segment: 0,
        times: ["2026-10-11T00:00:00Z", "2026-10-11T00:00:10Z"],
        speedsKmh: [20.0, 30.0],
        satellites: [8, 8],
        hdops: [1.0, 1.0],
      },
    });
    // 高度がない点は 2 次元座標、ほかの欠損値は null
    expect(geojson.features[1].geometry.coordinates).toEqual([[139.745407, 35.660636]]);
    expect(geojson.features[1].properties).toMatchObject({ segment: 1, speedsKmh: [null], hdops: [null] });

    expect(stats).toEqual({
      startedAt: "2026-10-11T00:00:00Z",
      endedAt: "2026-10-11T00:00:40Z",
      pointCount: 3,
      noFixCount: 2,
      skippedCount: 0,
      // 区間をまたぐ 0.001 度分は含めない（緯度 0.001 度 ≒ 111m）
      distanceM: expect.closeTo(111.2, 0),
      maxSpeedKmh: 30.0,
      bbox: [139.745407, 35.658636, 139.745407, 35.660636],
    });
  });

  it("開始・終了時刻は未測位の行も含めた最初・最後の行", () => {
    const { stats } = convertTrack(
      parseTrackCsv(csv("2026-10-11T00:00:00Z,,,,,,", "2026-10-11T00:00:10Z,35.658636,139.745407,,,,", "2026-10-11T00:00:20Z,,,,,,")),
    );
    expect(stats).toMatchObject({ startedAt: "2026-10-11T00:00:00Z", endedAt: "2026-10-11T00:00:20Z", maxSpeedKmh: null });
  });

  it("時刻順に並べ替えてから変換する", () => {
    const { geojson } = convertTrack(
      parseTrackCsv(csv("2026-10-11T00:00:10Z,35.659636,139.745407,,,,", "2026-10-11T00:00:00Z,35.658636,139.745407,,,,")),
    );
    expect(geojson.features[0].properties.times).toEqual(["2026-10-11T00:00:00Z", "2026-10-11T00:00:10Z"]);
  });

  it("測位済みの行がなければ NO_FIX", () => {
    expect(() => convertTrack(parseTrackCsv(csv("2026-10-11T00:00:00Z,,,,,,")))).toThrowError(
      expect.objectContaining({ code: "NO_FIX" }) as unknown as TrackError,
    );
    expect(() => convertTrack(parseTrackCsv(CSV_HEADER))).toThrowError(TrackError);
  });
});
