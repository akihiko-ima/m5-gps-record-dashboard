export type TrackErrorCode =
  | "INVALID_FORMAT" // ヘッダー不正・CSV として読めない
  | "NO_FIX" // 測位済みの行がない
  | "DUPLICATE" // 同じ内容が登録済み
  | "TOO_LARGE" // サイズ上限超過
  | "INVALID_ACTIVITY_TYPE" // 走行種別が不正
  | "NOT_FOUND"; // 指定 id のトラックがない

export class TrackError extends Error {
  readonly code: TrackErrorCode;

  constructor(code: TrackErrorCode, message: string) {
    super(message);
    this.name = "TrackError";
    this.code = code;
  }
}

/**
 * TrackError かどうか。本番ビルドではモジュールがチャンクごとに複製され instanceof が効かないことがあるため、
 * name と code で判定する
 */
export function isTrackError(e: unknown): e is TrackError {
  return e instanceof Error && e.name === "TrackError" && typeof (e as Partial<TrackError>).code === "string";
}

/** API の応答に使う HTTP ステータス */
export function toHttpStatus(code: TrackErrorCode): number {
  switch (code) {
    case "DUPLICATE":
      return 409;
    case "NOT_FOUND":
      return 404;
    case "TOO_LARGE":
      return 413;
    default:
      return 400;
  }
}
