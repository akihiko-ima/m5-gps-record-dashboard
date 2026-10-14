import "server-only";

import { isTrackError, toHttpStatus, TrackError } from "@/lib/errors";

import { MAX_CSV_BYTES, type ImportTrackInput, type TrackService } from "./track-service";

/** アップロードフォーム（`file` と `activityType`）を importTrack の入力にする。種別は importTrack で検証する */
export async function readUploadForm(formData: FormData): Promise<ImportTrackInput> {
  const file = formData.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
    throw new TrackError("INVALID_FORMAT", "CSV ファイル（.csv）を選択してください");
  }
  if (file.size > MAX_CSV_BYTES) {
    throw new TrackError("TOO_LARGE", "ファイルサイズが 10MB を超えています");
  }
  return {
    fileName: file.name,
    bytes: new Uint8Array(await file.arrayBuffer()),
    activityType: formData.get("activityType"),
  };
}

/** POST /api/tracks の本体。成功時 201 + TrackSummary、失敗時 { code, message } */
export async function handleUploadRequest(request: Request, service: TrackService): Promise<Response> {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new TrackError("INVALID_FORMAT", "multipart/form-data で送信してください");
    }
    const summary = service.importTrack(await readUploadForm(formData));
    return Response.json(summary, { status: 201 });
  } catch (e) {
    if (isTrackError(e)) {
      return Response.json({ code: e.code, message: e.message }, { status: toHttpStatus(e.code) });
    }
    console.error(e);
    return Response.json({ code: "INTERNAL", message: "サーバーでエラーが発生しました" }, { status: 500 });
  }
}
