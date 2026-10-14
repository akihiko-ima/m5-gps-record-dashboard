import { CSV_HEADER, formatRow, formatRows, parseTrackFileName, toIsoUtc, trackFileName, type Fix } from './csv';

const t0 = Date.UTC(2026, 9, 11, 1, 23, 40, 512);
const fix: Fix = { timestamp: t0, latitude: 35.6586361, longitude: 139.7454072, altitude: 12.34, speed: 11.8 };

describe('csv', () => {
  it('ヘッダーは M5 版と同じ', () => {
    expect(CSV_HEADER).toBe('timestamp,latitude,longitude,altitude_m,speed_kmh,satellites,hdop');
  });

  it('UTC をミリ秒なしで整形する', () => {
    expect(toIsoUtc(t0)).toBe('2026-10-11T01:23:40Z');
  });

  it('測位行: 緯度経度 6 桁、高度・速度（km/h）1 桁、衛星数と HDOP は空欄', () => {
    expect(formatRow({ time: t0, fix })).toBe('2026-10-11T01:23:40Z,35.658636,139.745407,12.3,42.5,,');
  });

  it('高度・速度がない（null・負の速度）ときは空欄', () => {
    expect(formatRow({ time: t0, fix: { ...fix, altitude: null, speed: null } })).toBe(
      '2026-10-11T01:23:40Z,35.658636,139.745407,,,,',
    );
    expect(formatRow({ time: t0, fix: { ...fix, speed: -1 } })).toBe(
      '2026-10-11T01:23:40Z,35.658636,139.745407,12.3,,,',
    );
  });

  it('負の高度はそのまま書く', () => {
    expect(formatRow({ time: t0, fix: { ...fix, altitude: -3.25, speed: 0 } })).toBe(
      '2026-10-11T01:23:40Z,35.658636,139.745407,-3.3,0.0,,',
    );
  });

  it('未測位行は timestamp 以外が空欄', () => {
    expect(formatRow({ time: t0, fix: null })).toBe('2026-10-11T01:23:40Z,,,,,,');
  });

  it('複数行は LF 区切りで末尾にも LF', () => {
    expect(
      formatRows([
        { time: t0, fix: null },
        { time: t0 + 10_000, fix: null },
      ]),
    ).toBe('2026-10-11T01:23:40Z,,,,,,\n2026-10-11T01:23:50Z,,,,,,\n');
  });

  it('ファイル名は記録開始時刻（UTC）', () => {
    expect(trackFileName(t0)).toBe('20261011_012340.csv');
    expect(parseTrackFileName('20261011_012340.csv')).toBe(Date.UTC(2026, 9, 11, 1, 23, 40));
    expect(parseTrackFileName('memo.csv')).toBeNull();
  });
});
