import { TrackError } from "@/lib/errors";

import type { CsvRecord, ParsedCsv } from "./types";

export const CSV_HEADER = "timestamp,latitude,longitude,altitude_m,speed_kmh,satellites,hdop";

const COLUMN_COUNT = 7;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/** 空欄は null、数値でなければ undefined（不正） */
function parseOptionalNumber(value: string): number | null | undefined {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseLine(line: string): CsvRecord | undefined {
  const cols = line.split(",").map((c) => c.trim());
  if (cols.length !== COLUMN_COUNT) return undefined;

  const [time, latStr, lonStr, altStr, speedStr, satStr, hdopStr] = cols;
  if (!TIMESTAMP_PATTERN.test(time) || Number.isNaN(Date.parse(time))) return undefined;

  if (latStr === "" || lonStr === "") {
    return { fix: false, time };
  }

  const lat = Number(latStr);
  const lon = Number(lonStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return undefined;
  }

  const altitudeM = parseOptionalNumber(altStr);
  const speedKmh = parseOptionalNumber(speedStr);
  const satellites = parseOptionalNumber(satStr);
  const hdop = parseOptionalNumber(hdopStr);
  if (altitudeM === undefined || speedKmh === undefined || satellites === undefined || hdop === undefined) {
    return undefined;
  }

  return { fix: true, time, lat, lon, altitudeM, speedKmh, satellites, hdop };
}

/** M5 レコーダーの CSV を解析する。不正な行はスキップして件数を数える */
export function parseTrackCsv(text: string): ParsedCsv {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== CSV_HEADER) {
    throw new TrackError("INVALID_FORMAT", "CSV の形式が正しくありません（ヘッダーが一致しません）");
  }

  const records: CsvRecord[] = [];
  let skippedCount = 0;
  for (const line of lines.slice(1)) {
    if (line.trim() === "") continue;
    const record = parseLine(line);
    if (record) {
      records.push(record);
    } else {
      skippedCount++;
    }
  }
  return { records, skippedCount };
}
