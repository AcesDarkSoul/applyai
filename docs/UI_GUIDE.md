# ApplyAI — UI Design Guide

Design system documentation for the yellow, green, and white theme.

---

## Design Philosophy

- **Light & friendly** — White backgrounds, soft shadows
- **Action-oriented** — Green for primary actions, yellow for highlights
- **Animated** — Fade-in, slide-up, progress animations
- **Responsive** — Works on mobile, tablet, and desktop web

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Green (Primary) | `#22C55E` | Buttons, links, success, match scores |
| Green Dark | `#16A34A` | Button gradients, hover states |
| Green Light | `#4ADE80` | Accents, progress bars |
| Yellow (Secondary) | `#FACC15` | Highlights, badges, CTA accents |
| Yellow Dark | `#EAB308` | Yellow button gradients |
| White | `#FFFFFF` | Cards, inputs, tab bar |
| Background | `#F8FAFC` | Screen background |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Text Primary | `#0F172A` | Headings, body text |
| Text Secondary | `#475569` | Subtitles, descriptions |
| Text Muted | `#94A3B8` | Placeholders, hints |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#22C55E` | Match score ≥80%, accepted |
| Warning | `#F59E0B` | Match score 60–79% |
| Danger | `#EF4444` | Errors, rejected |
| Info | `#0EA5E9` | Applied status |

### Platform Colors

| Platform | Hex |
|----------|-----|
| LinkedIn | `#0A66C2` |
| Indeed | `#2164F3` |
| Naukri | `#4A90D9` |

### Gradients

```typescript
gradient:      ['#22C55E', '#16A34A', '#059669']  // Green — primary buttons
gradientYellow: ['#FACC15', '#EAB308', '#CA8A04']  // Yellow — secondary CTAs
gradientHero:   ['#22C55E', '#4ADE80', '#FACC15']  // Hero banners
```

---

## Typography

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| hero | 40px | 900 | Hero titles |
| xxl | 32px | 800 | Page titles |
| xl | 24px | 700 | Section headers |
| lg | 18px | 700 | Card titles |
| md | 16px | 600 | Body, buttons |
| sm | 14px | 500 | Labels, meta |
| xs | 12px | 600 | Badges, captions |

---

## Spacing

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| xxl | 48px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 8px | Small chips |
| md | 12px | Inputs |
| lg | 16px | Buttons |
| xl | 24px | Cards |
| xxl | 32px | Hero banners |
| full | 9999px | Pills, badges |

---

## Shadows

| Token | Usage |
|-------|-------|
| sm | Buttons, subtle elevation |
| md | Floating elements |
| lg | Hero cards (green tint) |
| card | Standard card shadow |

---

## Components

### Button

| Variant | Style |
|---------|-------|
| `primary` | Green gradient, white text |
| `secondary` | Yellow solid, dark text |
| `yellow` | Yellow gradient, dark text |
| `outline` | Transparent, green border |
| `ghost` | Transparent, muted text |

Sizes: `sm`, `md`, `lg`

### Card

| Variant | Style |
|---------|-------|
| `elevated` | White + shadow (default) |
| `outlined` | White + border |
| `default` | White, minimal |

### Badge

Pill-shaped tags for status, platform, match score.

### PlatformBadge

Shows LinkedIn/Indeed/Naukri with platform color and icon.

### StatCard

Dashboard stat with colored top border, icon, value, label.

### MatchScoreBar

Horizontal progress bar with label and percentage.

### Input

Label + icon + rounded input field with border.

---

## Animations

Located in `components/AnimatedView.tsx`:

| Component | Effect |
|-----------|--------|
| `FadeInView` | Fade + slide (up/down/right) or zoom |
| `ScalePress` | Scale down on press (0.97) |
| `AnimatedProgress` | Animated width progress bar |

**Usage:**
```tsx
<FadeInView direction="up" delay={100}>
  <Card>...</Card>
</FadeInView>
```

Uses **react-native-reanimated** entering animations.

---

## Responsive Breakpoints

Hook: `useResponsive()` in `components/ui/index.tsx`

| Breakpoint | Width | Columns |
|------------|-------|---------|
| Mobile | < 768px | 1 |
| Tablet | 768–1023px | 2 |
| Desktop | ≥ 1024px | 3 |

Content max-width: `480px` centered on larger screens.

---

## Screen Layout Patterns

### Hero Banner
Green-yellow gradient, rounded corners (32px), white text, CTA buttons.

### Tab Bar
White background, green active icon, subtle top border.

### List Cards
White card, platform badge, match score, location, description preview.

### Empty States
Large emoji, title, subtitle, centered.

---

## Iconography

Uses **@expo/vector-icons** (Ionicons) for tab bar:
- Home, Search, Flash (Smart Apply), Checkmark-circle, Person-circle

Emoji used for platform and feature icons in cards (💼 LinkedIn, 🔍 Indeed, 🇮🇳 Naukri).

---

## File Reference

| File | Purpose |
|------|---------|
| `constants/theme.ts` | Colors, spacing, shadows, PlatformConfig |
| `components/ui/index.tsx` | Button, Input, Card, Badge, etc. |
| `components/AnimatedView.tsx` | Animation wrappers |

---

*Theme file: `constants/theme.ts`*
