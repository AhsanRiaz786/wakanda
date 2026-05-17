# CityIRA Mobile - Light Mode Implementation Plan

## Objective
Implement a dynamic Light Mode for the CityIRA mobile application that perfectly matches the existing "Zinc + Emerald" aesthetic. The light mode will utilize a clean, white-space heavy design with specific vibrant green accents (`#1FB55E`, `#DCFFE7`, `#09823F`) while ensuring the bottom navigation bar and other components remain consistent with the light theme.

---

## 1. Color Palette Mapping

We will update `mobile/constants/theme.ts` to export two distinct palettes: `darkColors` and `lightColors`.

### Brand / Accent Greens
*   **green**: `#1FB55E` (Vibrant primary action)
*   **greenSoft**: `#DCFFE7` (Soft background for badges/active states)
*   **greenDeep**: `#09823F` (Deep green for high-contrast text or strokes)
*   **greenDim**: `rgba(31, 181, 94, 0.15)`
*   **greenGlow**: `rgba(31, 181, 94, 0.3)`

### Backgrounds & Surfaces
| Variable | Dark Mode | Light Mode | Purpose |
| :--- | :--- | :--- | :--- |
| `bg` | `#09090B` | `#F9FAFB` | Main app background (Whitish/Off-white) |
| `surface` | `#18181B` | `#FFFFFF` | Primary cards, Bottom Nav, Top Bar |
| `surface2` | `#27272A` | `#F3F4F6` | Secondary cards, search bars, inputs |
| `surface3` | `#3F3F46` | `#E5E7EB` | Tertiary elements, dividers |

### Typography
| Variable | Dark Mode | Light Mode | Purpose |
| :--- | :--- | :--- | :--- |
| `text` | `#FAFAFA` | `#111827` | Primary headings and body text |
| `textMuted` | `#A1A1AA` | `#4B5563` | Secondary text, subtitles |
| `textDim` | `#71717A` | `#6B7280` | Tertiary text, placeholders |

### Borders & Overlays
| Variable | Dark Mode | Light Mode | Purpose |
| :--- | :--- | :--- | :--- |
| `border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | Subtle card borders |
| `border2` | `rgba(255,255,255,0.15)` | `rgba(0,0,0,0.15)` | Pronounced borders (inputs) |

*(Note: Severity colors like `crit`, `high`, `med`, `low` will remain identical as they provide necessary contrast and semantic meaning in both modes).*

---

## 2. Architectural Refactor (Dynamic Styling)

Because `StyleSheet.create` statically compiles styles once, we must refactor how components consume the theme.

### A. The Hook: `useAppTheme.ts`
Create a new hook at `mobile/hooks/useAppTheme.ts` that uses React Native's `useColorScheme()` to detect the system theme and return the active color object.

```typescript
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, spacing, typography } from '../constants/theme';

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    isDark
  };
}
```

### B. The Pattern: `makeStyles`
In every styled component, we will replace the static `styles` object with a style generator function.

**Before:**
```typescript
const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.bg }
});
```

**After:**
```typescript
export function MyComponent() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  // ...
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { backgroundColor: colors.bg }
});
```

---

## 3. Scope of Changes (Files to Update)

To successfully implement this, the following files will be refactored to use the new `useAppTheme` hook and `makeStyles` pattern:

**Configuration:**
1. `mobile/constants/theme.ts` (Define `darkColors` and `lightColors`)
2. `mobile/hooks/useAppTheme.ts` (New file)

**Core Components:**
3. `mobile/components/BottomNav.tsx` *(Ensure background is `surface` (#FFFFFF) with dark icons, overriding the inspiration image's dark navbar)*
4. `mobile/components/TopBar.tsx`
5. `mobile/components/Typography.tsx`
6. `mobile/components/SeverityBadge.tsx`
7. `mobile/components/TraceNode.tsx`
8. `mobile/components/VoiceCommandButton.tsx`

**Screens / Layouts:**
9. `mobile/app/(tabs)/_layout.tsx` (Ensure status bar color flips correctly)
10. `mobile/app/(tabs)/index.tsx` (Map dashboard, bottom sheet overlay)
11. `mobile/app/(tabs)/incidents.tsx` (Incident feed list)
12. `mobile/app/(tabs)/report.tsx` (Form inputs and buttons)
13. `mobile/app/(tabs)/trace.tsx` (Agent trace UI)
14. `mobile/app/(tabs)/artifacts.tsx`
15. `mobile/app/incident/[id].tsx` (Incident detail view)

---

## 4. Map Styling (Special Case)
The React Native Map currently uses a dark custom `mapStyle` JSON array. To fully support light mode, we will need to provide a light `mapStyle` JSON array and swap it dynamically based on `isDark`.
