const TIME_ZONE = "Asia/Tokyo";

const dateTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function jstParts(iso: string | number) {
  const parts = Object.fromEntries(
    dateTimeFormat.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  ) as Record<Intl.DateTimeFormatPartTypes, string>;
  return parts;
}

/** 例: 2026/10/11 13:51 */
export function formatDateTime(iso: string | number): string {
  const p = jstParts(iso);
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}`;
}

/** 例: 2026/10/11 13:51:21 */
export function formatDateTimeWithSeconds(iso: string | number): string {
  const p = jstParts(iso);
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

/** 例: 13:51 */
export function formatTime(iso: string | number): string {
  const p = jstParts(iso);
  return `${p.hour}:${p.minute}`;
}

/** 例: 13:51:21 */
export function formatTimeWithSeconds(iso: string | number): string {
  const p = jstParts(iso);
  return `${p.hour}:${p.minute}:${p.second}`;
}

/** 例: 6時間16分 */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60_000);
  return `${Math.floor(totalMinutes / 60)}時間${String(totalMinutes % 60).padStart(2, "0")}分`;
}

/** 例: 58.3 km */
export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

/** 例: 42.5 km/h（値がなければ -） */
export function formatSpeed(kmh: number | null): string {
  return kmh === null ? "-" : `${kmh.toFixed(1)} km/h`;
}

/** 例: 102.5 m（値がなければ -） */
export function formatAltitude(meters: number | null): string {
  return meters === null ? "-" : `${meters.toFixed(1)} m`;
}

/** 例: 2,243 */
export function formatCount(n: number): string {
  return n.toLocaleString("ja-JP");
}
