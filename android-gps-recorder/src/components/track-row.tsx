import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UploadStatusBadge } from '@/components/upload-status-badge';
import { Spacing } from '@/constants/theme';
import { formatDateTime, formatDuration, formatSize } from '@/lib/format';
import { RECORD_INTERVAL_MS } from '@/lib/slots';
import type { UploadStatus } from '@/services/app-storage';
import type { TrackFileInfo } from '@/services/track-files';

type Props = {
  file: TrackFileInfo;
  status: UploadStatus | undefined;
  /** このファイルを記録中 */
  isRecording: boolean;
  /** いずれかのファイルを記録中（アップロード・削除を無効にする） */
  recordingActive: boolean;
  onShare: () => void;
  onUpload: () => void;
  onDelete: () => void;
};

export function TrackRow({ file, status, isRecording, recordingActive, onShare, onUpload, onDelete }: Props) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <View style={styles.header}>
        <ThemedText type="smallBold">{formatDateTime(file.startedAt)}</ThemedText>
        {isRecording ? <ThemedText type="smallBold">記録中</ThemedText> : <UploadStatusBadge status={status} />}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {file.name}・{formatSize(file.size)}・{file.rowCount} 件（約{' '}
        {formatDuration(file.rowCount * RECORD_INTERVAL_MS)}）
      </ThemedText>
      {status?.state === 'failed' && status.message && (
        <ThemedText type="small" themeColor="textSecondary">
          前回の失敗: {status.message}
        </ThemedText>
      )}
      <View style={styles.actions}>
        <Button label="書き出し" size="small" variant="secondary" onPress={onShare} disabled={isRecording} />
        <Button label="アップロード" size="small" onPress={onUpload} disabled={recordingActive} />
        <Button label="削除" size="small" variant="danger" onPress={onDelete} disabled={recordingActive} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.two },
});
