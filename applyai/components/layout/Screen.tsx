import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import { useResponsive } from '@/components/ui';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  safe?: boolean;
  keyboard?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
  backgroundColor?: string;
  /** Safe area edges — default top/left/right; use left/right only when a header is shown */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  children,
  scroll = true,
  safe = true,
  keyboard = false,
  style,
  contentStyle,
  scrollProps,
  backgroundColor = Colors.background,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  const { maxContentWidth, horizontalPadding, bottomPadding } = useResponsive();

  const inner = (
    <View
      style={[
        styles.inner,
        !scroll && styles.innerFill,
        {
          maxWidth: maxContentWidth,
          paddingHorizontal: horizontalPadding,
          paddingBottom: bottomPadding,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
      keyboardShouldPersistTaps="handled"
      {...scrollProps}
    >
      {inner}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.scrollContent]}>{inner}</View>
  );

  // Android already uses windowSoftInputMode=adjustResize. Forcing
  // KeyboardAvoidingView behavior="height" there often eats focus / blocks typing.
  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  if (safe) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor }, style]} edges={edges}>
        {wrapped}
      </SafeAreaView>
    );
  }

  return <View style={[styles.flex, { backgroundColor }, style]}>{wrapped}</View>;
}

/** Responsive grid for cards — 1 col mobile, 2 tablet, 3 desktop */
export function ResponsiveGrid({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { columns, gap } = useResponsive();
  const items = React.Children.toArray(children);

  if (columns === 1) {
    return <View style={style}>{children}</View>;
  }

  const itemBasis = columns === 2 ? '48%' : '31%';

  return (
    <View style={[styles.grid, { gap }, style]}>
      {items.map((child, i) => (
        <View key={i} style={{ flexBasis: itemBasis, flexGrow: 1, maxWidth: itemBasis }}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: Spacing.md,
  },
  innerFill: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
