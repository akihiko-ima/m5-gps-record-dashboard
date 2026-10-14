import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';
import type { UploadStatus } from '@/services/app-storage';

const BADGES = {
  none: { label: '未アップロード', color: Palette.neutral },
  uploaded: { label: 'アップロード済み', color: Palette.success },
  failed: { label: '失敗', color: Palette.danger },
} as const;

export function UploadStatusBadge({ status }: { status: UploadStatus | undefined }) {
  const { label, color } = BADGES[status?.state ?? 'none'];
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  label: { color: Palette.onColor, fontSize: 12, fontWeight: '700' },
});
