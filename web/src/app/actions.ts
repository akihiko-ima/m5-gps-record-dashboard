"use server";

import { refresh } from "next/cache";

import { isTrackError, type TrackErrorCode } from "@/lib/errors";
import type { TrackSummary } from "@/lib/track/types";
import { getTrackService, MAX_CSV_BYTES } from "@/server/track-service";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: TrackErrorCode | "INTERNAL"; message: string };

function run<T>(fn: () => T): ActionResult<T> {
  try {
    const data = fn();
    refresh();
    return { ok: true, data };
  } catch (e) {
    if (isTrackError(e)) return { ok: false, code: e.code, message: e.message };
    console.error(e);
    return { ok: false, code: "INTERNAL", message: "サーバーでエラーが発生しました" };
  }
}

export async function uploadTrack(formData: FormData): Promise<ActionResult<TrackSummary>> {
  const file = formData.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
    return { ok: false, code: "INVALID_FORMAT", message: "CSV ファイル（.csv）を選択してください" };
  }
  if (file.size > MAX_CSV_BYTES) {
    return { ok: false, code: "TOO_LARGE", message: "ファイルサイズが 10MB を超えています" };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return run(() =>
    getTrackService().importTrack({ fileName: file.name, bytes, activityType: formData.get("activityType") }),
  );
}

export async function updateActivityType(id: string, activityType: string): Promise<ActionResult<TrackSummary>> {
  return run(() => getTrackService().updateActivityType(id, activityType));
}

export async function deleteTrack(id: string): Promise<ActionResult<null>> {
  return run(() => {
    getTrackService().deleteTrack(id);
    return null;
  });
}
