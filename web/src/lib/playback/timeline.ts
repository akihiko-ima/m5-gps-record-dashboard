import type { TrackGeoJson } from "@/lib/track/types";

/** M5 レコーダーの記録間隔 */
export const RECORD_INTERVAL_MS = 10_000;

export interface TimelinePoint {
  timeMs: number;
  lat: number;
  lon: number;
  altitudeM: number | null;
  speedKmh: number | null;
  satellites: number | null;
  hdop: number | null;
  segment: number;
}

export interface Timeline {
  points: TimelinePoint[];
  startMs: number;
  endMs: number;
}

export interface TimelinePosition {
  /** 表示する点（未測位のときは最後に測位した点） */
  index: number;
  noFix: boolean;
}

/** GeoJSON の全区間を時系列の点の配列にする。範囲は記録開始〜終了（未測位の行を含む） */
export function buildTimeline(geojson: TrackGeoJson, startedAt: string, endedAt: string): Timeline {
  const points: TimelinePoint[] = [];
  for (const feature of geojson.features) {
    const { coordinates } = feature.geometry;
    const { segment, times, speedsKmh, satellites, hdops } = feature.properties;
    coordinates.forEach(([lon, lat, altitudeM], i) => {
      points.push({
        timeMs: Date.parse(times[i]),
        lat,
        lon,
        altitudeM: altitudeM ?? null,
        speedKmh: speedsKmh[i],
        satellites: satellites[i],
        hdop: hdops[i],
        segment,
      });
    });
  }
  points.sort((a, b) => a.timeMs - b.timeMs);
  return { points, startMs: Date.parse(startedAt), endMs: Date.parse(endedAt) };
}

/** 時刻以前で最後の点のインデックス（なければ -1） */
function lastIndexAtOrBefore(points: TimelinePoint[], timeMs: number): number {
  let lo = 0;
  let hi = points.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].timeMs <= timeMs) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/**
 * 時刻 → 表示する点。
 * 区間内では次の点の時刻まで直前の点を表示し、区間の最後の点は記録間隔を過ぎたら未測位とする。
 */
export function resolvePosition({ points }: Timeline, timeMs: number): TimelinePosition {
  const index = lastIndexAtOrBefore(points, timeMs);
  if (index === -1) return { index: 0, noFix: true };

  const point = points[index];
  const next = points[index + 1];
  if (next && next.segment === point.segment) return { index, noFix: false };
  return { index, noFix: timeMs - point.timeMs >= RECORD_INTERVAL_MS };
}

/** 指定位置に最も近い点のインデックス（ポップアップ表示用） */
export function findNearestPointIndex({ points }: Timeline, lat: number, lon: number): number {
  // 小さな範囲なので経度方向を cos(緯度) で補正した平面距離で十分
  const k = Math.cos((lat * Math.PI) / 180);
  let best = 0;
  let bestDist = Infinity;
  points.forEach((p, i) => {
    const d = (p.lat - lat) ** 2 + ((p.lon - lon) * k) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}
