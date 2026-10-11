import { describe, expect, it } from "vitest";

import { haversineDistanceM } from "./haversine";

describe("haversineDistanceM", () => {
  it("同じ点は 0", () => {
    expect(haversineDistanceM(35.68, 139.76, 35.68, 139.76)).toBe(0);
  });

  it("東京タワー〜新大阪駅は直線で約 399km", () => {
    const d = haversineDistanceM(35.658636, 139.745407, 34.733165, 135.500255);
    expect(d / 1000).toBeCloseTo(399.2, 0);
  });

  it("緯度 1 度は約 111.2km", () => {
    expect(haversineDistanceM(0, 0, 1, 0)).toBeCloseTo(111_195, -1);
  });
});
