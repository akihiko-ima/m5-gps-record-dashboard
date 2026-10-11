import { describe, expect, it } from "vitest";

import {
  formatAltitude,
  formatCount,
  formatDateTime,
  formatDateTimeWithSeconds,
  formatDistance,
  formatDuration,
  formatSpeed,
  formatTime,
  formatTimeWithSeconds,
} from "./format";

describe("日時（JST）", () => {
  it("UTC を JST に変換する", () => {
    expect(formatDateTime("2026-10-11T04:51:21Z")).toBe("2026/10/11 13:51");
    expect(formatDateTimeWithSeconds("2026-10-11T04:51:21Z")).toBe("2026/10/11 13:51:21");
    expect(formatTime("2026-10-11T04:51:21Z")).toBe("13:51");
    expect(formatTimeWithSeconds("2026-10-11T04:51:21Z")).toBe("13:51:21");
  });

  it("日付をまたぐ", () => {
    expect(formatDateTime("2026-10-11T15:05:00Z")).toBe("2026/10/12 00:05");
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0時間00分"],
    [45 * 60_000, "0時間45分"],
    [(6 * 60 + 16) * 60_000 + 59_000, "6時間16分"],
  ])("%d ms → %s", (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});

describe("数値", () => {
  it("距離・速度・高度・件数", () => {
    expect(formatDistance(58_349)).toBe("58.3 km");
    expect(formatSpeed(42.54)).toBe("42.5 km/h");
    expect(formatSpeed(null)).toBe("-");
    expect(formatAltitude(102.5)).toBe("102.5 m");
    expect(formatAltitude(null)).toBe("-");
    expect(formatCount(2243)).toBe("2,243");
  });
});
