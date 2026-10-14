import { UploadType } from 'expo-file-system';

import { uploadEndpoint } from '@/lib/url';

import { trackFile } from './track-files';

export type ActivityType = 'motorcycle' | 'bicycle';

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'motorcycle', label: '🏍 バイク' },
  { value: 'bicycle', label: '🚲 自転車' },
];

export type UploadResult = { ok: true; duplicate: boolean } | { ok: false; message: string };

const UPLOAD_TIMEOUT_MS = 15_000;

function errorMessage(body: string, status: number): string {
  try {
    const { message } = JSON.parse(body) as { message?: unknown };
    if (typeof message === 'string') return message;
  } catch {
    // JSON でない応答（別のサーバーなど）
  }
  return `アップロードに失敗しました（HTTP ${status}）`;
}

/** CSV を Web ダッシュボードの POST /api/tracks に送る。登録済み（409 DUPLICATE）も成功として扱う */
export async function uploadTrackFile(
  fileName: string,
  baseUrl: string,
  activityType: ActivityType,
): Promise<UploadResult> {
  const task = trackFile(fileName).createUploadTask(uploadEndpoint(baseUrl), {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: 'text/csv',
    parameters: { activityType },
  });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    task.cancel();
  }, UPLOAD_TIMEOUT_MS);
  try {
    const { status, body } = await task.uploadAsync();
    if (status === 201) return { ok: true, duplicate: false };
    if (status === 409) return { ok: true, duplicate: true };
    return { ok: false, message: errorMessage(body, status) };
  } catch {
    return {
      ok: false,
      message: timedOut
        ? '応答がありませんでした。URL とサーバーが起動しているかを確認してください'
        : '接続できませんでした。URL と、サーバーと同じ Wi-Fi に接続しているかを確認してください',
    };
  } finally {
    clearTimeout(timer);
  }
}
