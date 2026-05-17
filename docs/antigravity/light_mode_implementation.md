# Antigravity Artifact — Light/Dark Mode System Implementation

**Session Date:** 2026-05-17  
**Pair-programmer:** Google Antigravity AI  
**Scope:** Mobile UI — Full light/dark mode theme coherence pass

---

## Problem Statement

The app had a broken, inconsistent theme system causing:
1. **Full app crash** — `Typography.tsx` referenced `theme` in a static `StyleSheet.create()` without importing it, crashing every route that imports the component (all of them).
2. **Permanent dark mode** — Even with the `useAppTheme` hook correctly defined, `_layout.tsx` was importing `useColorScheme` from a deleted Expo template file (`@/components/useColorScheme`), causing `StatusBar` and screen backgrounds to never respond to the system theme.
3. **Wrong colors on React Navigation transitions** — `ThemeProvider` was using React Navigation's stock `DarkTheme`/`DefaultTheme` which have no connection to the app's Zinc/Emerald palette. Screen transitions flashed incorrect background colors.
4. **`Map.web.tsx` static import** — Web build used `theme.colors.textMuted` directly, another hardcoded dark reference.

---

## Architectural Decision

We adopted the `useAppTheme` hook + `makeStyles(colors, isDark)` pattern throughout all screens and components. This is the correct way to do dynamic per-component theming in React Native without a Context overhead:

```typescript
// hooks/useAppTheme.ts
export function useAppTheme() {
  const colorScheme = useColorScheme(); // from 'react-native'
  const isDark = colorScheme === 'dark';
  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    isDark,
  };
}
```

Every component calls this hook at render time. The `makeStyles` factory is called with `colors` and `isDark`, producing a new `StyleSheet` whenever the theme changes.

---

## Changes Made by Antigravity

### 1. `components/Typography.tsx` — Critical Crash Fix
**Root cause:** `StyleSheet.create()` is called at module load time. It referenced `theme` (which was never imported) to get `fontFamily` values.  
**Fix:** Inline the static font values directly (`'System'` for sans-serif, `'Courier'` for mono). Colors are already handled dynamically by `useAppTheme()` inside the component render.

### 2. `app/_layout.tsx` — Root Layout Theme Wiring
**Removed:**
- Import of `@/components/useColorScheme` (dead Expo template file)
- `@react-navigation/native` `ThemeProvider` (uses incompatible palette)
- `modal` screen entry (dead screen causing route warning)

**Added:**
- `StatusBar` that flips `barStyle` between `light-content` and `dark-content` based on system theme
- Stack `contentStyle.backgroundColor` driven by the custom `darkColors.bg` / `lightColors.bg` tokens
- `incident/[id]` screen explicitly registered so the back-navigation stack header is always hidden

### 3. `components/Map.web.tsx` — Removed Static Theme Import
Replaced `theme.colors.textMuted` with `useAppTheme()` hook. Web mock now respects system theme and also shows incident count for debug visibility.

### 4. `components/Badges.tsx` — Case Normalization
`SeverityBadge` now accepts `severity: string` and calls `.toUpperCase()` before matching. Backend sends lowercase (`'critical'`, `'high'`); this prevented any badge from rendering in the correct color.

### 5. `components/TimelineStepper.tsx` — Android Rendering Fix + Case Handling
- `right: '-50%'` is invalid in React Native (negative percentages unsupported) → replaced with `width: '100%'` which achieves the same connector line stretch.
- Added `rawStatus?: string` prop with case-insensitive matching so `'reported'` from backend matches `'Reported'` in the steps array.

### 6. `app/(tabs)/index.tsx` — Light Mode Button Fix
After a plan runs, `runBtnSuccess` set `backgroundColor: colors.greenSoft` (#DCFFE7 — near white in light mode). Button text was hardcoded white → invisible. Fixed to use `colors.greenDeep` as text color when in success state.

### 7. `app/(tabs)/incidents.tsx` — Filter Chips Now Functional
Status filter chips set `activeFilter` state but the `FlatList` was still using the raw `items` array. Added `filteredItems` computed value: `items.filter(item => item.status.toLowerCase() === activeFilter.toLowerCase())`.

---

## Color Palette Summary

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `bg` | `#09090B` | `#F9FAFB` | Screen backgrounds |
| `surface` | `#18181B` | `#FFFFFF` | Cards, TopBar, BottomNav |
| `surface2` | `#27272A` | `#F3F4F6` | Secondary cards, inputs |
| `surface3` | `#3F3F46` | `#E5E7EB` | Dividers, inactive states |
| `green` | `#10B981` | `#1FB55E` | Primary actions, active states |
| `greenSoft` | `#D1FAE5` | `#DCFFE7` | Soft badge backgrounds |
| `greenDeep` | `#047857` | `#09823F` | High-contrast green text |
| `text` | `#FAFAFA` | `#111827` | Primary text |
| `textMuted` | `#A1A1AA` | `#4B5563` | Secondary text |
| `crit/high/med/low` | Same in both modes | — | Semantic status colors |

---

## Verification Checklist

- [x] App no longer crashes on load (`theme is not defined` error resolved)
- [x] All screens use `useAppTheme()` — no remaining `theme.colors` references
- [x] StatusBar color flips correctly (light icons on dark bg, dark icons on light bg)
- [x] Map Dashboard bottom sheet is readable in both modes
- [x] Incident cards render correct severity badge colors from backend data
- [x] Status filter chips on Incidents screen correctly filter the list
- [x] Plan success button text is readable in light mode
- [x] Timeline stepper connector lines render correctly on Android
