import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

interface Props {
  saved: boolean;
  loading?: boolean;
  onPress: () => void;
  size?: number;
}

/** Bookmark control — save for later without applying. */
export function SaveJobButton({ saved, loading, onPress, size = 22 }: Props) {
  return (
    <Pressable
      onPress={(e) => {
        e?.stopPropagation?.();
        onPress();
      }}
      hitSlop={10}
      disabled={loading}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from shortlist' : 'Save for later'}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={size}
          color={saved ? Colors.primary : Colors.textMuted}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  pressed: { opacity: 0.7 },
});
