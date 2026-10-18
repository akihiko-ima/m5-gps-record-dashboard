import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { normalizeBaseUrl } from '@/lib/url';
import { getBaseUrl } from '@/services/app-storage';
import { ACTIVITY_TYPES, type ActivityType } from '@/services/uploader';

type Props = {
  /** アップロードするファイル名。null なら閉じる */
  fileName: string | null;
  onCancel: () => void;
  /** 送信する。終わるまでダイアログは送信中の表示になる */
  onSubmit: (baseUrl: string, activityType: ActivityType) => Promise<void>;
};

export function UploadDialog({ fileName, onCancel, onSubmit }: Props) {
  const [sending, setSending] = useState(false);
  return (
    <Modal visible={fileName !== null} transparent animationType="fade" onRequestClose={sending ? undefined : onCancel}>
      {/* ファイルごとに作り直し、種別を未選択に戻す */}
      {fileName && (
        <UploadForm
          key={fileName}
          fileName={fileName}
          sending={sending}
          setSending={setSending}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

type FormProps = Omit<Props, 'fileName'> & {
  fileName: string;
  sending: boolean;
  setSending: (sending: boolean) => void;
};

function UploadForm({ fileName, sending, setSending, onCancel, onSubmit }: FormProps) {
  const theme = useTheme();
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // 前回成功した URL を入れておく（入力が始まっていれば上書きしない）
  useEffect(() => {
    getBaseUrl().then((saved) => setUrl((current) => current || saved || ''));
  }, []);

  const submit = async () => {
    if (!activityType) return;
    const normalized = normalizeBaseUrl(url);
    if (!normalized.ok) return setUrlError(normalized.message);
    setUrlError(null);
    setSending(true);
    try {
      await onSubmit(normalized.url, activityType);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.backdrop}>
      <ThemedView style={styles.dialog}>
        <ThemedText type="smallBold" style={styles.title}>
          Web ダッシュボードへアップロード
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {fileName}
        </ThemedText>

        <ThemedText type="smallBold">走行種別（必須）</ThemedText>
        <View style={styles.types}>
          {ACTIVITY_TYPES.map(({ value, icon, label }) => {
            const selected = activityType === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setActivityType(value)}
                style={[
                  styles.type,
                  { borderColor: selected ? Palette.primary : theme.backgroundSelected },
                  selected && { backgroundColor: theme.backgroundSelected },
                ]}>
                {/* 3 択だと 1 行では「ランニング」が折り返すため、絵文字とラベルを 2 行に分ける */}
                <ThemedText style={styles.typeIcon}>{icon}</ThemedText>
                <ThemedText type="smallBold">{label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText type="smallBold">アップロード先 URL</ThemedText>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.10:3000"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!sending}
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />
        {urlError && <ThemedText style={styles.error}>{urlError}</ThemedText>}

        <View style={styles.actions}>
          <Button label="キャンセル" size="small" variant="secondary" onPress={onCancel} disabled={sending} />
          <Button
            label="アップロード"
            size="small"
            onPress={submit}
            disabled={!activityType || url.trim() === ''}
            loading={sending}
          />
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: Spacing.four, backgroundColor: 'rgba(0,0,0,0.5)' },
  dialog: { borderRadius: 16, padding: Spacing.four, gap: Spacing.two },
  title: { fontSize: 18 },
  types: { flexDirection: 'row', gap: Spacing.two },
  type: { flex: 1, alignItems: 'center', borderWidth: 2, borderRadius: 12, paddingVertical: Spacing.three },
  typeIcon: { fontSize: 24, lineHeight: 32 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  error: { color: Palette.danger, fontSize: 14 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.two },
});
