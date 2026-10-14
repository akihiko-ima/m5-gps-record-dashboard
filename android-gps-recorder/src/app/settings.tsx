import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { normalizeBaseUrl } from '@/lib/url';
import { getBaseUrl, saveBaseUrl } from '@/services/app-storage';

export default function SettingsScreen() {
  const theme = useTheme();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getBaseUrl().then((saved) => setUrl(saved ?? ''));
      setError(null);
    }, []),
  );

  const save = async () => {
    const normalized = normalizeBaseUrl(url);
    if (!normalized.ok) return setError(normalized.message);
    setError(null);
    await saveBaseUrl(normalized.url);
    setUrl(normalized.url);
    ToastAndroid.show('アップロード先 URL を保存しました', ToastAndroid.SHORT);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="smallBold">アップロード先 URL（Web ダッシュボード）</ThemedText>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.10:3000"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          <ThemedText type="small" themeColor="textSecondary">
            自宅 LAN 内で動かしている Web ダッシュボードのアドレスを入力します。アップロードに成功すると、使った URL
            がここに保存されます。アップロードするには、スマートフォンをサーバーと同じ Wi-Fi に接続してください。
          </ThemedText>
          <Button label="保存" onPress={save} disabled={url.trim() === ''} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: BottomTabInset + Spacing.three, gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  error: { color: Palette.danger, fontSize: 14 },
});
