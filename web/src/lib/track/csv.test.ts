import { describe, expect, it } from "vitest";

import { TrackError } from "@/lib/errors";

import { CSV_HEADER, parseTrackCsv } from "./csv";

describe("parseTrackCsv", () => {
  it("測位済み・未測位の行を判別する", () => {
    const csv = [
      CSV_HEADER,
      "2026-10-11T01:23:40Z,35.658636,139.745407,12.3,42.5,9,0.9",
      "2026-10-11T01:23:50Z,,,,,,",
    ].join("\n");

    expect(parseTrackCsv(csv)).toEqual({
      records: [
        {
          fix: true,
          time: "2026-10-11T01:23:40Z",
          lat: 35.658636,
          lon: 139.745407,
          altitudeM: 12.3,
          speedKmh: 42.5,
          satellites: 9,
          hdop: 0.9,
        },
        { fix: false, time: "2026-10-11T01:23:50Z" },
      ],
      skippedCount: 0,
    });
  });

  it("欠けている任意項目は null にする", () => {
    const { records } = parseTrackCsv(`${CSV_HEADER}\n2026-10-11T01:23:40Z,35.658636,139.745407,,,,`);
    expect(records[0]).toMatchObject({ fix: true, altitudeM: null, speedKmh: null, satellites: null, hdop: null });
  });

  it("CRLF・BOM・末尾の空行を許容する", () => {
    const csv = `﻿${CSV_HEADER}\r\n2026-10-11T01:23:40Z,35.658636,139.745407,1,2,3,4\r\n\r\n`;
    expect(parseTrackCsv(csv)).toMatchObject({ records: [{ fix: true }], skippedCount: 0 });
  });

  it("不正な行はスキップして数える", () => {
    const csv = [
      CSV_HEADER,
      "2026-10-11T01:23:40Z,35.658636,139.745407,1,2,3,4",
      "not-a-time,35.658636,139.745407,1,2,3,4",
      "2026-10-11T01:23:50Z,abc,139.1,1,2,3,4",
      "2026-10-11T01:24:00Z,95,139.1,1,2,3,4",
      "2026-10-11T01:24:10Z,35.658636,139.745407,x,2,3,4",
      "2026-10-11T01:24:20Z,35.658636,139.745407",
    ].join("\n");
    expect(parseTrackCsv(csv)).toMatchObject({ records: [{ fix: true }], skippedCount: 5 });
  });

  it.each([
    ["空ファイル", ""],
    ["ヘッダー違い", "time,lat,lon\n2026-10-11T01:23:40Z,35.658636,139.745407"],
    ["バイナリ風", "\u0000\u0001\u0002"],
  ])("%s は INVALID_FORMAT", (_, csv) => {
    expect(() => parseTrackCsv(csv)).toThrowError(TrackError);
    try {
      parseTrackCsv(csv);
    } catch (e) {
      expect((e as TrackError).code).toBe("INVALID_FORMAT");
    }
  });
});
