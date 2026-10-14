import { Directory, File, Paths } from 'expo-file-system';

import { parseTrackFileName } from '@/lib/csv';

export type TrackFileInfo = {
  name: string;
  uri: string;
  size: number;
  /** ヘッダーを除いた行数 */
  rowCount: number;
  startedAt: number;
};

function tracksDir(): Directory {
  const dir = new Directory(Paths.document, 'tracks');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function trackFile(name: string): File {
  return new File(tracksDir(), name);
}

/** 新しいファイルを作って内容を書く */
export function createTrackFile(name: string, content: string): void {
  const file = trackFile(name);
  file.create();
  file.write(content);
}

/** ファイルの末尾に追記する */
export function appendToTrackFile(name: string, content: string): void {
  trackFile(name).write(content, { append: true });
}

function countRows(file: File): number {
  const lines = file
    .textSync()
    .split('\n')
    .filter((line) => line !== '');
  return Math.max(lines.length - 1, 0);
}

/** tracks/ の CSV を記録開始の新しい順に返す */
export function listTrackFiles(): TrackFileInfo[] {
  return tracksDir()
    .list()
    .flatMap((entry) => {
      if (!(entry instanceof File)) return [];
      const startedAt = parseTrackFileName(entry.name);
      if (startedAt === null) return [];
      return [{ name: entry.name, uri: entry.uri, size: entry.size ?? 0, rowCount: countRows(entry), startedAt }];
    })
    .sort((a, b) => b.startedAt - a.startedAt);
}

export function deleteTrackFile(name: string): void {
  const file = trackFile(name);
  if (file.exists) file.delete();
}
