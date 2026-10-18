/**
 * README のスクリーンショット用ダミーデータ（架空の走行）。
 * 実際の走行データは使わず、観光地を通る経由点を補間して M5 レコーダーと同じ形式の CSV を作る。
 */
import { haversineDistanceM } from "../src/lib/geo/haversine";
import { CSV_HEADER } from "../src/lib/track/csv";
import type { ActivityType } from "../src/lib/activity-type";

interface Waypoint {
  lat: number;
  lon: number;
  altitudeM: number;
}

interface DemoRoute {
  activityType: ActivityType;
  startedAt: string; // ISO 8601 UTC（秒まで）
  cruiseKmh: number;
  waypoints: Waypoint[];
  /** 未測位にする区間（開始からの経過割合） */
  noFixRanges?: [from: number, to: number][];
}

export interface DemoCsv {
  fileName: string;
  activityType: ActivityType;
  csv: string;
}

const wp = (lat: number, lon: number, altitudeM: number): Waypoint => ({ lat, lon, altitudeM });

export const DEMO_ROUTES: DemoRoute[] = [
  {
    // 伊豆スカイライン（熱海峠 → 天城高原）
    activityType: "motorcycle",
    startedAt: "2026-09-20T00:12:30Z",
    cruiseKmh: 45,
    waypoints: [
      wp(35.1365, 139.0405, 690),
      wp(35.1272, 139.0461, 770),
      wp(35.1102, 139.0436, 800),
      wp(35.0921, 139.0398, 760),
      wp(35.0700, 139.0360, 720),
      wp(35.0458, 139.0275, 610),
      wp(35.0205, 139.0168, 450),
      wp(35.0004, 139.0151, 520),
      wp(34.9705, 139.0142, 600),
      wp(34.9470, 139.0098, 560),
      wp(34.9255, 139.0262, 800),
      wp(34.9068, 139.0402, 1000),
    ],
    noFixRanges: [[0.55, 0.58]],
  },
  {
    // 皇居外周（桜田門から反時計回りに 2 周）
    activityType: "bicycle",
    startedAt: "2026-09-27T22:05:10Z",
    cruiseKmh: 18,
    waypoints: Array.from({ length: 2 }, () => [
      wp(35.6777, 139.7526, 8),
      wp(35.6755, 139.7592, 6),
      wp(35.6812, 139.7621, 5),
      wp(35.6863, 139.7628, 6),
      wp(35.6912, 139.7578, 10),
      wp(35.6915, 139.7522, 18),
      wp(35.6905, 139.7468, 24),
      wp(35.6838, 139.7445, 30),
      wp(35.6795, 139.7478, 22),
    ]).flat().concat(wp(35.6777, 139.7526, 8)),
  },
  {
    // 湘南海岸（由比ヶ浜 → 江の島）
    activityType: "bicycle",
    startedAt: "2026-10-04T01:30:00Z",
    cruiseKmh: 16,
    waypoints: [
      wp(35.3112, 139.5440, 4),
      wp(35.3065, 139.5335, 6),
      wp(35.3040, 139.5262, 12),
      wp(35.3048, 139.5120, 8),
      wp(35.3062, 139.5010, 6),
      wp(35.3048, 139.4930, 5),
      wp(35.3080, 139.4860, 4),
      wp(35.3005, 139.4810, 10),
    ],
    noFixRanges: [[0.97, 1.0]],
  },
  {
    // 大阪城公園（外堀沿いを時計回りに 2 周）
    activityType: "running",
    startedAt: "2026-10-11T21:40:00Z",
    cruiseKmh: 10,
    waypoints: Array.from({ length: 2 }, () => [
      wp(34.6905, 135.5222, 12),
      wp(34.6912, 135.5262, 14),
      wp(34.6905, 135.5305, 12),
      wp(34.6868, 135.5318, 10),
      wp(34.6830, 135.5312, 14),
      wp(34.6812, 135.5280, 18),
      wp(34.6815, 135.5238, 20),
      wp(34.6845, 135.5215, 16),
      wp(34.6878, 135.5212, 14),
    ]).flat().concat(wp(34.6905, 135.5222, 12)),
  },
];

/** 固定シードの擬似乱数（mulberry32）。何度生成しても同じ内容にする */
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INTERVAL_SEC = 10;

/** 経由点を距離で補間した位置（0 ≦ ratio ≦ 1） */
function pointAt(waypoints: Waypoint[], cumulative: number[], distance: number): Waypoint {
  let i = cumulative.findIndex((d) => d >= distance);
  if (i <= 0) return waypoints[Math.max(0, i)];
  if (i === -1) i = waypoints.length - 1;
  const t = (distance - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1] || 1);
  const [a, b] = [waypoints[i - 1], waypoints[i]];
  return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t, altitudeM: a.altitudeM + (b.altitudeM - a.altitudeM) * t };
}

function formatTimestamp(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function generate(route: DemoRoute, seed: number): DemoCsv {
  const random = createRandom(seed);
  const { waypoints } = route;
  const cumulative = waypoints.reduce<number[]>((acc, p, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + haversineDistanceM(waypoints[i - 1].lat, waypoints[i - 1].lon, p.lat, p.lon));
    return acc;
  }, []);
  const total = cumulative[cumulative.length - 1];

  const rows: string[] = [];
  const startMs = Date.parse(route.startedAt);
  let distance = 0;
  for (let n = 0; distance < total; n++) {
    const ratio = distance / total;
    const time = formatTimestamp(startMs + n * INTERVAL_SEC * 1000);
    // 速度は巡航速度の 60〜120%（走り出しと止まる前は遅く）
    const ramp = Math.min(1, (n + 1) / 6, (total - distance) / 300 + 0.2);
    const speedKmh = route.cruiseKmh * (0.6 + random() * 0.6) * ramp;
    distance = Math.min(total, distance + (speedKmh / 3.6) * INTERVAL_SEC);

    if (route.noFixRanges?.some(([from, to]) => ratio >= from && ratio < to)) {
      rows.push(`${time},,,,,,`);
      continue;
    }
    const p = pointAt(waypoints, cumulative, distance);
    const jitter = () => (random() - 0.5) * 0.00008; // 約 ±4m の測位誤差
    rows.push(
      [
        time,
        (p.lat + jitter()).toFixed(6),
        (p.lon + jitter()).toFixed(6),
        (p.altitudeM + (random() - 0.5) * 3).toFixed(1),
        speedKmh.toFixed(1),
        String(8 + Math.floor(random() * 5)),
        (0.7 + random() * 0.8).toFixed(1),
      ].join(","),
    );
  }

  const fileName = `${route.startedAt.slice(0, 19).replace(/[-:]/g, "").replace("T", "_")}.csv`;
  return { fileName, activityType: route.activityType, csv: `${CSV_HEADER}\n${rows.join("\n")}\n` };
}

export function generateDemoCsvs(): DemoCsv[] {
  return DEMO_ROUTES.map((route, i) => generate(route, 20261012 + i));
}
