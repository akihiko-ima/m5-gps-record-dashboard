import { describe, expect, it } from "vitest";

import { isTrackError, TrackError } from "./errors";

describe("isTrackError", () => {
  it("TrackError と、別モジュールで生成された同等のエラーを判定する", () => {
    expect(isTrackError(new TrackError("NOT_FOUND", "x"))).toBe(true);
    const copy = Object.assign(new Error("x"), { name: "TrackError", code: "NOT_FOUND" });
    expect(isTrackError(copy)).toBe(true);
  });

  it("ほかのエラーは false", () => {
    expect(isTrackError(new Error("x"))).toBe(false);
    expect(isTrackError({ name: "TrackError", code: "NOT_FOUND" })).toBe(false);
    expect(isTrackError(null)).toBe(false);
  });
});
