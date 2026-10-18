import { describe, expect, it } from "vitest";

import { ACTIVITY_TYPE_META, ACTIVITY_TYPES, isActivityType } from "./activity-type";

describe("isActivityType", () => {
  it.each(ACTIVITY_TYPES)("%s は有効", (type) => {
    expect(isActivityType(type)).toBe(true);
  });

  it.each(["", "car", "Motorcycle", "Running", null, undefined, 1])("%s は無効", (value) => {
    expect(isActivityType(value)).toBe(false);
  });
});

describe("ACTIVITY_TYPE_META", () => {
  it("バイクはオレンジ、自転車は青、ランニングは緑", () => {
    expect(ACTIVITY_TYPE_META.motorcycle).toEqual({ label: "バイク", color: "#F97316" });
    expect(ACTIVITY_TYPE_META.bicycle).toEqual({ label: "自転車", color: "#3B82F6" });
    expect(ACTIVITY_TYPE_META.running).toEqual({ label: "ランニング", color: "#22C55E" });
  });
});
