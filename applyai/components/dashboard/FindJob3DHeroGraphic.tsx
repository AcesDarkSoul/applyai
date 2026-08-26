import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

export function FindJob3DHeroGraphic({ size = 220 }: { size?: number }) {
  return (
    <View style={[styles.container, { width: size, height: size * 0.85 }]}>
      <Svg width={size} height={size * 0.85} viewBox="0 0 240 200">
        <Defs>
          <LinearGradient id="laptopBody" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#cbd5e1" />
            <Stop offset="1" stopColor="#64748b" />
          </LinearGradient>
          <LinearGradient id="laptopScreen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1e293b" />
            <Stop offset="1" stopColor="#0f172a" />
          </LinearGradient>
          <LinearGradient id="hoodieGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#7c3aed" />
            <Stop offset="1" stopColor="#4f46e5" />
          </LinearGradient>
          <LinearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fed7aa" />
            <Stop offset="1" stopColor="#fdba74" />
          </LinearGradient>
          <LinearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#334155" />
            <Stop offset="1" stopColor="#1e293b" />
          </LinearGradient>
          <LinearGradient id="floatCardBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="rgba(255,255,255,0.18)" />
            <Stop offset="1" stopColor="rgba(255,255,255,0.05)" />
          </LinearGradient>
        </Defs>

        {/* Desk Line */}
        <Path d="M 10 180 L 230 180" stroke="rgba(255,255,255,0.15)" strokeWidth="3" strokeLinecap="round" />

        {/* Floating background chart card 1 (Top Left) */}
        <G transform="translate(15, 20)">
          <Rect width="55" height="40" rx="8" fill="url(#floatCardBg)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          {/* Mini line graph inside float card */}
          <Path d="M 8 28 L 20 18 L 32 22 L 47 12" stroke="#60a5fa" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="47" cy="12" r="3" fill="#93c5fd" />
        </G>

        {/* Floating gear/setting icon (Top Right) */}
        <G transform="translate(180, 15)">
          <Rect width="45" height="35" rx="8" fill="url(#floatCardBg)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <Rect x="10" y="10" width="25" height="5" rx="2.5" fill="#a78bfa" />
          <Rect x="10" y="19" width="16" height="5" rx="2.5" fill="#c4b5fd" />
        </G>

        {/* 3D Character Hooded Body */}
        <G transform="translate(70, 50)">
          {/* Torso/Hoodie */}
          <Path d="M 10 120 C 10 75 90 75 90 120 Z" fill="url(#hoodieGrad)" />
          <Path d="M 40 78 L 50 115 L 60 78 Z" fill="rgba(255,255,255,0.15)" />

          {/* Neck */}
          <Rect x="43" y="55" width="14" height="15" rx="4" fill="url(#skinGrad)" />

          {/* Head & Face */}
          <Circle cx="50" cy="42" r="22" fill="url(#skinGrad)" />
          {/* Ears */}
          <Circle cx="27" cy="42" r="4.5" fill="url(#skinGrad)" />
          <Circle cx="73" cy="42" r="4.5" fill="url(#skinGrad)" />

          {/* Hair */}
          <Path d="M 28 35 C 28 15 72 15 72 35 C 72 25 60 18 50 20 C 40 18 28 25 28 35 Z" fill="url(#hairGrad)" />

          {/* Eyes */}
          <Circle cx="42" cy="41" r="2.5" fill="#1e293b" />
          <Circle cx="58" cy="41" r="2.5" fill="#1e293b" />

          {/* Eyebrows */}
          <Path d="M 38 35 Q 42 33 46 35" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Path d="M 54 35 Q 58 33 62 35" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Smile */}
          <Path d="M 44 48 Q 50 53 56 48" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Arms reaching laptop */}
          <Path d="M 15 95 Q 35 110 50 115" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
          <Path d="M 85 95 Q 65 110 50 115" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
          {/* Hands */}
          <Circle cx="50" cy="115" r="7" fill="url(#skinGrad)" />
        </G>

        {/* Laptop */}
        <G transform="translate(82, 125)">
          {/* Open Screen Lid */}
          <Path d="M 5 0 L 65 0 L 60 45 L 10 45 Z" fill="url(#laptopScreen)" stroke="url(#laptopBody)" strokeWidth="2" />
          <Circle cx="35" cy="22" r="3.5" fill="rgba(255,255,255,0.25)" />
          {/* Keyboard base */}
          <Path d="M 0 45 L 70 45 L 76 52 L -6 52 Z" fill="url(#laptopBody)" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
