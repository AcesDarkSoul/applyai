import { Modal, Pressable, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useDrawerStore } from '@/stores/drawerStore';
import { useThemeMode } from '@/hooks/useColors';
import { getShellPalette } from '@/components/layout/shellTheme';

type Props = { unreadCount?: number };

export function AppDrawer({ unreadCount = 0 }: Props) {
  const open = useDrawerStore((s) => s.open);
  const setOpen = useDrawerStore((s) => s.setOpen);
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeMode();
  const p = getShellPalette(isDark);

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: p.sidebar,
              paddingTop: Math.max(insets.top, 8),
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ]}
        >
          <AppSidebar fill unreadCount={unreadCount} onNavigate={() => setOpen(false)} />
        </View>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close menu" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdrop: { flex: 1 },
  panel: {
    width: Platform.OS === 'web' ? 260 : '82%',
    maxWidth: 300,
  },
});
