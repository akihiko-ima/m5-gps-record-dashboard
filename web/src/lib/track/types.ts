import type { ActivityType } from "@/lib/activity-type";

/** CSV の 1 行（測位済み） */
export interface FixRecord {
  fix: true;
  time: string; // ISO 8601 UTC
  lat: number;
  lon: number;
  altitudeM: number | null;
  speedKmh: number | null;
  satellites: number | null;
  hdop: number | null;
}

/** CSV の 1 行（未測位: timestamp のみ） */
export interface NoFixRecord {
  fix: false;
  time: string;
}

export type CsvRecord = FixRecord | NoFixRecord;

export interface ParsedCsv {
  records: CsvRecord[];
  skippedCount: number;
}

/** GeoJSON の座標。高度がない点は [経度, 緯度] */
export type Position = [lon: number, lat: number] | [lon: number, lat: number, altitudeM: number];

export interface TrackSegmentProperties {
  segment: number;
  times: string[];
  speedsKmh: (number | null)[];
  satellites: (number | null)[];
  hdops: (number | null)[];
}

export interface TrackSegmentFeature {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: Position[] };
  properties: TrackSegmentProperties;
}

export interface TrackGeoJson {
  type: "FeatureCollection";
  features: TrackSegmentFeature[];
}

export type BBox = [minLon: number, minLat: number, maxLon: number, maxLat: number];

export interface TrackStats {
  startedAt: string;
  endedAt: string;
  pointCount: number;
  noFixCount: number;
  skippedCount: number;
  distanceM: number;
  maxSpeedKmh: number | null;
  bbox: BBox;
}

/** 一覧・サマリー表示用のトラック情報（Server → Client に渡す） */
export interface TrackSummary {
  id: string;
  activityType: ActivityType;
  originalFilename: string;
  startedAt: string;
  endedAt: string;
  pointCount: number;
  noFixCount: number;
  distanceM: number;
  maxSpeedKmh: number | null;
  bbox: BBox;
  uploadedAt: string;
}
