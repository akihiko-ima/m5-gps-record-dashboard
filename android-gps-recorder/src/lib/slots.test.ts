import type { Fix } from './csv';
import { fillSlots, isFresh, RECORD_INTERVAL_MS, slotStart, type SlotState } from './slots';

const T = Date.UTC(2026, 9, 11, 1, 0, 0);
const sec = (s: number) => T + s * 1000;
const fixAt = (s: number, latitude = 35): Fix => ({
  timestamp: sec(s),
  latitude,
  longitude: 139,
  altitude: 10,
  speed: 5,
});
const summarize = (rows: { time: number; fix: Fix | null }[]) =>
  rows.map((r) => [(r.time - T) / 1000, r.fix ? (r.fix.timestamp - T) / 1000 : null]);

describe('slots', () => {
  it('記録開始時は開始時刻の 1 行を書く', () => {
    const start = fixAt(0);
    const result = fillSlots({ nextSlotAt: sec(0), lastFix: start }, [], sec(0));
    expect(summarize(result.rows)).toEqual([[0, 0]]);
    expect(result.nextSlotAt).toBe(sec(10));
    expect(result.lastFix).toBe(start);
  });

  it('次の時刻に達していなければ行を書かない', () => {
    const result = fillSlots({ nextSlotAt: sec(10), lastFix: fixAt(0) }, [fixAt(5)], sec(9));
    expect(result.rows).toEqual([]);
    expect(result.nextSlotAt).toBe(sec(10));
    expect(result.lastFix?.timestamp).toBe(sec(5));
  });

  it('間隔が 9〜11 秒に揺らいでも 10 秒ごとの行になる', () => {
    let state: SlotState = { nextSlotAt: sec(10), lastFix: fixAt(0) };
    const rows = [];
    for (const s of [9, 20, 31, 40, 49]) {
      const r = fillSlots(state, [fixAt(s)], sec(s));
      rows.push(...r.rows);
      state = r;
    }
    expect(summarize(rows)).toEqual([
      [10, 9],
      [20, 20],
      [30, 20],
      [40, 40],
    ]);
  });

  it('位置が届かない区間は、次に届いたときに未測位行で埋まる', () => {
    const result = fillSlots({ nextSlotAt: sec(10), lastFix: fixAt(0) }, [fixAt(60)], sec(60));
    // 10, 20 秒は 0 秒の位置から 20 秒以内。30〜50 秒は古すぎるため未測位。60 秒は新しい位置
    expect(summarize(result.rows)).toEqual([
      [10, 0],
      [20, 0],
      [30, null],
      [40, null],
      [50, null],
      [60, 60],
    ]);
    expect(result.nextSlotAt).toBe(sec(70));
  });

  it('記録終了時は、位置がなくても終了時刻まで埋める', () => {
    const result = fillSlots({ nextSlotAt: sec(10), lastFix: fixAt(5) }, [], sec(35));
    expect(summarize(result.rows)).toEqual([
      [10, 5],
      [20, 5],
      [30, null],
    ]);
  });

  it('まとめて届いた位置（順不同）から各時刻の位置を選ぶ', () => {
    const result = fillSlots({ nextSlotAt: sec(10), lastFix: null }, [fixAt(28), fixAt(8), fixAt(18)], sec(30));
    expect(summarize(result.rows)).toEqual([
      [10, 8],
      [20, 18],
      [30, 28],
    ]);
    expect(result.lastFix?.timestamp).toBe(sec(28));
  });

  it('20 秒ちょうどは測位済み、それより古いと未測位', () => {
    expect(isFresh(fixAt(0), sec(20))).toBe(true);
    expect(isFresh(fixAt(0), sec(20) + 1)).toBe(false);
    expect(isFresh(null, sec(0))).toBe(false);
  });

  it('開始時刻は秒単位にそろえる', () => {
    expect(slotStart(sec(3) + 999)).toBe(sec(3));
    expect(RECORD_INTERVAL_MS).toBe(10_000);
  });
});
