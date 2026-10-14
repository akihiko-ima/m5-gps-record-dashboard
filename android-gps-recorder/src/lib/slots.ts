import type { Fix, TrackRow } from './csv';

/** 記録間隔（M5 版と同じ 10 秒） */
export const RECORD_INTERVAL_MS = 10_000;
/** これより古い位置は未測位として扱う */
export const FIX_MAX_AGE_MS = 20_000;

export type SlotState = {
  /** 次に書く行の時刻 */
  nextSlotAt: number;
  /** 最後に受け取った位置 */
  lastFix: Fix | null;
};

/** 位置が now の時点で測位済みとみなせるか */
export function isFresh(fix: Fix | null, now: number): fix is Fix {
  return fix !== null && now - fix.timestamp <= FIX_MAX_AGE_MS;
}

/** 記録開始時刻（行の時刻は秒単位にそろえる） */
export function slotStart(now: number): number {
  return Math.floor(now / 1000) * 1000;
}

/**
 * 前回の行から now までの 10 秒ごとの行を作る。
 * 各時刻では、その時刻以前で最新の位置が 20 秒以内なら測位行、そうでなければ未測位行にする。
 * タイマーはバックグラウンドで止まるため、位置を受け取ったとき（と記録終了時）にまとめて埋める。
 */
export function fillSlots(state: SlotState, fixes: Fix[], now: number): SlotState & { rows: TrackRow[] } {
  const candidates = [...(state.lastFix ? [state.lastFix] : []), ...fixes].sort((a, b) => a.timestamp - b.timestamp);

  const rows: TrackRow[] = [];
  let nextSlotAt = state.nextSlotAt;
  let i = -1; // candidates[i] が「時刻 nextSlotAt 以前で最新の位置」
  while (nextSlotAt <= now) {
    while (i + 1 < candidates.length && candidates[i + 1].timestamp <= nextSlotAt) i++;
    const fix = i >= 0 ? candidates[i] : null;
    rows.push({ time: nextSlotAt, fix: isFresh(fix, nextSlotAt) ? fix : null });
    nextSlotAt += RECORD_INTERVAL_MS;
  }

  return { rows, nextSlotAt, lastFix: candidates.at(-1) ?? null };
}
