import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getSession, getUploadStatuses, type UploadStatus } from '@/services/app-storage';
import { listTrackFiles, type TrackFileInfo } from '@/services/track-files';

/** 保存済みファイルの一覧とアップロード状態。画面にフォーカスしたときに読み直す */
export function useTrackFiles() {
  const [files, setFiles] = useState<TrackFileInfo[]>([]);
  const [statuses, setStatuses] = useState<Record<string, UploadStatus>>({});
  const [recordingFile, setRecordingFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setFiles(listTrackFiles());
      setStatuses(await getUploadStatuses());
      setRecordingFile((await getSession())?.fileName ?? null);
      setError(null);
    } catch (e) {
      setError(`ファイルを読み込めませんでした（${e instanceof Error ? e.message : String(e)}）`);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { files, statuses, recordingFile, error, reload };
}
