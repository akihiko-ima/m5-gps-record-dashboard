import { haversineDistanceM } from "@/lib/geo/haversine";
import { TrackError } from "@/lib/errors";

import type { BBox, FixRecord, ParsedCsv, Position, TrackGeoJson, TrackSegmentFeature, TrackStats } from "./types";

export interface ConvertedTrack {
  geojson: TrackGeoJson;
  stats: TrackStats;
}

function toFeature(segment: number, points: FixRecord[]): TrackSegmentFeature {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: points.map((p): Position => (p.altitudeM === null ? [p.lon, p.lat] : [p.lon, p.lat, p.altitudeM])),
    },
    properties: {
      segment,
      times: points.map((p) => p.time),
      speedsKmh: points.map((p) => p.speedKmh),
      satellites: points.map((p) => p.satellites),
      hdops: points.map((p) => p.hdop),
    },
  };
}

/**
 * 解析済み CSV を GeoJSON と統計値に変換する。
 * 未測位の行は点にせず、軌跡の区切りとして扱う（未測位区間をまたいで線を結ばない）。
 */
export function convertTrack({ records, skippedCount }: ParsedCsv): ConvertedTrack {
  const sorted = [...records].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));

  const segments: FixRecord[][] = [];
  let current: FixRecord[] = [];
  let noFixCount = 0;
  for (const record of sorted) {
    if (record.fix) {
      current.push(record);
    } else {
      noFixCount++;
      if (current.length > 0) segments.push(current);
      current = [];
    }
  }
  if (current.length > 0) segments.push(current);

  if (segments.length === 0) {
    throw new TrackError("NO_FIX", "測位できたデータが 1 件もありません");
  }

  let distanceM = 0;
  let maxSpeedKmh: number | null = null;
  const bbox: BBox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const points of segments) {
    points.forEach((p, i) => {
      if (i > 0) distanceM += haversineDistanceM(points[i - 1].lat, points[i - 1].lon, p.lat, p.lon);
      if (p.speedKmh !== null) maxSpeedKmh = Math.max(maxSpeedKmh ?? 0, p.speedKmh);
      bbox[0] = Math.min(bbox[0], p.lon);
      bbox[1] = Math.min(bbox[1], p.lat);
      bbox[2] = Math.max(bbox[2], p.lon);
      bbox[3] = Math.max(bbox[3], p.lat);
    });
  }

  return {
    geojson: { type: "FeatureCollection", features: segments.map((points, i) => toFeature(i, points)) },
    stats: {
      startedAt: sorted[0].time,
      endedAt: sorted[sorted.length - 1].time,
      pointCount: segments.reduce((sum, points) => sum + points.length, 0),
      noFixCount,
      skippedCount,
      distanceM,
      maxSpeedKmh,
      bbox,
    },
  };
}
