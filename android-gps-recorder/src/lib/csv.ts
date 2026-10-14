/** M5 レコーダーと同じ CSV ヘッダー（docs/ideas/m5-recorder-spec.md 6 章） */
export const CSV_HEADER = 'timestamp,latitude,longitude,altitude_m,speed_kmh,satellites,hdop';

/** OS から受け取った位置（時刻はエポックミリ秒、速度は m/s） */
export type Fix = {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  /** 水平精度（m）。画面表示用で CSV には書かない */
  accuracy?: number | null;
};

/** CSV の 1 行。fix が null なら未測位行 */
export type TrackRow = { time: number; fix: Fix | null };

/** ミリ秒を除いた ISO 8601 UTC（例: 2026-10-11T01:23:40Z） */
export function toIsoUtc(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** 値がない（null・負の値・非数）ときは空欄 */
function optional(value: number | null, digits: number): string {
  return value === null || !Number.isFinite(value) || value < 0 ? '' : value.toFixed(digits);
}

/** 行を CSV の 1 行にする。satellites / hdop は Android では取得できないため常に空欄 */
export function formatRow({ time, fix }: TrackRow): string {
  if (!fix) return `${toIsoUtc(time)},,,,,,`;
  const altitude = fix.altitude === null || !Number.isFinite(fix.altitude) ? '' : fix.altitude.toFixed(1);
  const speedKmh = optional(fix.speed === null ? null : fix.speed * 3.6, 1);
  return [toIsoUtc(time), fix.latitude.toFixed(6), fix.longitude.toFixed(6), altitude, speedKmh, '', ''].join(',');
}

/** 行の配列を CSV の本文にする（各行の末尾に LF） */
export function formatRows(rows: TrackRow[]): string {
  return rows.map((row) => `${formatRow(row)}\n`).join('');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 記録開始時刻（UTC）からファイル名 YYYYMMDD_HHMMSS.csv を作る */
export function trackFileName(startedAt: number): string {
  const d = new Date(startedAt);
  const date = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  const time = `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  return `${date}_${time}.csv`;
}

const FILE_NAME_PATTERN = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.csv$/;

/** ファイル名から記録開始時刻（エポックミリ秒）を求める。形式が違えば null */
export function parseTrackFileName(name: string): number | null {
  const m = FILE_NAME_PATTERN.exec(name);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, s);
}
