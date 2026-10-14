"use server";

import { refresh } from "next/cache";

import { isTrackError, type TrackErrorCode } from "@/lib/errors";
import type { TrackSummary } from "@/lib/track/types";
import { getTrackService, type ImportTrackInput } from "@/server/track-service";
import { readUploadForm } from "@/server/upload-form";

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
  let input: ImportTrackInput;
  try {
    input = await readUploadForm(formData);
  } catch (e) {
    if (isTrackError(e)) return { ok: false, code: e.code, message: e.message };
    throw e;
  }
  return run(() => getTrackService().importTrack(input));
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
