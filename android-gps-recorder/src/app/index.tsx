import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Palette, Spacing } from '@/constants/theme';
import { useRecorder, type RecorderStatus } from '@/hooks/use-recorder';
import type { Fix } from '@/lib/csv';
import { formatDuration } from '@/lib/format';
import { isFresh } from '@/lib/slots';

const STATE_LABELS: Record<RecorderStatus['kind'], { label: string; color: string }> = {
  loading: { label: '読み込み中', color: Palette.neutral },
  idle: { label: '待機中', color: Palette.neutral },
  checking: { label: '測位を確認中', color: Palette.primary },
  fixError: { label: '測位エラー', color: Palette.warning },
  permissionError: { label: '権限がありません', color: Palette.warning },
  recording: { label: '記録中', color: Palette.danger },
  saveError: { label: '保存エラー', color: Palette.danger },
  interrupted: { label: '記録が中断されています', color: Palette.warning },
};

const PERMISSION_MESSAGES = {
  foreground: '位置情報の権限がありません。設定で位置情報を「アプリの使用中のみ許可」以上にしてください。',
  background:
    '画面オフの間も記録するには、位置情報を「常に許可」にする必要があります。設定の「権限」→「位置情報」で変更してください。',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

function FixInfo({ fix, now }: { fix: Fix | null; now: number }) {
  const fresh = isFresh(fix, now);
  return (
    <>
      <InfoRow
        label="GPS"
        value={
          fresh ? `測位済み（精度 ${fix.accuracy != null ? `±${Math.round(fix.accuracy)} m` : '不明'}）` : '未測位'
        }
      />
      <InfoRow label="緯度・経度" value={fix ? `${fix.latitude.toFixed(6)}, ${fix.longitude.toFixed(6)}` : '—'} />
    </>
  );
}

export default function RecordScreen() {
  const { status, preview, now, message, start, stop, resume, finishInterrupted } = useRecorder();
  const { label, color } = STATE_LABELS[status.kind];
  const session = 'session' in status ? status.session : null;

  const confirmStop = () =>
    Alert.alert('記録を終了しますか？', undefined, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '終了する', style: 'destructive', onPress: stop },
    ]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.statePill, { backgroundColor: color }]}>
            <ThemedText style={styles.stateLabel}>{label}</ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <FixInfo fix={session?.lastFix ?? preview} now={now} />
            {status.kind === 'recording' && (
              <>
                <InfoRow label="記録件数" value={`${status.session.rowCount} 件`} />
                <InfoRow label="経過時間" value={formatDuration(now - status.session.startedAt)} />
                <InfoRow label="ファイル" value={status.session.fileName} />
              </>
            )}
          </ThemedView>

          {status.kind === 'fixError' && (
            <ThemedText style={styles.notice}>
              GPS 未測位のため記録を開始できません。屋外など上空の開けた場所で再試行してください。
            </ThemedText>
          )}
          {status.kind === 'permissionError' && (
            <ThemedText style={styles.notice}>{PERMISSION_MESSAGES[status.reason]}</ThemedText>
          )}
          {status.kind === 'saveError' && (
            <ThemedText style={styles.notice}>
              {status.session.error}
              {'\n'}記録は停止しました。{status.session.fileName} にはそれまでの {status.session.rowCount}{' '}
              件が保存されています。
            </ThemedText>
          )}
          {status.kind === 'interrupted' && (
            <ThemedText style={styles.notice}>
              アプリが終了されたため、{status.session.fileName} の記録が中断されています（{status.session.rowCount}{' '}
              件まで保存済み）。再開すると、中断していた時間は未測位として記録されます。
            </ThemedText>
          )}
          {message && <ThemedText style={styles.notice}>{message}</ThemedText>}
        </ScrollView>

        <View style={styles.actions}>
          {(status.kind === 'idle' || status.kind === 'loading') && (
            <Button label="記録開始" onPress={start} disabled={status.kind === 'loading'} />
          )}
          {status.kind === 'checking' && <Button label="測位を確認中" loading />}
          {status.kind === 'fixError' && <Button label="再試行" onPress={start} />}
          {status.kind === 'permissionError' && (
            <>
              <Button label="設定を開く" onPress={() => Linking.openSettings()} />
              <Button label="再試行" variant="secondary" onPress={start} />
            </>
          )}
          {status.kind === 'recording' && <Button label="記録終了" variant="danger" onPress={confirmStop} />}
          {status.kind === 'saveError' && <Button label="確認" onPress={stop} />}
          {status.kind === 'interrupted' && (
            <>
              <Button label="記録を再開" onPress={resume} />
              <Button label="記録を終了" variant="secondary" onPress={finishInterrupted} />
            </>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingBottom: BottomTabInset },
  content: { padding: Spacing.three, gap: Spacing.three },
  statePill: { alignSelf: 'center', borderRadius: 999, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  stateLabel: { color: Palette.onColor, fontSize: 20, fontWeight: '700' },
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  notice: { lineHeight: 24 },
  actions: { padding: Spacing.three, gap: Spacing.two },
});
