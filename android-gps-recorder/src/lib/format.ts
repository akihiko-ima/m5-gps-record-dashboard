const pad = (n: number) => String(n).padStart(2, '0');

/** 端末のタイムゾーンでの日時（例: 2026/10/14 09:05） */
export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 経過時間（例: 45秒、12分34秒、1時間02分） */
export function formatDuration(ms: number): string {
  const total = Math.max(Math.floor(ms / 1000), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}時間${pad(m)}分`;
  if (m > 0) return `${m}分${pad(s)}秒`;
  return `${s}秒`;
}

/** ファイルサイズ（例: 820 B、12.3 KB、1.5 MB） */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
