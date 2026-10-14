export type UrlResult = { ok: true; url: string } | { ok: false; message: string };

const BASE_URL_PATTERN = /^https?:\/\/[^\s/?#]+(\/[^\s?#]*)?$/i;

/** アップロード先（Web ダッシュボード）の URL を正規化する。前後の空白と末尾の / を除く */
export function normalizeBaseUrl(input: string): UrlResult {
  const url = input.trim().replace(/\/+$/, '');
  if (url === '') return { ok: false, message: 'URL を入力してください' };
  if (!BASE_URL_PATTERN.test(url)) {
    return {
      ok: false,
      message: 'http:// または https:// で始まる URL を入力してください（例: http://192.168.1.10:3000）',
    };
  }
  return { ok: true, url };
}

/** アップロード API の URL */
export function uploadEndpoint(baseUrl: string): string {
  return `${baseUrl}/api/tracks`;
}
