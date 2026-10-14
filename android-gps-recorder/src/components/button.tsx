import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Palette } from '@/constants/theme';

type Variant = 'primary' | 'danger' | 'secondary';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  size?: 'large' | 'small';
  loading?: boolean;
};

export function Button({ label, variant = 'primary', size = 'large', loading, disabled, style, ...rest }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      disabled={inactive}
      style={(state) => [
        styles.base,
        size === 'small' ? styles.small : styles.large,
        variant === 'secondary' ? styles.secondary : { backgroundColor: Palette[variant] },
        inactive && styles.disabled,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? Palette.primary : Palette.onColor} />
      ) : (
        <Text
          style={[
            styles.label,
            size === 'small' && styles.smallLabel,
            variant === 'secondary' && styles.secondaryLabel,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  large: { minHeight: 56, paddingHorizontal: 24 },
  small: { minHeight: 36, paddingHorizontal: 12, borderRadius: 8 },
  secondary: { borderWidth: 1, borderColor: Palette.primary },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  label: { color: Palette.onColor, fontSize: 18, fontWeight: '700' },
  smallLabel: { fontSize: 14 },
  secondaryLabel: { color: Palette.primary },
});
