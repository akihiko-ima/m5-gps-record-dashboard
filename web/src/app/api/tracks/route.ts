import { getTrackService } from "@/server/track-service";
import { handleUploadRequest } from "@/server/upload-form";

/** Android アプリからのアップロード。ダッシュボードはリクエストごとに描画するため再検証は不要 */
export async function POST(request: Request) {
  return handleUploadRequest(request, getTrackService());
}
