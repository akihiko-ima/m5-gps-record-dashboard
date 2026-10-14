import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Fix } from '@/lib/csv';

/** AsyncStorage のキー（ここ以外で直接使わない） */
const KEYS = {
  session: 'recording/session',
  baseUrl: 'upload/base-url',
  uploadStatus: 'upload/status',
} as const;

/** 記録中のセッション。バックグラウンドのタスクと画面の両方から読み書きする */
export type RecordingSession = {
  fileName: string;
  startedAt: number;
  nextSlotAt: number;
  rowCount: number;
  lastFix: Fix | null;
  /** 書き込みに失敗したときのメッセージ（記録は停止済み） */
  error?: string;
};

export type UploadStatus = {
  state: 'uploaded' | 'failed';
  at: number;
  url: string;
  message?: string;
};

async function readJson<T>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(key);
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export const getSession = () => readJson<RecordingSession>(KEYS.session);
export const saveSession = (session: RecordingSession) => AsyncStorage.setItem(KEYS.session, JSON.stringify(session));
export const clearSession = () => AsyncStorage.removeItem(KEYS.session);

export const getBaseUrl = () => AsyncStorage.getItem(KEYS.baseUrl);
export const saveBaseUrl = (url: string) => AsyncStorage.setItem(KEYS.baseUrl, url);

export async function getUploadStatuses(): Promise<Record<string, UploadStatus>> {
  return (await readJson<Record<string, UploadStatus>>(KEYS.uploadStatus)) ?? {};
}

export async function setUploadStatus(fileName: string, status: UploadStatus): Promise<void> {
  const statuses = await getUploadStatuses();
  await AsyncStorage.setItem(KEYS.uploadStatus, JSON.stringify({ ...statuses, [fileName]: status }));
}

export async function removeUploadStatus(fileName: string): Promise<void> {
  const { [fileName]: _removed, ...rest } = await getUploadStatuses();
  await AsyncStorage.setItem(KEYS.uploadStatus, JSON.stringify(rest));
}
