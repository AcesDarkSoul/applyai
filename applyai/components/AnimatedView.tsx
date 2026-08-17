import React, { useEffect } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  direction?: 'up' | 'down' | 'right' | 'fade' | 'zoom';
}

export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  style,
  direction = 'up',
}: FadeInViewProps) {
  const entering =
    direction === 'up'
      ? FadeInUp.delay(delay).duration(duration).springify()
      : direction === 'down'
        ? FadeInDown.delay(delay).duration(duration).springify()
        : direction === 'right'
          ? SlideInRight.delay(delay).duration(duration).springify()
          : direction === 'zoom'
            ? ZoomIn.delay(delay).duration(duration).springify()
            : FadeIn.delay(delay).duration(duration);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

interface ScalePressProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scale?: number;
}

export function ScalePress({ children, onPress, style, scale = 0.97 }: ScalePressProps) {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  return (
    <Animated.View
      style={[animatedStyle, style]}
      onTouchStart={() => {
        pressed.value = withSpring(scale, { damping: 15 });
      }}
      onTouchEnd={() => {
        pressed.value = withSpring(1, { damping: 15 });
        onPress?.();
      }}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedProgressProps {
  progress: number;
  color?: string;
  height?: number;
  delay?: number;
}

export function AnimatedProgress({
  progress,
  color = '#22C55E',
  height = 8,
  delay = 0,
}: AnimatedProgressProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(Math.min(100, Math.max(0, progress)), { duration: 800 }));
  }, [progress, delay]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View
      style={{
        height,
        backgroundColor: 'rgba(91,92,226,0.12)',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[{ height: '100%', backgroundColor: color, borderRadius: height / 2 }, barStyle]}
      />
    </View>
  );
}
