import { useState } from 'react';
import { Alert, FlatList, StyleSheet, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrackRow } from '@/components/track-row';
import { UploadDialog } from '@/components/upload-dialog';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTrackFiles } from '@/hooks/use-track-files';
import { removeUploadStatus, saveBaseUrl, setUploadStatus } from '@/services/app-storage';
import { shareTrackFile } from '@/services/share';
import { deleteTrackFile } from '@/services/track-files';
import { uploadTrackFile, type ActivityType } from '@/services/uploader';

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function TracksScreen() {
  const { files, statuses, recordingFile, error, reload } = useTrackFiles();
  const [uploading, setUploading] = useState<string | null>(null);

  const share = async (fileName: string) => {
    try {
      await shareTrackFile(fileName);
    } catch (e) {
      ToastAndroid.show(`書き出せませんでした（${errorText(e)}）`, ToastAndroid.LONG);
    }
  };

  const confirmDelete = (fileName: string) =>
    Alert.alert('ファイルを削除しますか？', `${fileName}\nこの操作は取り消せません。`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            deleteTrackFile(fileName);
            await removeUploadStatus(fileName);
          } catch (e) {
            ToastAndroid.show(`削除できませんでした（${errorText(e)}）`, ToastAndroid.LONG);
          }
          await reload();
        },
      },
    ]);

  const upload = async (baseUrl: string, activityType: ActivityType) => {
    if (!uploading) return;
    const result = await uploadTrackFile(uploading, baseUrl, activityType);
    if (result.ok) {
      await setUploadStatus(uploading, { state: 'uploaded', at: Date.now(), url: baseUrl });
      await saveBaseUrl(baseUrl);
      ToastAndroid.show(
        result.duplicate ? '同じ内容のファイルが登録済みのため、アップロード済みにしました' : 'アップロードしました',
        ToastAndroid.LONG,
      );
    } else {
      await setUploadStatus(uploading, { state: 'failed', at: Date.now(), url: baseUrl, message: result.message });
      ToastAndroid.show(result.message, ToastAndroid.LONG);
    }
    setUploading(null);
    await reload();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={files}
          keyExtractor={(file) => file.name}
          contentContainerStyle={styles.list}
          ListHeaderComponent={error ? <ThemedText>{error}</ThemedText> : null}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              保存されたファイルはありません
            </ThemedText>
          }
          renderItem={({ item }) => (
            <TrackRow
              file={item}
              status={statuses[item.name]}
              isRecording={item.name === recordingFile}
              recordingActive={recordingFile !== null}
              onShare={() => share(item.name)}
              onUpload={() => setUploading(item.name)}
              onDelete={() => confirmDelete(item.name)}
            />
          )}
        />
      </SafeAreaView>
      <UploadDialog fileName={uploading} onCancel={() => setUploading(null)} onSubmit={upload} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.three, paddingBottom: BottomTabInset + Spacing.three, gap: Spacing.two },
  empty: { textAlign: 'center', marginTop: Spacing.six },
});
