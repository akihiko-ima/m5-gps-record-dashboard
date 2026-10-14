import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from 'react-native';

import { CSV_HEADER, formatRows, trackFileName, type Fix } from '@/lib/csv';
import { fillSlots, isFresh, RECORD_INTERVAL_MS, slotStart } from '@/lib/slots';

import { clearSession, getSession, saveSession, type RecordingSession } from './app-storage';
import { LOCATION_TASK, stopLocationUpdates, toFix, writeSlots } from './location-task';
import { createTrackFile, deleteTrackFile } from './track-files';

export type PermissionResult = { ok: true } | { ok: false; reason: 'foreground' | 'background' };

/** 「アプリ使用中のみ」→「常に許可」の順に求める。常駐通知の権限（Android 13 以降）は任意 */
export async function ensurePermissions(): Promise<PermissionResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return { ok: false, reason: 'foreground' };

  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) return { ok: false, reason: 'background' };

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  return { ok: true };
}

const FIX_TIMEOUT_MS = 15_000;

/** 現在地を取得する。15 秒以内に取れない・古い位置しかない場合は null（未測位） */
export async function checkFix(): Promise<Fix | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), FIX_TIMEOUT_MS));
  try {
    const location = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation }),
      timeout,
    ]);
    const fix = location && toFix(location);
    return isFresh(fix, Date.now()) ? fix : null;
  } catch {
    return null;
  }
}

function startLocationUpdates(): Promise<void> {
  return Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: RECORD_INTERVAL_MS,
    distanceInterval: 0,
    foregroundService: {
      notificationTitle: 'GPS 記録中',
      notificationBody: '走行を記録しています。終了するにはアプリを開いてください',
      killServiceOnDestroy: false,
    },
  });
}

/** 測位済みの位置 fix で記録を開始する。ファイルにはヘッダーと 1 行目を書く */
export async function startRecording(fix: Fix): Promise<RecordingSession> {
  const startedAt = slotStart(Date.now());
  const fileName = trackFileName(startedAt);
  const { rows, nextSlotAt, lastFix } = fillSlots({ nextSlotAt: startedAt, lastFix: fix }, [], startedAt);

  createTrackFile(fileName, `${CSV_HEADER}\n${formatRows(rows)}`);
  const session: RecordingSession = { fileName, startedAt, nextSlotAt, rowCount: rows.length, lastFix };
  await saveSession(session);
  try {
    await startLocationUpdates();
  } catch (e) {
    await clearSession();
    deleteTrackFile(fileName);
    throw e;
  }
  return session;
}

/** 終了時刻まで行を埋めてから位置更新を止める。エラーで停止済みのセッションもここで片付ける */
export async function stopRecording(): Promise<RecordingSession | null> {
  const session = await writeSlots([], Date.now());
  await stopLocationUpdates();
  await clearSession();
  return session;
}

/** 中断された記録（セッションはあるが位置更新が動いていない）を返す */
export async function getInterruptedSession(): Promise<RecordingSession | null> {
  const session = await getSession();
  if (!session || session.error) return null;
  return (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) ? null : session;
}

/** 中断された記録を再開する。中断中の時刻は、次に位置を受け取ったときに未測位行で埋まる */
export async function resumeRecording(): Promise<void> {
  await startLocationUpdates();
}

/** 中断された記録を、追記せずに終了する（中断中の時刻の行は書かない） */
export async function finishInterruptedSession(): Promise<void> {
  await clearSession();
}

export { getSession };
