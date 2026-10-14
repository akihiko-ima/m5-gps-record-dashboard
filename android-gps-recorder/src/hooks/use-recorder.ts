import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ToastAndroid } from 'react-native';

import type { Fix } from '@/lib/csv';
import type { RecordingSession } from '@/services/app-storage';
import { toFix } from '@/services/location-task';
import {
  checkFix,
  ensurePermissions,
  finishInterruptedSession,
  getInterruptedSession,
  getSession,
  resumeRecording,
  startRecording,
  stopRecording,
} from '@/services/recorder';

export type RecorderStatus =
  | { kind: 'loading' }
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'fixError' }
  | { kind: 'permissionError'; reason: 'foreground' | 'background' }
  | { kind: 'recording'; session: RecordingSession }
  | { kind: 'saveError'; session: RecordingSession }
  | { kind: 'interrupted'; session: RecordingSession };

const POLL_INTERVAL_MS = 1000;

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** 記録画面の状態。記録中はセッションを 1 秒ごとに読み直し、待機中は画面表示中だけ現在地を表示する */
export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>({ kind: 'loading' });
  const [preview, setPreview] = useState<Fix | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const interrupted = await getInterruptedSession();
    if (interrupted) return setStatus({ kind: 'interrupted', session: interrupted });
    const session = await getSession();
    if (!session) return setStatus((s) => (s.kind === 'recording' || s.kind === 'loading' ? { kind: 'idle' } : s));
    setStatus({ kind: session.error ? 'saveError' : 'recording', session });
  }, []);

  // 画面を開くたびに、バックグラウンドで進んだ記録や中断を反映する
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const recording = status.kind === 'recording';

  // 記録中: 件数・経過時間の更新
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      reload();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [recording, reload]);

  // 待機中: 画面を表示している間だけ測位状態を表示する（権限がすでにある場合のみ）
  useFocusEffect(
    useCallback(() => {
      if (recording) return;
      let subscription: Location.LocationSubscription | null = null;
      let cancelled = false;
      (async () => {
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (!granted || cancelled) return;
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 5000, distanceInterval: 0 },
          (location) => setPreview(toFix(location)),
        );
        if (cancelled) subscription.remove();
      })();
      const timer = setInterval(() => setNow(Date.now()), POLL_INTERVAL_MS);
      return () => {
        cancelled = true;
        subscription?.remove();
        clearInterval(timer);
      };
    }, [recording]),
  );

  const start = useCallback(async () => {
    setMessage(null);
    setStatus({ kind: 'checking' });
    try {
      const permission = await ensurePermissions();
      if (!permission.ok) return setStatus({ kind: 'permissionError', reason: permission.reason });
      const fix = await checkFix();
      if (!fix) return setStatus({ kind: 'fixError' });
      setPreview(fix);
      const session = await startRecording(fix);
      setNow(Date.now());
      setStatus({ kind: 'recording', session });
    } catch (e) {
      setMessage(`記録を開始できませんでした（${errorText(e)}）`);
      setStatus({ kind: 'idle' });
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      const session = await stopRecording();
      setStatus({ kind: 'idle' });
      if (session && !session.error) {
        ToastAndroid.show(`${session.fileName} を保存しました（${session.rowCount} 件）`, ToastAndroid.LONG);
      }
    } catch (e) {
      setMessage(`記録を終了できませんでした（${errorText(e)}）`);
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      await resumeRecording();
      await reload();
    } catch (e) {
      setMessage(`記録を再開できませんでした（${errorText(e)}）`);
    }
  }, [reload]);

  const finishInterrupted = useCallback(async () => {
    await finishInterruptedSession();
    setStatus({ kind: 'idle' });
  }, []);

  return { status, preview, now, message, start, stop, resume, finishInterrupted };
}
