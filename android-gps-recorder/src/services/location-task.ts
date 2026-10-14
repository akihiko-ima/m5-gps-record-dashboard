import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { formatRows, type Fix } from '@/lib/csv';
import { fillSlots } from '@/lib/slots';

import { getSession, saveSession, type RecordingSession } from './app-storage';
import { appendToTrackFile } from './track-files';

export const LOCATION_TASK = 'gps-recorder-location';

export function toFix({ timestamp, coords }: Location.LocationObject): Fix {
  return {
    timestamp,
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude,
    speed: coords.speed,
    accuracy: coords.accuracy,
  };
}

// タスクの呼び出しと記録終了が重なっても行が重複しないよう、書き込みを 1 本の Promise チェーンで直列化する
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn);
  queue = result.catch(() => undefined);
  return result;
}

/**
 * 記録中のファイルに now までの 10 秒ごとの行を追記し、セッションを更新する。
 * 記録中でない・エラーで停止済みのときは何もしない。書き込みに失敗したら位置更新を止め、セッションにエラーを残す
 */
export function writeSlots(fixes: Fix[], now: number): Promise<RecordingSession | null> {
  return serialize(async () => {
    const session = await getSession();
    if (!session || session.error) return session;

    const { rows, nextSlotAt, lastFix } = fillSlots(session, fixes, now);
    let next: RecordingSession = { ...session, nextSlotAt, lastFix };
    if (rows.length > 0) {
      try {
        appendToTrackFile(session.fileName, formatRows(rows));
        next = { ...next, rowCount: session.rowCount + rows.length };
      } catch (e) {
        next = { ...session, error: `ファイルに書き込めませんでした（${e instanceof Error ? e.message : String(e)}）` };
        await stopLocationUpdates();
      }
    }
    await saveSession(next);
    return next;
  });
}

export async function stopLocationUpdates(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

// OS から位置を受け取るタスク。アプリの最上位で定義する必要があるため、src/app/_layout.tsx で最初に import する
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('location task error', error.message);
    return;
  }
  await writeSlots((data?.locations ?? []).map(toFix), Date.now());
});
