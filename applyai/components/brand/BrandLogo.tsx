import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BorderRadius } from '@/constants/theme';

const logoSource = require('../../assets/images/android-icon-foreground.png');

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** ApplyAI mark — same asset as the Android adaptive icon foreground. */
export function BrandLogo({ size = 40, style }: BrandLogoProps) {
  const radius = Math.max(8, Math.round(size * 0.22));
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }, style]}>
      <Image source={logoSource} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#000',
    borderRadius: BorderRadius.md,
  },
});
